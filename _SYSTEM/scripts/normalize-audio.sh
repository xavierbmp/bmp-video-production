#!/usr/bin/env bash
# normalize-audio.sh - Two-pass EBU R128 loudness normalization (loudnorm).
#                      Produces broadcast-clean audio at the target LUFS used
#                      by social platforms (-14 LUFS for IG/TikTok/YouTube).
#
# Usage: normalize-audio.sh <input> <output> [--lufs -14] [--tp -1.0] [--lra 11]

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <input> <output> [--lufs -14] [--tp -1.0] [--lra 11]"
IN="$1"; OUT="$2"; shift 2
LUFS=-14
TP=-1.0
LRA=11
while [[ $# -gt 0 ]]; do
  case "$1" in
    --lufs) LUFS="$2"; shift 2 ;;
    --tp)   TP="$2"; shift 2 ;;
    --lra)  LRA="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
mkdir -p "$(dirname "$OUT")"

log "Pass 1: measuring loudness of $IN"
JSON=$(ffmpeg -hide_banner -i "$IN" \
  -af "loudnorm=I=${LUFS}:TP=${TP}:LRA=${LRA}:print_format=json" \
  -f null - 2>&1 | awk '/^\{/,/^\}/')

[[ -n "$JSON" ]] || die "Pass 1 failed - no loudnorm data"

# Extract measured values
get() { echo "$JSON" | grep "\"$1\"" | sed -E 's/.*: "?([^",]+)"?.*/\1/'; }
M_I=$(get input_i)
M_TP=$(get input_tp)
M_LRA=$(get input_lra)
M_THRESH=$(get input_thresh)
OFFSET=$(get target_offset)

log "Measured: I=$M_I TP=$M_TP LRA=$M_LRA Thresh=$M_THRESH Offset=$OFFSET"
log "Pass 2: encoding to $OUT (target ${LUFS} LUFS)"

ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" \
  -af "loudnorm=I=${LUFS}:TP=${TP}:LRA=${LRA}:measured_I=${M_I}:measured_TP=${M_TP}:measured_LRA=${M_LRA}:measured_thresh=${M_THRESH}:offset=${OFFSET}:linear=true:print_format=summary" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart \
  "$OUT"

ok "Normalized: $OUT"
