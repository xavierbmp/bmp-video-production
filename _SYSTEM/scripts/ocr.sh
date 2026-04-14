#!/usr/bin/env bash
# ocr.sh - Extract on-screen text from a video using tesseract.
#          Samples frames at a given interval and runs OCR on each.
#
# Usage: ocr.sh <input> [--interval 1.0] [--lang spa+eng]
#
# Prints a timeline of detected text:
#   00:00:01  "LIVITUM — Antes"
#   00:00:04  "Después de 30 días"

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg
command -v tesseract >/dev/null 2>&1 || die "tesseract not installed. Run: brew install tesseract tesseract-lang"

[[ $# -ge 1 ]] || die "Usage: $(basename "$0") <input> [--interval 1.0] [--lang spa+eng]"

IN="$1"; shift
INTERVAL=1.0
LANG="eng"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --interval) INTERVAL="$2"; shift 2 ;;
    --lang)     LANG="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Not found: $IN"

TMP=$(mktemp -d -t bmp_ocr.XXXX)
log "Extracting frames every ${INTERVAL}s..."
ffmpeg -hide_banner -loglevel error -y -i "$IN" -vf "fps=1/${INTERVAL}" "$TMP/%06d.png"

log "Running OCR ($LANG)..."
for f in "$TMP"/*.png; do
  idx=$(basename "$f" .png)
  t=$(awk -v i="$idx" -v iv="$INTERVAL" 'BEGIN{printf "%.1f", (i-1)*iv}')
  txt=$(tesseract "$f" - -l "$LANG" 2>/dev/null | tr -d '\n\r' | sed 's/^ *//; s/ *$//')
  [[ -n "$txt" && ${#txt} -gt 2 ]] && printf "  %6.1fs  %s\n" "$t" "$txt"
done

rm -rf "$TMP"
ok "OCR done"
