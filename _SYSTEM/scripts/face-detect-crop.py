#!/usr/bin/env python3
"""
BMP Video Production — Face-centered vertical crop

Detects faces in a video/image frame using OpenCV Haar cascades,
calculates a face-centered crop for vertical (9:16) reframing, and
optionally applies the crop.

Usage:
    # Just get the crop coordinates:
    face-detect-crop.py input.mp4 --target 1080x1920

    # Get crop + extract a verification frame:
    face-detect-crop.py input.mp4 --target 1080x1920 --verify verify.jpg

    # Apply the crop directly to the clip:
    face-detect-crop.py input.mp4 --target 1080x1920 --apply output.mp4

    # Use a specific reference frame time:
    face-detect-crop.py input.mp4 --target 1080x1920 --at 2.5

    # Output just the ffmpeg filter string (for pipeline use):
    face-detect-crop.py input.mp4 --target 1080x1920 --filter-only

Dependencies: opencv-python (in _SYSTEM/.venv)
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np


def extract_frame(video_path: str, timestamp: float = 2.0) -> np.ndarray:
    """Extract a single frame from a video at the given timestamp."""
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name

    cmd = [
        "ffmpeg", "-y", "-ss", str(timestamp),
        "-i", video_path, "-vframes", "1",
        "-q:v", "2", tmp_path
    ]
    subprocess.run(cmd, capture_output=True, check=True)

    frame = cv2.imread(tmp_path)
    os.unlink(tmp_path)

    if frame is None:
        raise RuntimeError(f"Failed to extract frame from {video_path} at t={timestamp}")
    return frame


def get_video_dimensions(video_path: str) -> tuple:
    """Get video width and height using ffprobe."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0", video_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    parts = result.stdout.strip().split(",")
    return int(parts[0]), int(parts[1])


def detect_face_center(frame: np.ndarray) -> tuple:
    """Detect the primary face and return its center (x, y) coordinates.
    Falls back to frame center if no face is detected."""

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Try frontal face first
    cascade_paths = [
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml",
        cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml",
        cv2.data.haarcascades + "haarcascade_profileface.xml",
    ]

    for cascade_path in cascade_paths:
        cascade = cv2.CascadeClassifier(cascade_path)
        faces = cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50),
        )

        if len(faces) > 0:
            # Pick the largest face
            areas = [w * h for (x, y, w, h) in faces]
            idx = np.argmax(areas)
            x, y, w, h = faces[idx]
            center_x = x + w // 2
            center_y = y + h // 2
            print(f"[BMP] Face detected at center=({center_x}, {center_y}), "
                  f"size={w}x{h} using {os.path.basename(cascade_path)}")
            return center_x, center_y

    # No face found — fall back to center
    h, w = frame.shape[:2]
    print(f"[BMP] WARNING: No face detected. Falling back to frame center ({w//2}, {h//2})")
    return w // 2, h // 2


def calculate_crop(src_w: int, src_h: int, target_w: int, target_h: int,
                   face_x: int, face_y: int) -> dict:
    """Calculate crop parameters to center the face in the target aspect ratio."""

    target_ratio = target_w / target_h

    # Calculate crop dimensions maintaining target aspect ratio
    # Try fitting by height first (use full height, calculate width)
    crop_h = src_h
    crop_w = int(crop_h * target_ratio)

    if crop_w > src_w:
        # Width-limited: use full width, calculate height
        crop_w = src_w
        crop_h = int(crop_w / target_ratio)

    # Make dimensions even (required by ffmpeg)
    crop_w = crop_w - (crop_w % 2)
    crop_h = crop_h - (crop_h % 2)

    # Center crop on face X position
    crop_x = face_x - crop_w // 2
    crop_x = max(0, min(crop_x, src_w - crop_w))

    # For Y: position face at upper 1/3 of frame (more natural for talking heads)
    crop_y = face_y - crop_h // 3
    crop_y = max(0, min(crop_y, src_h - crop_h))

    return {
        "crop_w": crop_w,
        "crop_h": crop_h,
        "crop_x": crop_x,
        "crop_y": crop_y,
        "face_x": face_x,
        "face_y": face_y,
        "src_w": src_w,
        "src_h": src_h,
        "target_w": target_w,
        "target_h": target_h,
        "filter": f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y},scale={target_w}:{target_h},setsar=1",
    }


def verify_crop(video_path: str, crop_info: dict, output_path: str, timestamp: float = 2.0):
    """Extract a frame with the crop applied for visual verification."""
    cmd = [
        "ffmpeg", "-y", "-ss", str(timestamp),
        "-i", video_path, "-vframes", "1",
        "-vf", crop_info["filter"],
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f"[BMP] Verification frame saved to {output_path}")
    print(f"[BMP] → Read this frame with the Read tool to confirm face centering.")


def apply_crop(video_path: str, crop_info: dict, output_path: str):
    """Apply the face-centered crop to the entire video."""
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", crop_info["filter"],
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    print(f"[BMP] Cropped video saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Face-centered crop for vertical video reframing"
    )
    parser.add_argument("input", help="Input video or image file")
    parser.add_argument("--target", default="1080x1920",
                        help="Target dimensions WxH (default: 1080x1920)")
    parser.add_argument("--at", type=float, default=2.0,
                        help="Timestamp for reference frame (default: 2.0s)")
    parser.add_argument("--verify", metavar="FILE",
                        help="Extract a verification frame to FILE")
    parser.add_argument("--apply", metavar="FILE",
                        help="Apply crop and save to FILE")
    parser.add_argument("--filter-only", action="store_true",
                        help="Output only the ffmpeg filter string")
    parser.add_argument("--json", action="store_true",
                        help="Output crop info as JSON")

    args = parser.parse_args()

    # Parse target dimensions
    target_w, target_h = map(int, args.target.split("x"))

    # Get source dimensions
    src_w, src_h = get_video_dimensions(args.input)
    print(f"[BMP] Source: {src_w}x{src_h}")

    # Extract reference frame
    frame = extract_frame(args.input, args.at)

    # Detect face
    face_x, face_y = detect_face_center(frame)

    # Calculate crop
    crop_info = calculate_crop(src_w, src_h, target_w, target_h, face_x, face_y)

    if args.filter_only:
        print(crop_info["filter"])
        return

    if args.json:
        print(json.dumps(crop_info, indent=2))
        return

    print(f"[BMP] Crop: {crop_info['crop_w']}x{crop_info['crop_h']} "
          f"at ({crop_info['crop_x']}, {crop_info['crop_y']})")
    print(f"[BMP] Filter: {crop_info['filter']}")

    if args.verify:
        verify_crop(args.input, crop_info, args.verify, args.at)

    if args.apply:
        apply_crop(args.input, crop_info, args.apply)


if __name__ == "__main__":
    main()
