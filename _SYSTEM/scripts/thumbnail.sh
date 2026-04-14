#!/usr/bin/env bash
# thumbnail.sh - Extract a still frame as JPG/PNG.
#
# Usage: thumbnail.sh <input> <output> [--at 00:00:01] [--width 1920]
#        thumbnail.sh <input> <output-prefix> --grid 3x3   (contact sheet)

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <input> <output> [--at 00:00:01] [--width 1920] | --grid 3x3"

IN="$1"; OUT="$2"; shift 2
AT="00:00:01"; WIDTH=1920; GRID=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --at)    AT="$2"; shift 2 ;;
    --width) WIDTH="$2"; shift 2 ;;
    --grid)  GRID="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
mkdir -p "$(dirname "$OUT")"

if [[ -n "$GRID" ]]; then
  log "Contact sheet (${GRID}) of $IN -> $OUT"
  COLS="${GRID%x*}"; ROWS="${GRID#*x}"
  N=$((COLS*ROWS))
  DUR=$(probe_duration "$IN")
  STEP=$(awk -v d="$DUR" -v n="$N" 'BEGIN{printf "%.3f", d/(n+1)}')
  ffmpeg -hide_banner -loglevel error -y -i "$IN" \
    -vf "fps=1/${STEP},scale=${WIDTH}:-1,tile=${COLS}x${ROWS}" \
    -frames:v 1 "$OUT"
else
  log "Frame at $AT of $IN -> $OUT"
  ffmpeg -hide_banner -loglevel error -y -ss "$AT" -i "$IN" \
    -vframes 1 -vf "scale=${WIDTH}:-2" -q:v 2 "$OUT"
fi

ok "Done: $OUT"
