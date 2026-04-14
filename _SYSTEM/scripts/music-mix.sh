#!/usr/bin/env bash
# music-mix.sh - Add background music to a video, optionally ducking under
#                the original audio (sidechaincompress).
#
# Usage: music-mix.sh <video> <music> <output> [--music-db -12] [--duck] [--fade 1.5]
#   --music-db : music gain in dB relative to original (default -12)
#   --duck     : sidechain ducking (music dips when video has audio)
#   --fade     : fade in/out duration in seconds

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 3 ]] || die "Usage: $(basename "$0") <video> <music> <output> [--music-db -12] [--duck] [--fade 1.5]"

VIDEO="$1"; MUSIC="$2"; OUT="$3"; shift 3
MUSIC_DB="-12"
DUCK=0
FADE="1.5"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --music-db) MUSIC_DB="$2"; shift 2 ;;
    --duck)     DUCK=1; shift ;;
    --fade)     FADE="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$VIDEO" ]] || die "Not found: $VIDEO"
[[ -f "$MUSIC" ]] || die "Not found: $MUSIC"
mkdir -p "$(dirname "$OUT")"

VIDEO_DUR=$(probe_duration "$VIDEO")
FADE_OUT_START=$(awk -v d="$VIDEO_DUR" -v f="$FADE" 'BEGIN{printf "%.3f", d-f}')

# Check if video has audio stream
HAS_AUDIO=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$VIDEO" 2>/dev/null || true)

if [[ "$DUCK" == "1" && -n "$HAS_AUDIO" ]]; then
  log "Music + original (ducked) -> $OUT"
  FILTER="[1:a]volume=${MUSIC_DB}dB,afade=t=in:st=0:d=${FADE},afade=t=out:st=${FADE_OUT_START}:d=${FADE}[music];[0:a][music]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=300[mix]"
  MAP_AUDIO="[mix]"
elif [[ -n "$HAS_AUDIO" ]]; then
  log "Music + original (mixed) -> $OUT"
  FILTER="[1:a]volume=${MUSIC_DB}dB,afade=t=in:st=0:d=${FADE},afade=t=out:st=${FADE_OUT_START}:d=${FADE}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix]"
  MAP_AUDIO="[mix]"
else
  log "Video has no audio - music only"
  FILTER="[1:a]volume=${MUSIC_DB}dB,afade=t=in:st=0:d=${FADE},afade=t=out:st=${FADE_OUT_START}:d=${FADE}[mix]"
  MAP_AUDIO="[mix]"
fi

ffmpeg -hide_banner -loglevel error -stats -y \
  -i "$VIDEO" -stream_loop -1 -i "$MUSIC" \
  -filter_complex "$FILTER" \
  -map 0:v -map "$MAP_AUDIO" \
  -c:v copy \
  -c:a aac -b:a 192k -ar 48000 \
  -shortest \
  -movflags +faststart \
  "$OUT"

ok "Done: $OUT"
