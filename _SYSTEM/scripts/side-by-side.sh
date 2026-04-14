#!/usr/bin/env bash
# side-by-side.sh - Create A vs B comparison video (vertical 9:16 or horizontal).
#                   Perfect for before/after, A vs D, product comparisons.
#
# Usage: side-by-side.sh <left> <right> <output> [--layout h|v] [--label-a "Before"] [--label-b "After"] [--divider 4]
#   --layout h : side by side (horizontal, 16:9 output)
#   --layout v : stacked (vertical 9:16 output - great for Reels)

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 3 ]] || die "Usage: $(basename "$0") <left> <right> <output> [--layout v] [--label-a Before] [--label-b After] [--divider 4]"

A="$1"; B="$2"; OUT="$3"; shift 3
LAYOUT="v"
LABEL_A=""
LABEL_B=""
DIVIDER=4

while [[ $# -gt 0 ]]; do
  case "$1" in
    --layout)  LAYOUT="$2"; shift 2 ;;
    --label-a) LABEL_A="$2"; shift 2 ;;
    --label-b) LABEL_B="$2"; shift 2 ;;
    --divider) DIVIDER="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$A" ]] || die "Not found: $A"
[[ -f "$B" ]] || die "Not found: $B"
mkdir -p "$(dirname "$OUT")"

# Label filter (drawtext) - only if labels given
LABEL_FILTER_A=""
LABEL_FILTER_B=""
if [[ -n "$LABEL_A" ]]; then
  LABEL_FILTER_A=",drawtext=text='${LABEL_A}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=12:x=(w-text_w)/2:y=40"
fi
if [[ -n "$LABEL_B" ]]; then
  LABEL_FILTER_B=",drawtext=text='${LABEL_B}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=12:x=(w-text_w)/2:y=40"
fi

if [[ "$LAYOUT" == "v" ]]; then
  # Stacked vertical: 1080x1920, each clip 1080x958 with 4px divider
  HALF=$((960 - DIVIDER/2))
  FILTER="[0:v]scale=1080:${HALF}:force_original_aspect_ratio=increase,crop=1080:${HALF}${LABEL_FILTER_A}[a];[1:v]scale=1080:${HALF}:force_original_aspect_ratio=increase,crop=1080:${HALF}${LABEL_FILTER_B}[b];color=black:s=1080x${DIVIDER}[div];[a][div][b]vstack=inputs=3,setsar=1"
  log "Side-by-side (vertical 1080x1920): $(basename "$A") / $(basename "$B")"
elif [[ "$LAYOUT" == "h" ]]; then
  # Horizontal: 1920x1080, each clip 958x1080
  HALF=$((960 - DIVIDER/2))
  FILTER="[0:v]scale=${HALF}:1080:force_original_aspect_ratio=increase,crop=${HALF}:1080${LABEL_FILTER_A}[a];[1:v]scale=${HALF}:1080:force_original_aspect_ratio=increase,crop=${HALF}:1080${LABEL_FILTER_B}[b];color=black:s=${DIVIDER}x1080[div];[a][div][b]hstack=inputs=3,setsar=1"
  log "Side-by-side (horizontal 1920x1080): $(basename "$A") / $(basename "$B")"
else
  die "Invalid --layout: $LAYOUT (use h or v)"
fi

ffmpeg -hide_banner -loglevel error -stats -y \
  -i "$A" -i "$B" \
  -filter_complex "$FILTER" \
  -map "0:a?" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -shortest \
  -movflags +faststart \
  "$OUT"

ok "Done: $OUT"
