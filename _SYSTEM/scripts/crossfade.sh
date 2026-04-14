#!/usr/bin/env bash
# crossfade.sh - Join multiple clips with xfade transitions.
#
# Usage: crossfade.sh -o <output> [--duration 1.0] [--transition fade] <clip1> <clip2> [clip3...]
#
# Transitions: fade, fadeblack, fadewhite, wiperight, wipeleft, wipeup, wipedown,
#              slideright, slideleft, slideup, slidedown, circleopen, circleclose,
#              rectcrop, distance, dissolve, pixelize, radial, smoothleft, hblur
# Default: fade at 1.0s
#
# All clips are normalized to 1920x1080 @ 30fps before transitions.

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

OUT=""
XDUR="1.0"
TRANS="fade"
INPUTS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o)           OUT="$2"; shift 2 ;;
    --duration)   XDUR="$2"; shift 2 ;;
    --transition) TRANS="$2"; shift 2 ;;
    -*)           die "Unknown flag: $1" ;;
    *)            INPUTS+=("$1"); shift ;;
  esac
done

[[ -n "$OUT" ]] || die "Missing -o <output>"
[[ ${#INPUTS[@]} -ge 2 ]] || die "Need at least 2 clips"
for f in "${INPUTS[@]}"; do [[ -f "$f" ]] || die "Not found: $f"; done
mkdir -p "$(dirname "$OUT")"

# Get durations
DURS=()
for f in "${INPUTS[@]}"; do DURS+=($(probe_duration "$f")); done

# Build filter_complex
CMD=(ffmpeg -hide_banner -loglevel error -stats -y)
for f in "${INPUTS[@]}"; do CMD+=(-i "$f"); done

FILTER=""
# Normalize every clip to 1920x1080 30fps
for i in "${!INPUTS[@]}"; do
  FILTER+="[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}];"
  FILTER+="[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}];"
done

# Chain xfades
# offset_k = sum of prev durations - (k-1)*xdur - xdur  (offset where transition starts in accumulated stream)
PREV="v0"; PREV_A="a0"
ACC_DUR="${DURS[0]}"
for ((i=1; i<${#INPUTS[@]}; i++)); do
  OFFSET=$(awk -v a="$ACC_DUR" -v x="$XDUR" 'BEGIN{printf "%.3f", a-x}')
  OUT_V="vx${i}"; OUT_A="ax${i}"
  FILTER+="[${PREV}][v${i}]xfade=transition=${TRANS}:duration=${XDUR}:offset=${OFFSET}[${OUT_V}];"
  FILTER+="[${PREV_A}][a${i}]acrossfade=d=${XDUR}[${OUT_A}];"
  PREV="$OUT_V"; PREV_A="$OUT_A"
  ACC_DUR=$(awk -v a="$ACC_DUR" -v d="${DURS[$i]}" -v x="$XDUR" 'BEGIN{printf "%.3f", a+d-x}')
done

log "Crossfading ${#INPUTS[@]} clips with '${TRANS}' (${XDUR}s)"
CMD+=(-filter_complex "$FILTER" -map "[${PREV}]" -map "[${PREV_A}]" \
      -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
      -c:a aac -b:a 192k -ar 48000 \
      -movflags +faststart "$OUT")
"${CMD[@]}"

ok "Done: $OUT ($(probe_duration "$OUT")s)"
