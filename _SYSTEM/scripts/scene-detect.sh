#!/usr/bin/env bash
# scene-detect.sh - Automatic scene detection using PySceneDetect.
#                   Splits a long clip into individual scene files, or just
#                   prints timestamps for use in a timeline.json.
#
# Usage:
#   scene-detect.sh <input> [--threshold 27] [--split] [--out-dir PATH]
#     --threshold : content-aware detection threshold (default 27). Lower = more sensitive.
#     --split     : actually write out one mp4 per scene (otherwise just list timestamps)
#     --out-dir   : where to write scene files (default: same dir as input + /scenes/)

source "$(dirname "$0")/lib/common.sh"
VENV="$VIDEO_ROOT/_SYSTEM/.venv"
[[ -x "$VENV/bin/scenedetect" ]] || die "PySceneDetect not installed. Run:
  $VIDEO_ROOT/_SYSTEM/.venv/bin/pip install scenedetect[opencv]"

[[ $# -ge 1 ]] || die "Usage: $(basename "$0") <input> [--threshold 27] [--split] [--out-dir PATH]"

IN="$1"; shift
THRESH=27
SPLIT=0
OUT_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --threshold) THRESH="$2"; shift 2 ;;
    --split)     SPLIT=1; shift ;;
    --out-dir)   OUT_DIR="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Not found: $IN"
[[ -z "$OUT_DIR" ]] && OUT_DIR="$(dirname "$IN")/scenes"

log "Detecting scenes in $(basename "$IN") (threshold=$THRESH)"
mkdir -p "$OUT_DIR"
STATS="$OUT_DIR/$(basename "${IN%.*}").scenes.csv"

if [[ "$SPLIT" == "1" ]]; then
  "$VENV/bin/scenedetect" -i "$IN" \
    detect-content --threshold "$THRESH" \
    list-scenes -o "$OUT_DIR" -f "$(basename "${IN%.*}").scenes.csv" \
    split-video -o "$OUT_DIR" -c
  ok "Wrote scene files + CSV to $OUT_DIR"
else
  "$VENV/bin/scenedetect" -i "$IN" \
    detect-content --threshold "$THRESH" \
    list-scenes -o "$OUT_DIR" -f "$(basename "${IN%.*}").scenes.csv" --quiet
  ok "Scene list: $STATS"
  echo
  log "Detected scenes (start → end):"
  awk -F',' 'NR>2 {printf "  %2d. %s → %s (%.1fs)\n", $1, $3, $5, $8}' "$STATS" 2>/dev/null || cat "$STATS"
fi
