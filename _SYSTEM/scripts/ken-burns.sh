#!/usr/bin/env bash
# ken-burns.sh - Animate a still image with a Ken Burns effect (pan + zoom).
#                Turns a photo/render into a living shot — perfect for slideshows,
#                product reveals, or when you only have stills.
#
# Usage:
#   ken-burns.sh <input.jpg> <output.mp4> [options]
#     --duration 5       Length of the output clip in seconds
#     --fps 30           Output frame rate
#     --width 1080       Output width (default 1080)
#     --height 1920      Output height (default 1920)
#     --zoom 1.15        Final zoom factor (1 = no zoom, 1.2 = 20% in)
#     --direction in|out|left|right|up|down|diag
#     --easing linear|ease-in-out

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <input.jpg> <output.mp4> [options]"

IN="$1"; OUT="$2"; shift 2
DUR=5
FPS=30
W=1080
H=1920
ZOOM=1.15
DIR="in"
EASING="ease-in-out"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --duration)  DUR="$2"; shift 2 ;;
    --fps)       FPS="$2"; shift 2 ;;
    --width)     W="$2"; shift 2 ;;
    --height)    H="$2"; shift 2 ;;
    --zoom)      ZOOM="$2"; shift 2 ;;
    --direction) DIR="$2"; shift 2 ;;
    --easing)    EASING="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Not found: $IN"
mkdir -p "$(dirname "$OUT")"

TOTAL_FRAMES=$((DUR * FPS))

# Build zoom expression with easing
if [[ "$EASING" == "ease-in-out" ]]; then
  # cosine ease
  Z_EXPR="1+(${ZOOM}-1)*(0.5-0.5*cos(on/${TOTAL_FRAMES}*PI))"
else
  Z_EXPR="1+(${ZOOM}-1)*on/${TOTAL_FRAMES}"
fi

# Direction controls the anchor of the zoom
case "$DIR" in
  in)    X_EXPR="iw/2-(iw/zoom/2)"; Y_EXPR="ih/2-(ih/zoom/2)" ;;
  out)   Z_EXPR="${ZOOM}+(1-${ZOOM})*(0.5-0.5*cos(on/${TOTAL_FRAMES}*PI))"
         X_EXPR="iw/2-(iw/zoom/2)"; Y_EXPR="ih/2-(ih/zoom/2)" ;;
  left)  X_EXPR="(iw-iw/zoom)*(1-on/${TOTAL_FRAMES})"; Y_EXPR="(ih-ih/zoom)/2" ;;
  right) X_EXPR="(iw-iw/zoom)*(on/${TOTAL_FRAMES})";   Y_EXPR="(ih-ih/zoom)/2" ;;
  up)    X_EXPR="(iw-iw/zoom)/2"; Y_EXPR="(ih-ih/zoom)*(1-on/${TOTAL_FRAMES})" ;;
  down)  X_EXPR="(iw-iw/zoom)/2"; Y_EXPR="(ih-ih/zoom)*(on/${TOTAL_FRAMES})" ;;
  diag)  X_EXPR="(iw-iw/zoom)*(on/${TOTAL_FRAMES})"; Y_EXPR="(ih-ih/zoom)*(on/${TOTAL_FRAMES})" ;;
  *) die "Invalid direction: $DIR" ;;
esac

log "Ken Burns $DIR on $(basename "$IN") (${DUR}s ${W}x${H} zoom ${ZOOM}x)"

# zoompan needs a large image (supersample) for clean zoom; upscale first
ffmpeg -hide_banner -loglevel error -stats -y -loop 1 -i "$IN" \
  -vf "scale=iw*4:ih*4,zoompan=z='${Z_EXPR}':x='${X_EXPR}':y='${Y_EXPR}':d=${TOTAL_FRAMES}:s=${W}x${H}:fps=${FPS},format=yuv420p" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -t "$DUR" \
  -movflags +faststart \
  "$OUT"

ok "Done: $OUT"
