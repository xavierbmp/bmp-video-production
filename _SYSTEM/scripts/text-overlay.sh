#!/usr/bin/env bash
# text-overlay.sh - Burn an animated text overlay on a video. Supports fade-in,
#                   fade-out, position presets, and optional box background.
#
# Usage: text-overlay.sh <input> <output> "Your text" [options]
# Options:
#   --pos top|middle|bottom|top-left|top-right|bottom-left|bottom-right  (default bottom)
#   --start 0.0       Time (seconds) text appears
#   --duration 3.0    How long text stays visible
#   --fade 0.3        Fade-in/out duration in seconds
#   --size 64         Font size
#   --color white     Font color
#   --box 1           Draw semi-transparent box behind text (1 or 0)
#   --box-color "black@0.5"
#   --font /System/Library/Fonts/Helvetica.ttc
#   --margin 80       Distance from edge in pixels

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 3 ]] || die "Usage: $(basename "$0") <input> <output> \"Text\" [--pos bottom] [--start 0] [--duration 3] [--fade 0.3] [--size 64] [--color white] [--box 1] [--font PATH]"

IN="$1"; OUT="$2"; TEXT="$3"; shift 3
POS="bottom"; START="0.0"; DUR="3.0"; FADE="0.3"
SIZE="64"; COLOR="white"; BOX="1"; BOXCOLOR="black@0.5"
FONT="/System/Library/Fonts/Helvetica.ttc"
MARGIN="80"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pos)       POS="$2"; shift 2 ;;
    --start)     START="$2"; shift 2 ;;
    --duration)  DUR="$2"; shift 2 ;;
    --fade)      FADE="$2"; shift 2 ;;
    --size)      SIZE="$2"; shift 2 ;;
    --color)     COLOR="$2"; shift 2 ;;
    --box)       BOX="$2"; shift 2 ;;
    --box-color) BOXCOLOR="$2"; shift 2 ;;
    --font)      FONT="$2"; shift 2 ;;
    --margin)    MARGIN="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
[[ -f "$FONT" ]] || { warn "Font not found, using default"; FONT=""; }
mkdir -p "$(dirname "$OUT")"

case "$POS" in
  top)          X="(w-text_w)/2"; Y="${MARGIN}" ;;
  bottom)       X="(w-text_w)/2"; Y="h-text_h-${MARGIN}" ;;
  middle)       X="(w-text_w)/2"; Y="(h-text_h)/2" ;;
  top-left)     X="${MARGIN}"; Y="${MARGIN}" ;;
  top-right)    X="w-text_w-${MARGIN}"; Y="${MARGIN}" ;;
  bottom-left)  X="${MARGIN}"; Y="h-text_h-${MARGIN}" ;;
  bottom-right) X="w-text_w-${MARGIN}"; Y="h-text_h-${MARGIN}" ;;
  *) die "Invalid --pos: $POS" ;;
esac

END=$(awk -v s="$START" -v d="$DUR" 'BEGIN{printf "%.3f", s+d}')
FADE_OUT_START=$(awk -v e="$END" -v f="$FADE" 'BEGIN{printf "%.3f", e-f}')
ALPHA="if(lt(t,${START}),0,if(lt(t,${START}+${FADE}),(t-${START})/${FADE},if(lt(t,${FADE_OUT_START}),1,if(lt(t,${END}),(${END}-t)/${FADE},0))))"

# Escape text for ffmpeg drawtext
ESC_TEXT=$(printf '%s' "$TEXT" | sed "s/'/\\\\'/g; s/:/\\\\:/g")

DT="drawtext=text='${ESC_TEXT}':fontsize=${SIZE}:fontcolor=${COLOR}:x=${X}:y=${Y}:enable='between(t,${START},${END})':alpha='${ALPHA}'"
[[ -n "$FONT" ]] && DT="${DT}:fontfile='${FONT}'"
[[ "$BOX" == "1" ]] && DT="${DT}:box=1:boxcolor=${BOXCOLOR}:boxborderw=20"

log "Overlaying text '${TEXT}' (${POS}, start=${START}s dur=${DUR}s)"
ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" \
  -vf "$DT" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a copy \
  -movflags +faststart \
  "$OUT"

ok "Done: $OUT"
