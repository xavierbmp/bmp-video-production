#!/usr/bin/env bash
# subtitle-pro.sh - Generate professional subtitles using stable-ts with
#                   ASS styling. Supports editorial, social and luxury presets.
#
# Usage: subtitle-pro.sh <input.mp4> [--lang es] [--style editorial|social|luxury]
#                        [--burn] [--output subs.ass]
#   --lang    : Whisper language code (default: es)
#   --style   : ASS style preset (default: editorial)
#   --burn    : also produce a hard-burned .mp4 alongside the .ass file
#   --output  : explicit output path for the .ass file

source "$(dirname "$0")/lib/common.sh"

[[ $# -ge 1 ]] || die "Usage: $(basename "$0") <input.mp4> [--lang es] [--style editorial|social|luxury] [--burn] [--output subs.ass]"

IN="$1"; shift
LANG="es"
STYLE="editorial"
BURN=0
OUTPUT_ASS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lang)   LANG="$2";   shift 2 ;;
    --style)  STYLE="$2";  shift 2 ;;
    --burn)   BURN=1;      shift   ;;
    --output) OUTPUT_ASS="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"

# Validate style
case "$STYLE" in
  editorial|social|luxury) ;;
  *) die "Unknown style: $STYLE. Choose from: editorial social luxury" ;;
esac

VENV="$VIDEO_ROOT/_SYSTEM/.venv"
[[ -x "$VENV/bin/python" ]] || die "BMP Python venv not found at $VENV"

# Check stable_whisper is available
"$VENV/bin/python" -c "import stable_whisper" 2>/dev/null \
  || die "stable-ts not installed. Run: $VENV/bin/pip install stable-ts"

STYLE_DIR="$SYSTEM_DIR/presets/subtitle-styles"
STYLE_FILE="$STYLE_DIR/${STYLE}.ass"
[[ -f "$STYLE_FILE" ]] || die "Style file not found: $STYLE_FILE"

# Determine output path
DIR="$(dirname "$IN")"
BASE="$(basename "${IN%.*}")"

if [[ -z "$OUTPUT_ASS" ]]; then
  OUTPUT_ASS="${DIR}/${BASE}.ass"
fi

mkdir -p "$(dirname "$OUTPUT_ASS")"

RAW_ASS="$(dirname "$OUTPUT_ASS")/.${BASE}_raw.ass"

log "Transcribing with stable-ts (lang=$LANG, model=base) ..."
"$VENV/bin/python" - <<PYEOF
import sys
try:
    import stable_whisper
except ImportError:
    print("[ERR]  stable_whisper not installed", file=sys.stderr)
    sys.exit(1)

model = stable_whisper.load_model("base")
result = model.transcribe("$IN", language="$LANG", verbose=False)
result.to_ass("$RAW_ASS")
print(f"[OK]  Raw ASS written: $RAW_ASS")
PYEOF

[[ $? -eq 0 ]] || die "stable-ts transcription failed"
[[ -f "$RAW_ASS" ]] || die "stable-ts did not produce an ASS file"

# Merge BMP style header with the raw dialogue lines from stable-ts
log "Applying $STYLE style to subtitles ..."
python3 - <<PYEOF2
style_header = open("$STYLE_FILE").read().strip()
raw = open("$RAW_ASS").read()

# Extract [Events] section from raw output
if "[Events]" in raw:
    events_block = raw[raw.index("[Events]"):]
else:
    print("[ERR]  No [Events] block in raw ASS", file=__import__('sys').stderr)
    __import__('sys').exit(1)

with open("$OUTPUT_ASS", "w") as f:
    f.write(style_header)
    f.write("\n\n")
    f.write(events_block)

print(f"[OK]  Styled ASS written: $OUTPUT_ASS")
PYEOF2

[[ $? -eq 0 ]] || die "ASS style merge failed"
rm -f "$RAW_ASS"

ok "Subtitles: $OUTPUT_ASS"

# Burn into video if requested
if [[ "$BURN" -eq 1 ]]; then
  require_ffmpeg
  BURNED="${DIR}/${BASE}_subtitled.mp4"
  log "Burning subtitles into $BURNED ..."
  # Escape colons in path for libass filter
  ASS_ESCAPED=$(echo "$OUTPUT_ASS" | sed 's/:/\\:/g')
  ffmpeg -hide_banner -loglevel error -stats -y \
    -i "$IN" \
    -vf "ass='${ASS_ESCAPED}'" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a copy \
    -movflags +faststart \
    "$BURNED"
  ok "Burned: $BURNED"
fi
