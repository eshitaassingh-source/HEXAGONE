import argparse
import cv2
import requests
from ultralytics import YOLO

PERSON_CLASS_ID = 0
FENCE_X = 320
track_last_side = {}


def run(source, model_path="yolov8n.pt", conf=0.4, save_path=None):
    model = YOLO(model_path)
    writer = None

    for result in model.track(
        source=source,
        classes=[PERSON_CLASS_ID],
        conf=conf,
        tracker="bytetrack.yaml",
        stream=True,
        persist=True,
        verbose=False,
    ):
        frame = result.orig_img

        h, w = frame.shape[:2]
        cv2.line(frame, (FENCE_X, 0), (FENCE_X, h), (0, 0, 255), 2)

        if result.boxes is not None and result.boxes.id is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            track_ids = result.boxes.id.cpu().numpy().astype(int)
            confs = result.boxes.conf.cpu().numpy()

            for box, track_id, c in zip(boxes, track_ids, confs):
                x1, y1, x2, y2 = map(int, box)

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

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                label = f"Person {track_id} ({c:.2f})"
                cv2.putText(
                    frame, label, (x1, max(y1 - 10, 0)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2
                )

        cv2.imshow("IBVAP - Human Detection & Tracking", frame)

        if save_path:
            if writer is None:
                h, w = frame.shape[:2]
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                writer = cv2.VideoWriter(save_path, fourcc, 25, (w, h))
            writer.write(frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    if writer:
        writer.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IBVAP human detection & tracking")
    parser.add_argument("--source", default="0")
    parser.add_argument("--model", default="yolov8n.pt")
    parser.add_argument("--conf", type=float, default=0.4)
    parser.add_argument("--save", default=None)
    args = parser.parse_args()

    source = int(args.source) if args.source.isdigit() else args.source
    run(source, model_path=args.model, conf=args.conf, save_path=args.save)