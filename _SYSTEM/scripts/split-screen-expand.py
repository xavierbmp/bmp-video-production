#!/usr/bin/env python3
"""
BMP Video Production — Split-screen expansion animator

Creates a transition where one layer of a split-screen grows to cover the
other layer, frame by frame. The growing layer is ALWAYS on top.

Usage:
    # Top image grows down over bottom video:
    split-screen-expand.py base_video.mp4 overlay_image.png output.mp4 \
        --split-at 1060 --duration 0.7 --direction down

    # Bottom grows up:
    split-screen-expand.py base_video.mp4 overlay_image.png output.mp4 \
        --split-at 860 --duration 0.7 --direction up

The base_video is the split-screen (e.g., Remotion wipe on top, b-roll on
bottom). The overlay_image is the full-frame version of the layer that grows.
The script overlays the image on top of each frame, increasing its visible
area progressively.

Dependencies: opencv-python, numpy (in _SYSTEM/.venv)
"""

import argparse
import subprocess
import sys
import os

import cv2
import numpy as np


def main():
    parser = argparse.ArgumentParser(
        description="Animate split-screen expansion (one layer covers the other)"
    )
    parser.add_argument("base", help="Base split-screen video")
    parser.add_argument("overlay", help="Full-frame image (1080x1920) of the growing layer")
    parser.add_argument("output", help="Output video path")
    parser.add_argument("--split-at", type=int, default=1060,
                        help="Y position of the split line (default: 1060)")
    parser.add_argument("--duration", type=float, default=0.7,
                        help="Duration of expansion in seconds (default: 0.7)")
    parser.add_argument("--direction", choices=["down", "up"], default="down",
                        help="Direction of expansion (default: down)")
    parser.add_argument("--fps", type=int, default=30,
                        help="Output framerate (default: 30)")
    parser.add_argument("--crossfade-to", metavar="FILE",
                        help="After expansion, crossfade into this clip (optional)")
    parser.add_argument("--crossfade-duration", type=float, default=0.3,
                        help="Crossfade duration in seconds (default: 0.3)")

    args = parser.parse_args()

    # Load overlay image
    overlay_img = cv2.imread(args.overlay)
    if overlay_img is None:
        print(f"[ERR] Cannot read overlay image: {args.overlay}", file=sys.stderr)
        sys.exit(1)

    overlay_img = cv2.resize(overlay_img, (1080, 1920))

    # Open base video
    base_cap = cv2.VideoCapture(args.base)
    if not base_cap.isOpened():
        print(f"[ERR] Cannot open base video: {args.base}", file=sys.stderr)
        sys.exit(1)

    total_frames = int(args.duration * args.fps)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(args.output, fourcc, args.fps, (1080, 1920))

    frame_count = 0
    for n in range(total_frames):
        ret, base_frame = base_cap.read()
        if not ret:
            # Loop last frame if base is shorter
            base_cap.set(cv2.CAP_PROP_POS_FRAMES, base_cap.get(cv2.CAP_PROP_POS_FRAMES) - 1)
            ret, base_frame = base_cap.read()
            if not ret:
                break

        base_frame = cv2.resize(base_frame, (1080, 1920))
        frame = base_frame.copy()

        if args.direction == "down":
            # Top layer grows from split_at toward 1920
            top_h = min(args.split_at + int((1920 - args.split_at) * n / max(total_frames - 1, 1)), 1920)
            frame[0:top_h, :] = overlay_img[0:top_h, :]
        else:
            # Bottom layer grows from split_at toward 0
            bot_start = max(args.split_at - int(args.split_at * n / max(total_frames - 1, 1)), 0)
            frame[bot_start:1920, :] = overlay_img[bot_start:1920, :]

        out.write(frame)
        frame_count += 1

    base_cap.release()
    out.release()

    print(f"[BMP] Wrote {frame_count} frames to {args.output}")

    # Re-encode to h264 with setsar=1
    temp_output = args.output + ".tmp.mp4"
    os.rename(args.output, temp_output)

    cmd = [
        "ffmpeg", "-y", "-i", temp_output,
        "-vf", "setsar=1,fps=" + str(args.fps),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p", "-an",
        args.output,
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    os.unlink(temp_output)

    print(f"[BMP] Re-encoded to h264: {args.output}")
    print(f"[BMP] SAR=1:1, {args.fps}fps, {frame_count} frames ({args.duration}s)")

    # Optional crossfade
    if args.crossfade_to:
        xfade_output = args.output.replace(".mp4", "_xfade.mp4")
        xfade_cmd = [
            "ffmpeg", "-y",
            "-i", args.output,
            "-i", args.crossfade_to,
            "-filter_complex",
            f"[0:v][1:v]xfade=transition=fade:duration={args.crossfade_duration}:offset={args.duration - args.crossfade_duration},setsar=1",
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p",
            xfade_output,
        ]
        subprocess.run(xfade_cmd, capture_output=True, check=True)
        print(f"[BMP] Crossfade saved to {xfade_output}")


if __name__ == "__main__":
    main()
