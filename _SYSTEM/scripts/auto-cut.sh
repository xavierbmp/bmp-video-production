#!/usr/bin/env bash
# auto-cut.sh - Remove silence/pauses from a talking-head clip using auto-editor.
#               Produces a much tighter edit with zero manual work.
#
# Usage: auto-cut.sh <input> <output> [--threshold 0.04] [--margin 0.2]
#   --threshold : audio level below this is considered silence (0.01-0.1)
#   --margin    : seconds of padding kept around kept segments

source "$(dirname "$0")/lib/common.sh"
command -v auto-editor >/dev/null 2>&1 || PY_AUTO="python3 -m auto_editor"
command -v auto-editor >/dev/null 2>&1 && PY_AUTO="auto-editor"
command -v ${PY_AUTO%% *} >/dev/null 2>&1 || die "auto-editor not installed. Run: pip3 install --user auto-editor"

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <input> <output> [--threshold 0.04] [--margin 0.2s]"

IN="$1"; OUT="$2"; shift 2
THRESH="0.04"
MARGIN="0.2s"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --threshold) THRESH="$2"; shift 2 ;;
    --margin)    MARGIN="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
mkdir -p "$(dirname "$OUT")"

log "Auto-cutting silences (threshold=$THRESH margin=$MARGIN)"
$PY_AUTO "$IN" \
  --edit "audio:threshold=$THRESH" \
  --margin "$MARGIN" \
  --output "$OUT" \
  --no-open

ok "Cut: $OUT"
log "Original: $(probe_duration "$IN")s  →  New: $(probe_duration "$OUT")s"
