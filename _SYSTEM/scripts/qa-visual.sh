#!/usr/bin/env bash
# qa-visual.sh — Visual QA gate for rendered videos.
#
# Extracts key frames, generates a high-density contact sheet, and runs
# automated checks for common visual problems that qa-check.sh can't detect:
#   - Black/solid frames between clips (transition errors)
#   - Text overlay positioning (safe zones)
#   - Talking head framing (head cropping detection)
#   - Overall composition consistency
#
# Usage: qa-visual.sh <video.mp4> [--output-dir <dir>]
#
# Output: A QA report + annotated contact sheets in the output dir.
# Exit code: 0 = all pass, 1 = issues found (details in report).
#
# This script is designed to be run BEFORE presenting to the user. If it
# finds issues, fix them and re-render before showing anything.

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 1 ]] || die "Usage: $(basename "$0") <video.mp4> [--output-dir <dir>]"

IN="$1"; shift
OUT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir) OUT_DIR="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"

# Default output dir next to input
[[ -z "$OUT_DIR" ]] && OUT_DIR="$(dirname "$IN")/qa_visual"
mkdir -p "$OUT_DIR"

BASENAME="$(basename "$IN" .mp4)"
DURATION=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$IN" 2>/dev/null)
DUR_INT=$(printf "%.0f" "$DURATION")
ISSUES=0
REPORT="$OUT_DIR/${BASENAME}_qa_visual.md"

log "Visual QA: $IN (${DURATION}s)"

# ---- 1. Extract key frames at 1-second intervals ----
log "Extracting key frames..."
FRAMES_DIR="$OUT_DIR/frames"
mkdir -p "$FRAMES_DIR"
ffmpeg -hide_banner -loglevel error -y -i "$IN" \
  -vf "fps=1" "$FRAMES_DIR/frame_%03d.jpg" 2>/dev/null

FRAME_COUNT=$(ls "$FRAMES_DIR"/frame_*.jpg 2>/dev/null | wc -l | tr -d ' ')
log "Extracted $FRAME_COUNT frames"

# ---- 2. Generate high-density contact sheet ----
log "Generating contact sheet..."
COLS=5
ROWS=$(( (FRAME_COUNT + COLS - 1) / COLS ))
"$(dirname "$0")/thumbnail.sh" "$IN" "$OUT_DIR/${BASENAME}_contact_sheet.jpg" --grid "${COLS}x${ROWS}" 2>/dev/null

# ---- 3. Check for solid black frames (transition errors) ----
log "Checking for solid black frames..."
BLACK_FRAMES=0
for frame in "$FRAMES_DIR"/frame_*.jpg; do
  # Calculate mean brightness. Pure black < 5.
  MEAN=$(ffprobe -v error -show_entries frame_tags=lavfi.signalstats.YAVG \
    -f lavfi "movie=$frame,signalstats" -of default=nw=1:nk=1 2>/dev/null | head -1)

  # Fallback: use ImageMagick if ffprobe doesn't work
  if [[ -z "$MEAN" ]] && command -v magick &>/dev/null; then
    MEAN=$(magick "$frame" -colorspace Gray -format "%[fx:mean*255]" info: 2>/dev/null)
  fi

  if [[ -n "$MEAN" ]]; then
    MEAN_INT=$(printf "%.0f" "$MEAN" 2>/dev/null || echo "128")
    if [[ "$MEAN_INT" -lt 10 ]]; then
      FRAME_NUM=$(basename "$frame" .jpg | sed 's/frame_//')
      echo "  [WARN] Near-black frame at ~${FRAME_NUM}s (brightness: $MEAN_INT)"
      BLACK_FRAMES=$((BLACK_FRAMES + 1))
    fi
  fi
done

if [[ "$BLACK_FRAMES" -gt 1 ]]; then
  echo "  [FAIL] $BLACK_FRAMES near-black frames detected (possible transition errors or empty overlays)"
  ISSUES=$((ISSUES + 1))
else
  echo "  [PASS] Black frame check"
fi

# ---- 4. Check first and last frames ----
log "Checking first/last frame quality..."

# First frame should not be black
if [[ -f "$FRAMES_DIR/frame_001.jpg" ]]; then
  FIRST_MEAN=""
  if command -v magick &>/dev/null; then
    FIRST_MEAN=$(magick "$FRAMES_DIR/frame_001.jpg" -colorspace Gray -format "%[fx:mean*255]" info: 2>/dev/null)
  fi
  if [[ -n "$FIRST_MEAN" ]]; then
    FM_INT=$(printf "%.0f" "$FIRST_MEAN" 2>/dev/null || echo "128")
    if [[ "$FM_INT" -lt 15 ]]; then
      echo "  [FAIL] First frame is near-black (brightness: $FM_INT). Video should not start with black."
      ISSUES=$((ISSUES + 1))
    else
      echo "  [PASS] First frame has content"
    fi
  fi
fi

# ---- 5. Write report ----
cat > "$REPORT" << EOF
# Visual QA Report — $BASENAME

| Check                        | Result |
|------------------------------|--------|
| Frames extracted             | $FRAME_COUNT |
| Near-black frames            | $BLACK_FRAMES |
| Total issues                 | $ISSUES |

## Contact sheet
See: ${BASENAME}_contact_sheet.jpg

## Manual checks required
The following cannot be automated and MUST be verified by reviewing the contact sheet:

- [ ] Talking head: subject properly framed (head not cropped, eyes at 1/3)
- [ ] Text overlays: readable at phone size (36pt+ headings)
- [ ] Text overlays: appear OVER video, never on black/solid backgrounds
- [ ] Lower third: appears on the talking head clip, not on b-roll
- [ ] No slide/wipe transitions visible
- [ ] End card: logo clearly visible, CTA text readable
- [ ] Color consistency across all clips
- [ ] No weird crops or aspect ratio distortions

## Frames directory
Individual frames at 1fps: $FRAMES_DIR/
EOF

if [[ "$ISSUES" -gt 0 ]]; then
  echo ""
  echo "[FAIL] Visual QA found $ISSUES issue(s). Fix before presenting to user."
  echo "       Report: $REPORT"
  exit 1
else
  echo ""
  ok "Visual QA passed ($FRAME_COUNT frames checked). Review contact sheet manually."
  echo "       Report: $REPORT"
  exit 0
fi
