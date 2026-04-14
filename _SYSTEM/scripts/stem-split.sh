#!/usr/bin/env bash
# stem-split.sh - Split audio into vocals and instrumental stems using Demucs.
#                 Accepts an audio file (.mp3 / .wav / .flac) or a video file
#                 (audio is extracted first). Outputs vocals.wav and
#                 instrumental.wav in the requested directory.
#
# Usage: stem-split.sh <audio.mp3|video.mp4> [--output-dir ./stems]

source "$(dirname "$0")/lib/common.sh"

[[ $# -ge 1 ]] || die "Usage: $(basename "$0") <audio.mp3|video.mp4> [--output-dir ./stems]"

IN="$1"; shift
OUTPUT_DIR="./stems"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"

VENV="$VIDEO_ROOT/_SYSTEM/.venv"
DEMUCS_BIN="$VENV/bin/demucs"
[[ -x "$DEMUCS_BIN" ]] || die "Demucs not installed in BMP venv. Run:
  $VENV/bin/pip install demucs"

mkdir -p "$OUTPUT_DIR"

TMP=$(mktemp -d -t bmp_stems.XXXX)
AUDIO_IN="$IN"

# If input is a video, extract audio to WAV first
EXT="${IN##*.}"
case "${EXT,,}" in
  mp4|mov|mkv|m4v|avi|mxf)
    require_ffmpeg
    log "Video detected — extracting audio track ..."
    AUDIO_IN="$TMP/audio_extracted.wav"
    ffmpeg -hide_banner -loglevel error -y \
      -i "$IN" -vn -ar 44100 -ac 2 -c:a pcm_s16le "$AUDIO_IN"
    [[ -f "$AUDIO_IN" ]] || die "Audio extraction failed"
    ;;
  mp3|wav|flac|aiff|m4a|ogg)
    ;;
  *)
    die "Unsupported input extension: $EXT"
    ;;
esac

log "Running Demucs (two-stems: vocals / instrumental) on $(basename "$AUDIO_IN") ..."
"$DEMUCS_BIN" \
  --two-stems=vocals \
  --out "$TMP/demucs_out" \
  "$AUDIO_IN"

# Demucs writes output under: <out>/<model>/<basename_without_ext>/vocals.wav
#                              <out>/<model>/<basename_without_ext>/no_vocals.wav
STEM_DIR=$(find "$TMP/demucs_out" -type d -mindepth 2 -maxdepth 2 | head -1)
[[ -n "$STEM_DIR" ]] || die "Demucs output directory not found (unexpected layout)"

VOCALS_SRC="$STEM_DIR/vocals.wav"
INSTRUMENTAL_SRC="$STEM_DIR/no_vocals.wav"

[[ -f "$VOCALS_SRC"       ]] || die "vocals.wav not found in: $STEM_DIR"
[[ -f "$INSTRUMENTAL_SRC" ]] || die "no_vocals.wav not found in: $STEM_DIR"

cp "$VOCALS_SRC"       "$OUTPUT_DIR/vocals.wav"
cp "$INSTRUMENTAL_SRC" "$OUTPUT_DIR/instrumental.wav"

rm -rf "$TMP"

ok "Stems saved to $OUTPUT_DIR/"
ok "  vocals.wav"
ok "  instrumental.wav"
