#!/usr/bin/env bash
# watermark.sh - Overlay a transparent PNG (logo) on a video.
#
# Usage: watermark.sh <input> <output> [--logo path] [--pos br] [--scale 0.12] [--opacity 0.85] [--margin 40]
#   pos: tl | tr | bl | br | center
#   scale: logo width as fraction of video width

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <input> <output> [--logo path] [--pos br] [--scale 0.12] [--opacity 0.85] [--margin 40]"

IN="$1"; OUT="$2"; shift 2
LOGO="$ASSETS_DIR/logos/bmp-watermark.png"
POS="br"; SCALE=0.12; OPACITY=0.85; MARGIN=40

while [[ $# -gt 0 ]]; do
  case "$1" in
    --logo)    LOGO="$2"; shift 2 ;;
    --pos)     POS="$2"; shift 2 ;;
    --scale)   SCALE="$2"; shift 2 ;;
    --opacity) OPACITY="$2"; shift 2 ;;
    --margin)  MARGIN="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
[[ -f "$LOGO" ]] || die "Logo not found: $LOGO  (drop one in _ASSETS/logos/ or pass --logo)"
mkdir -p "$(dirname "$OUT")"

case "$POS" in
  tl) XY="${MARGIN}:${MARGIN}" ;;
  tr) XY="W-w-${MARGIN}:${MARGIN}" ;;
  bl) XY="${MARGIN}:H-h-${MARGIN}" ;;
  br) XY="W-w-${MARGIN}:H-h-${MARGIN}" ;;
  center) XY="(W-w)/2:(H-h)/2" ;;
  *) die "Invalid --pos: $POS (use tl|tr|bl|br|center)" ;;
esac

log "Watermarking $IN -> $OUT (pos=$POS scale=$SCALE opacity=$OPACITY)"
ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" -i "$LOGO" \
  -filter_complex "[1:v]format=rgba,colorchannelmixer=aa=${OPACITY},scale=iw*${SCALE}*main_w/iw:-1[wm];[0:v][wm]overlay=${XY}" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a copy \
  -movflags +faststart \
  "$OUT"

ok "Done: $OUT"
