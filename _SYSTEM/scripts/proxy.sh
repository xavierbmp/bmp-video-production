#!/usr/bin/env bash
# proxy.sh - Generate editing proxies (1080p H.264, fast preset) for all raw
#            footage of a client. Idempotent: skips files whose proxy already
#            exists and is newer than the source.
#
# Usage: proxy.sh <client-name> [--height 1080] [--crf 23]

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 1 ]] || die "Usage: $(basename "$0") <client-name> [--height 1080] [--crf 23]"

CLIENT="$1"; shift
HEIGHT=1080
CRF=23
while [[ $# -gt 0 ]]; do
  case "$1" in
    --height) HEIGHT="$2"; shift 2 ;;
    --crf)    CRF="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

DIR="$(client_dir "$CLIENT")"
RAW="$DIR/01_FOOTAGE/raw"
OUT="$DIR/01_FOOTAGE/proxies"
mkdir -p "$OUT"
[[ -d "$RAW" ]] || die "No raw folder: $RAW"

log "Generating ${HEIGHT}p proxies for $CLIENT (CRF $CRF)"

shopt -s nullglob nocaseglob
COUNT=0
for src in "$RAW"/*.{mp4,mov,mxf,avi,mkv,m4v}; do
  [[ -f "$src" ]] || continue
  base="$(basename "$src")"
  out="$OUT/${base%.*}_proxy.mp4"

  if [[ -f "$out" && "$out" -nt "$src" ]]; then
    warn "Skip (proxy up to date): $base"
    continue
  fi

  log "Encoding: $base"
  ffmpeg -hide_banner -loglevel error -stats -y -i "$src" \
    -vf "scale=-2:${HEIGHT}" \
    -c:v libx264 -preset veryfast -crf "$CRF" -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ac 2 \
    -movflags +faststart \
    "$out"
  ok "Proxy: $(basename "$out")"
  COUNT=$((COUNT+1))
done

log "Done. Encoded $COUNT proxy files in $OUT"
