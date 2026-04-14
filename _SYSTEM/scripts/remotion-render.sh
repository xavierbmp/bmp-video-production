#!/usr/bin/env bash
# remotion-render.sh - Render a Remotion composition (motion graphics) to MP4.
#
# Usage:
#   remotion-render.sh <composition-id> <output.mp4> [--props '{"brand":"LIVITUM"}']
#
# Composition IDs available (see _SYSTEM/motion/bmp-motion/src/Root.tsx):
#   BMPIntro-Vertical / BMPIntro-Horizontal
#   LowerThird-Vertical / LowerThird-Horizontal
#   TitleCard-Vertical
#   EndCard-Vertical
#
# Examples:
#   remotion-render.sh BMPIntro-Vertical intro.mp4 \
#     --props '{"brand":"LIVITUM","tagline":"BY BMP","primaryColor":"#0A0A0A","accentColor":"#C6A35D"}'
#
#   remotion-render.sh TitleCard-Vertical antes.mp4 \
#     --props '{"title":"ANTES","subtitle":"Día 1","color":"#FFFFFF","backgroundColor":"#0A0A0A"}'
#
# Output has alpha where the composition allows it (use .mov prores for alpha).

source "$(dirname "$0")/lib/common.sh"

REMOTION_DIR="$VIDEO_ROOT/_SYSTEM/motion/bmp-motion"
[[ -d "$REMOTION_DIR/node_modules/remotion" ]] || die "Remotion not installed. Run:
  cd '$REMOTION_DIR' && npm install"

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <composition-id> <output.mp4> [--props '<json>']"

COMP="$1"; OUT="$2"; shift 2
PROPS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --props) PROPS="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

# Absolute output path (npx cd's into the project dir)
OUT_ABS="$(cd "$(dirname "$OUT")" 2>/dev/null && pwd)/$(basename "$OUT")" || OUT_ABS="$OUT"
mkdir -p "$(dirname "$OUT_ABS")"

log "Rendering Remotion composition '$COMP' -> $OUT_ABS"
cd "$REMOTION_DIR"

CMD=(npx remotion render src/index.ts "$COMP" "$OUT_ABS")
if [[ -n "$PROPS" ]]; then
  CMD+=(--props "$PROPS")
fi

"${CMD[@]}"
ok "Rendered: $OUT_ABS"
