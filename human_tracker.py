"""
IBVAP - Human Detection & Tracking module
Detects people in a video/CCTV stream and draws a persistent bounding box
with an ID number on each person, so the same box "follows" the same
person across frames.

Setup:
    pip install ultralytics opencv-python

Run:
    python human_tracker.py --source 0                 # webcam
    python human_tracker.py --source path/to/video.mp4  # video file
    python human_tracker.py --source rtsp://<cam_ip>/stream  # IP CCTV stream
"""

import argparse
import cv2
from ultralytics import YOLO

PERSON_CLASS_ID = 0


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

        if result.boxes is not None and result.boxes.id is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            track_ids = result.boxes.id.cpu().numpy().astype(int)
            confs = result.boxes.conf.cpu().numpy()

            for box, track_id, c in zip(boxes, track_ids, confs):
                x1, y1, x2, y2 = map(int, box)
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
    parser.add_argument("--source", default="0", help="0 for webcam, or path/URL to video/RTSP stream")
    parser.add_argument("--model", default="yolov8n.pt", help="YOLOv8 weights to use")
    parser.add_argument("--conf", type=float, default=0.4, help="detection confidence threshold")
    parser.add_argument("--save", default=None, help="optional path to save annotated output video")
    args = parser.parse_args()

    source = int(args.source) if args.source.isdigit() else args.source
    run(source, model_path=args.model, conf=args.conf, save_path=args.save)