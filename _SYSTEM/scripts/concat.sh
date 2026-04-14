#!/usr/bin/env bash
# concat.sh - Join multiple clips into one.
#   --copy   : stream copy (fast, lossless, requires SAME codec/res/fps/sar)
#   --reencode (default): re-encode and normalize all clips to a target
#                         resolution/fps - safe for clips with different specs.
#
# Usage:
#   concat.sh [--copy | --reencode] -o <output> <clip1> <clip2> [clip3...]
#   concat.sh [--copy | --reencode] -o <output> -f <list.txt>
#
# list.txt = one absolute path per line.

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

MODE="reencode"
OUT=""
LIST_FILE=""
INPUTS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --copy)     MODE="copy"; shift ;;
    --reencode) MODE="reencode"; shift ;;
    -o)         OUT="$2"; shift 2 ;;
    -f)         LIST_FILE="$2"; shift 2 ;;
    -*)         die "Unknown flag: $1" ;;
    *)          INPUTS+=("$1"); shift ;;
  esac
done

[[ -n "$OUT" ]] || die "Missing -o <output>"

if [[ -n "$LIST_FILE" ]]; then
  [[ -f "$LIST_FILE" ]] || die "List file not found: $LIST_FILE"
  while IFS= read -r line; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    INPUTS+=("$line")
  done < "$LIST_FILE"
fi

[[ ${#INPUTS[@]} -ge 2 ]] || die "Need at least 2 input clips"
mkdir -p "$(dirname "$OUT")"

for f in "${INPUTS[@]}"; do
  [[ -f "$f" ]] || die "Input missing: $f"
done

if [[ "$MODE" == "copy" ]]; then
  log "Concat (stream copy): ${#INPUTS[@]} clips -> $OUT"
  TMP=$(mktemp -t bmp_concat.XXXXXX)
  for f in "${INPUTS[@]}"; do
    abs="$(cd "$(dirname "$f")" && pwd)/$(basename "$f")"
    printf "file '%s'\n" "${abs//\'/\'\\\'\'}" >> "$TMP"
  done
  ffmpeg -hide_banner -loglevel error -stats -y -f concat -safe 0 -i "$TMP" -c copy "$OUT"
  rm -f "$TMP"
else
  log "Concat (re-encode, normalized): ${#INPUTS[@]} clips -> $OUT"
  # Build filter_complex with scale+sar normalization to 1920x1080 30fps
  CMD=(ffmpeg -hide_banner -loglevel error -stats -y)
  for f in "${INPUTS[@]}"; do CMD+=(-i "$f"); done
  FILTER=""
  for i in "${!INPUTS[@]}"; do
    FILTER+="[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}];"
    FILTER+="[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}];"
  done
  for i in "${!INPUTS[@]}"; do FILTER+="[v${i}][a${i}]"; done
  FILTER+="concat=n=${#INPUTS[@]}:v=1:a=1[v][a]"
  CMD+=(-filter_complex "$FILTER" -map "[v]" -map "[a]" \
        -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
        -c:a aac -b:a 192k -ar 48000 \
        -movflags +faststart "$OUT")
  "${CMD[@]}"
fi

ok "Done: $OUT ($(probe_duration "$OUT")s)"
