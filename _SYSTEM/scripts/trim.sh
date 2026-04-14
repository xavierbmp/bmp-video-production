#!/usr/bin/env bash
# trim.sh - Cut a section out of a video. Stream-copy by default (instant,
#           lossless, but only cuts on keyframes). Use --reencode for
#           frame-accurate trims.
#
# Usage: trim.sh <input> <start> <end-or-duration> <output> [--reencode]
#   start/end accept HH:MM:SS, MM:SS or seconds. If end starts with '+' it is
#   treated as a duration relative to start.
# Examples:
#   trim.sh raw.mp4 00:00:10 00:00:25 cut.mp4
#   trim.sh raw.mp4 5 +12 cut.mp4 --reencode

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 4 ]] || die "Usage: $(basename "$0") <input> <start> <end|+duration> <output> [--reencode]"

IN="$1"; START="$2"; END="$3"; OUT="$4"; MODE="${5:-copy}"
[[ -f "$IN" ]] || die "Input not found: $IN"

if [[ "$END" == +* ]]; then
  DUR_FLAG=(-t "${END:1}")
else
  DUR_FLAG=(-to "$END")
fi

mkdir -p "$(dirname "$OUT")"

if [[ "$MODE" == "--reencode" ]]; then
  log "Trim (reencode, frame-accurate): $IN -> $OUT"
  ffmpeg -hide_banner -loglevel error -stats -y \
    -ss "$START" -i "$IN" "${DUR_FLAG[@]}" \
    -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    "$OUT"
else
  log "Trim (stream copy, keyframe-aligned): $IN -> $OUT"
  ffmpeg -hide_banner -loglevel error -stats -y \
    -ss "$START" -i "$IN" "${DUR_FLAG[@]}" \
    -c copy -avoid_negative_ts make_zero \
    "$OUT"
fi

ok "Done: $OUT ($(probe_duration "$OUT")s)"
