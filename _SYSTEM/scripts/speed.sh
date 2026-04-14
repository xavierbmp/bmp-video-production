#!/usr/bin/env bash
# speed.sh - Change video speed (with pitched-corrected audio).
#            For ratios outside 0.5x-2x, audio is chained through atempo.
#
# Usage: speed.sh <input> <output> <factor>
#   factor > 1 : faster (e.g. 1.5, 2, 4)
#   factor < 1 : slower (e.g. 0.5, 0.25)
#
# Examples:
#   speed.sh in.mp4 fast.mp4 2       # 2x faster
#   speed.sh in.mp4 slow.mp4 0.5     # half speed (slow-mo)

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -eq 3 ]] || die "Usage: $(basename "$0") <input> <output> <factor>"

IN="$1"; OUT="$2"; F="$3"
[[ -f "$IN" ]] || die "Input not found: $IN"
mkdir -p "$(dirname "$OUT")"

# Build atempo chain (each atempo must be between 0.5 and 2.0)
build_atempo() {
  local f="$1"
  local chain=""
  # Faster
  if awk -v f="$f" 'BEGIN{exit !(f>2)}'; then
    while awk -v f="$f" 'BEGIN{exit !(f>2)}'; do
      chain="${chain}atempo=2.0,"
      f=$(awk -v f="$f" 'BEGIN{printf "%.6f", f/2}')
    done
    chain="${chain}atempo=${f}"
  # Slower
  elif awk -v f="$f" 'BEGIN{exit !(f<0.5)}'; then
    while awk -v f="$f" 'BEGIN{exit !(f<0.5)}'; do
      chain="${chain}atempo=0.5,"
      f=$(awk -v f="$f" 'BEGIN{printf "%.6f", f*2}')
    done
    chain="${chain}atempo=${f}"
  else
    chain="atempo=${f}"
  fi
  echo "$chain"
}

PTS=$(awk -v f="$F" 'BEGIN{printf "%.6f", 1/f}')
ATEMPO=$(build_atempo "$F")

log "Speed change ${F}x (PTS=$PTS, $ATEMPO)"
ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" \
  -filter_complex "[0:v]setpts=${PTS}*PTS[v];[0:a]${ATEMPO}[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$OUT"

ok "Done: $OUT ($(probe_duration "$OUT")s)"
