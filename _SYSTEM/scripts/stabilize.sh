#!/usr/bin/env bash
# stabilize.sh - Two-pass video stabilization (vidstab).
#                Removes handheld shake. Great for phone footage.
#
# Usage: stabilize.sh <input> <output> [--shakiness 5] [--smoothing 30] [--zoom 1]
#   shakiness  : 1-10 (higher = detects more shake)
#   smoothing  : frames of smoothing radius (higher = steadier but more delay)
#   zoom       : 1 = auto crop to hide borders, 0 = no crop (will show black edges)

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

# Check that vidstab is compiled in
ffmpeg -hide_banner -filters 2>/dev/null | grep -q vidstab || die "ffmpeg without vidstab. You have ffmpeg-full with vidstab — something is off."

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <input> <output> [--shakiness 5] [--smoothing 30] [--zoom 1]"

IN="$1"; OUT="$2"; shift 2
SHAKE=5
SMOOTH=30
ZOOM=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --shakiness) SHAKE="$2"; shift 2 ;;
    --smoothing) SMOOTH="$2"; shift 2 ;;
    --zoom)      ZOOM="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Not found: $IN"
mkdir -p "$(dirname "$OUT")"

TRF=$(mktemp -t bmp_vidstab.XXXX).trf
log "Pass 1: analyzing shake..."
ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -vf "vidstabdetect=shakiness=${SHAKE}:accuracy=15:result=${TRF}" \
  -f null -

log "Pass 2: stabilizing (smoothing=${SMOOTH})..."
if [[ "$ZOOM" == "1" ]]; then
  VF="vidstabtransform=input=${TRF}:zoom=2:smoothing=${SMOOTH}:crop=keep,unsharp=5:5:0.8"
else
  VF="vidstabtransform=input=${TRF}:zoom=0:smoothing=${SMOOTH}:crop=black,unsharp=5:5:0.8"
fi

ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" \
  -vf "$VF" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a copy "$OUT"

rm -f "$TRF"
ok "Done: $OUT"
