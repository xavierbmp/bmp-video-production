#!/usr/bin/env bash
# remove-bg.sh - Remove background from an image or video using rembg.
#                First run downloads the ONNX model (~170MB) to ~/.u2net/.
#
# Usage:
#   remove-bg.sh <input.(jpg|png|mp4|mov)> <output.(png|webm|mov)> [--model u2net]
#
# Notes:
#   - For images, output should be .png to preserve alpha.
#   - For video, output should be .webm (VP9+alpha) or a prores4444 .mov to keep alpha.

source "$(dirname "$0")/lib/common.sh"
VENV="$VIDEO_ROOT/_SYSTEM/.venv"
[[ -x "$VENV/bin/rembg" ]] || die "rembg not installed. Run:
  $VENV/bin/pip install 'rembg[cpu]'"

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <input> <output> [--model u2net]"

IN="$1"; OUT="$2"; shift 2
MODEL="u2net"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --model) MODEL="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Not found: $IN"
mkdir -p "$(dirname "$OUT")"

EXT="${IN##*.}"
OUT_EXT="${OUT##*.}"

# Image path
case "${EXT,,}" in
  jpg|jpeg|png|webp|bmp|tiff)
    log "rembg on image $(basename "$IN") (model=$MODEL)"
    "$VENV/bin/rembg" i -m "$MODEL" "$IN" "$OUT"
    ok "Done: $OUT"
    ;;
  mp4|mov|mkv|m4v|avi|webm)
    require_ffmpeg
    log "rembg on video — extracting frames"
    TMP=$(mktemp -d -t bmp_rembg.XXXX)
    FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN" | awk -F/ '{printf "%.3f", $1/$2}')
    ffmpeg -hide_banner -loglevel error -y -i "$IN" -vsync 0 "$TMP/frame_%06d.png"
    log "Removing background from every frame (this is slow)"
    mkdir -p "$TMP/out"
    for f in "$TMP"/frame_*.png; do
      "$VENV/bin/rembg" i -m "$MODEL" "$f" "$TMP/out/$(basename "$f")"
    done
    log "Encoding back to video (alpha-preserving)"
    case "${OUT_EXT,,}" in
      webm)
        ffmpeg -hide_banner -loglevel error -stats -y -framerate "$FPS" -i "$TMP/out/frame_%06d.png" \
          -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 20 "$OUT"
        ;;
      mov)
        ffmpeg -hide_banner -loglevel error -stats -y -framerate "$FPS" -i "$TMP/out/frame_%06d.png" \
          -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le "$OUT"
        ;;
      *) die "Video output must be .webm or .mov to preserve alpha" ;;
    esac
    rm -rf "$TMP"
    ok "Done: $OUT"
    ;;
  *)
    die "Unsupported input: $EXT"
    ;;
esac
