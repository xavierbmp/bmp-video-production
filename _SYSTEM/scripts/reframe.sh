#!/usr/bin/env bash
# reframe.sh - Convert between aspect ratios intelligently.
#              Default: center crop for "no bars" output. Optional --pad for
#              letterbox/pillarbox.
#
# Usage: reframe.sh <input> <output> <target> [--mode crop|pad|blur-bg]
#   target: 9x16 | 16x9 | 1x1 | 4x5 | <WxH>
#   mode:
#     crop    : center crop (default) - some edges lost, no bars
#     pad     : letterbox/pillarbox with black bars, full content visible
#     blur-bg : content in center, background is a blurred version (IG-style)

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 3 ]] || die "Usage: $(basename "$0") <input> <output> <9x16|16x9|1x1|4x5|WxH> [--mode crop|pad|blur-bg]"

IN="$1"; OUT="$2"; TARGET="$3"; shift 3
MODE="crop"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
mkdir -p "$(dirname "$OUT")"

case "$TARGET" in
  9x16) W=1080; H=1920 ;;
  16x9) W=1920; H=1080 ;;
  1x1)  W=1080; H=1080 ;;
  4x5)  W=1080; H=1350 ;;
  *)
    if [[ "$TARGET" =~ ^([0-9]+)x([0-9]+)$ ]]; then
      W="${BASH_REMATCH[1]}"; H="${BASH_REMATCH[2]}"
    else die "Invalid target: $TARGET"; fi ;;
esac

case "$MODE" in
  crop)
    VF="scale=if(gt(a\\,${W}/${H})\\,-2\\,${W}):if(gt(a\\,${W}/${H})\\,${H}\\,-2),crop=${W}:${H},format=yuv420p"
    ;;
  pad)
    VF="scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p"
    ;;
  blur-bg)
    VF="split=2[bg][fg];[bg]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=40:2[bgblur];[fg]scale=${W}:${H}:force_original_aspect_ratio=decrease[fgs];[bgblur][fgs]overlay=(W-w)/2:(H-h)/2,format=yuv420p"
    ;;
  *) die "Invalid --mode: $MODE" ;;
esac

log "Reframe to ${W}x${H} (${MODE})"
ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" \
  -vf "$VF" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a copy \
  -movflags +faststart \
  "$OUT"

ok "Done: $OUT"
