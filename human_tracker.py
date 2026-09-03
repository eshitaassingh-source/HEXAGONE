import argparse
import time
import cv2
import requests
import torch
from ultralytics import YOLO

from zero_dce_model import load_model, enhance_frame, is_dark

PERSON_CLASS_ID = 0
VEHICLE_CLASS_IDS = [2, 3, 5, 7]  # car, motorcycle, bus, truck (COCO classes)
FENCE_X = 320
ALERT_COOLDOWN = 5  # seconds - min gap between alerts for the same vehicle class
DARK_THRESHOLD = 70  # mean grayscale brightness below this triggers Zero-DCE

track_last_side = {}
alerted_vehicles = set()
last_alert_time = {}


def run(source, model_path="yolov8n.pt", conf=0.4, save_path=None,
        night_mode=False, dce_weights="Epoch99.pth"):
    model = YOLO(model_path)
    writer = None

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dce_model = None
    if night_mode:
        print("Loading Zero-DCE low-light model...")
        dce_model = load_model(dce_weights, device=device)
        print("Zero-DCE ready.")

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Could not open source: {source}")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        enhanced_this_frame = False
        if night_mode and is_dark(frame, DARK_THRESHOLD):
            frame = enhance_frame(frame, dce_model, device=device)
            enhanced_this_frame = True

        results = model.track(
            frame,
            classes=[PERSON_CLASS_ID] + VEHICLE_CLASS_IDS,
            conf=conf,
            tracker="bytetrack.yaml",
            persist=True,
            verbose=False,
        )
        result = results[0]

        h, w = frame.shape[:2]
        cv2.line(frame, (FENCE_X, 0), (FENCE_X, h), (0, 0, 255), 2)

        if enhanced_this_frame:
            cv2.putText(frame, "NIGHT MODE: Zero-DCE ENHANCED", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2)

        if result.boxes is not None and result.boxes.id is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            track_ids = result.boxes.id.cpu().numpy().astype(int)
            confs = result.boxes.conf.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy().astype(int)
            class_names = [model.names[c] for c in class_ids]

            for box, track_id, c, cls_name in zip(boxes, track_ids, confs, class_names):
                x1, y1, x2, y2 = map(int, box)

                if cls_name == "person":
                    cx = (x1 + x2) // 2
                    current_side = "left" if cx < FENCE_X else "right"
                    last_side = track_last_side.get(track_id)
                    if last_side is not None and last_side != current_side:
                        print(f"ALERT: Person {track_id} crossed the fence! ({last_side} -> {current_side})")
                        try:
                            requests.post(
                                "http://127.0.0.1:8000/alert",
                                json={"track_id": int(track_id), "alert_type": "fence_crossing"},
                                timeout=1
                            )
                        except Exception as e:
                            print(f"Could not send alert to backend: {e}")
                    track_last_side[track_id] = current_side
                    box_color = (0, 255, 0)
                else:
                    box_color = (255, 165, 0)
                    if track_id not in alerted_vehicles:
                        alerted_vehicles.add(track_id)
                        now = time.time()
                        last_time = last_alert_time.get(cls_name, 0)
                        if now - last_time >= ALERT_COOLDOWN:
                            last_alert_time[cls_name] = now
                            try:
                                requests.post(
                                    "http://127.0.0.1:8000/alert",
                                    json={"track_id": int(track_id), "alert_type": f"vehicle_detected_{cls_name}"},
                                    timeout=1
                                )
                            except Exception as e:
                                print(f"Could not send vehicle alert to backend: {e}")
                        else:
                            print(f"Skipped duplicate {cls_name} alert (cooldown active, likely same vehicle re-tracked)")

                cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                label = f"{cls_name.capitalize()} {track_id} ({c:.2f})"
                cv2.putText(
                    frame, label, (x1, max(y1 - 10, 0)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2
                )

        cv2.imshow("IBVAP - Human & Vehicle Detection & Tracking", frame)

        if save_path:
            if writer is None:
                h, w = frame.shape[:2]
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                writer = cv2.VideoWriter(save_path, fourcc, 25, (w, h))
            writer.write(frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    if writer:
        writer.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IBVAP human & vehicle detection and tracking")
    parser.add_argument("--source", default="0")
    parser.add_argument("--model", default="yolov8n.pt")
    parser.add_argument("--conf", type=float, default=0.4)
    parser.add_argument("--save", default=None)
    parser.add_argument("--night", action="store_true", help="enable Zero-DCE low-light enhancement")
    parser.add_argument("--dce-weights", default="Epoch99.pth", help="path to Zero-DCE pretrained weights")
    args = parser.parse_args()

    source = int(args.source) if args.source.isdigit() else args.source
    run(source, model_path=args.model, conf=args.conf, save_path=args.save,
        night_mode=args.night, dce_weights=args.dce_weights)