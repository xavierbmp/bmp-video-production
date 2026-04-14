#!/usr/bin/env bash
# transcribe.sh - Generate subtitles (.srt and .vtt) from a video using Whisper.
#                 Tries OpenAI Whisper (Python) first, falls back to whisper.cpp.
#
# Usage: transcribe.sh <input> [--lang es] [--model small] [--burn]
#   --burn  : also produce a .mp4 with hard-burned captions

source "$(dirname "$0")/lib/common.sh"

[[ $# -ge 1 ]] || die "Usage: $(basename "$0") <input> [--lang es] [--model small] [--burn]"
IN="$1"; shift
LANG="es"; MODEL="small"; BURN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --lang)  LANG="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --burn)  BURN=1; shift ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
DIR="$(dirname "$IN")"
BASE="$(basename "${IN%.*}")"
SRT="$DIR/${BASE}.srt"
VTT="$DIR/${BASE}.vtt"

if command -v whisper >/dev/null 2>&1; then
  log "Using OpenAI Whisper (model=$MODEL lang=$LANG)"
  whisper "$IN" --model "$MODEL" --language "$LANG" \
    --output_format srt --output_format vtt --output_dir "$DIR"
elif command -v whisper-cpp >/dev/null 2>&1 || command -v whisper.cpp >/dev/null 2>&1; then
  log "Using whisper.cpp"
  WAV="${DIR}/${BASE}.wav"
  ffmpeg -hide_banner -loglevel error -y -i "$IN" -ar 16000 -ac 1 -c:a pcm_s16le "$WAV"
  CMD=$(command -v whisper-cpp || command -v whisper.cpp)
  "$CMD" -m "${WHISPER_MODEL:-models/ggml-${MODEL}.bin}" -l "$LANG" -osrt -ovtt -of "${DIR}/${BASE}" "$WAV"
  rm -f "$WAV"
else
  die "Neither 'whisper' nor 'whisper.cpp' is installed.
Install one of:
  pip install -U openai-whisper        (Python, easy)
  brew install whisper-cpp             (faster, needs model download)"
fi

ok "Subtitles: $SRT"

if [[ "$BURN" -eq 1 ]]; then
  require_ffmpeg
  OUT="$DIR/${BASE}_subtitled.mp4"
  log "Burning subtitles into $OUT"
  ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" \
    -vf "subtitles='${SRT}':force_style='FontName=Helvetica,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=80'" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a copy "$OUT"
  ok "Burned: $OUT"
fi
