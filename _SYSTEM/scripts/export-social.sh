#!/usr/bin/env bash
# export-social.sh - Export a master video to one or more social platforms.
#                    Reads presets from _SYSTEM/presets/export-presets.json.
#                    Handles aspect ratio conversion (letter/pillarbox + center
#                    crop options) and embeds -14 LUFS loudness.
#
# Usage:
#   export-social.sh <input> <client> <preset>           # one platform
#   export-social.sh <input> <client> all                # all platforms
#   export-social.sh <input> <client> <preset> --fit crop|pad|stretch
#
# Output goes to: CLIENTS/<client>/05_EXPORTS/<preset>/<basename>_<preset>.mp4

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg
command -v jq >/dev/null 2>&1 || die "Missing dependency: jq. Install with: brew install jq"

[[ $# -ge 3 ]] || die "Usage: $(basename "$0") <input> <client> <preset|all> [--fit crop|pad|stretch] [--suffix str]"

IN="$1"; CLIENT="$2"; PRESET="$3"; shift 3
FIT="pad"
SUFFIX=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fit)    FIT="$2"; shift 2 ;;
    --suffix) SUFFIX="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
DIR="$(client_dir "$CLIENT")"
PRESETS_FILE="$SYSTEM_DIR/presets/export-presets.json"
[[ -f "$PRESETS_FILE" ]] || die "Presets file not found: $PRESETS_FILE"

# List of presets to run
if [[ "$PRESET" == "all" ]]; then
  mapfile -t PRESETS < <(jq -r '.presets | keys[]' "$PRESETS_FILE" | grep -v '^master$')
else
  jq -e ".presets[\"$PRESET\"]" "$PRESETS_FILE" >/dev/null || die "Unknown preset: $PRESET"
  PRESETS=("$PRESET")
fi

base="$(basename "$IN")"
basename_no_ext="${base%.*}"

for p in "${PRESETS[@]}"; do
  log "=== Exporting preset: $p ==="
  W=$(jq -r ".presets[\"$p\"].width" "$PRESETS_FILE")
  H=$(jq -r ".presets[\"$p\"].height" "$PRESETS_FILE")
  FPS=$(jq -r ".presets[\"$p\"].fps" "$PRESETS_FILE")
  CRF=$(jq -r ".presets[\"$p\"].v_crf" "$PRESETS_FILE")
  VPRESET=$(jq -r ".presets[\"$p\"].v_preset" "$PRESETS_FILE")
  ABR=$(jq -r ".presets[\"$p\"].a_bitrate" "$PRESETS_FILE")
  LUFS=$(jq -r ".presets[\"$p\"].loudness_lufs" "$PRESETS_FILE")
  MAXDUR=$(jq -r ".presets[\"$p\"].max_duration_s // empty" "$PRESETS_FILE")
  VBRMAX=$(jq -r ".presets[\"$p\"].v_bitrate_max // empty" "$PRESETS_FILE")
  VBUF=$(jq -r ".presets[\"$p\"].v_bufsize // empty" "$PRESETS_FILE")

  OUT_DIR="$DIR/05_EXPORTS/$p"
  mkdir -p "$OUT_DIR"
  OUT="$OUT_DIR/${basename_no_ext}${SUFFIX}_${p}.mp4"

  # Build video filter
  case "$FIT" in
    crop)
      VF="scale=if(gt(a\\,${W}/${H})\\,-2\\,${W}):if(gt(a\\,${W}/${H})\\,${H}\\,-2),crop=${W}:${H},fps=${FPS},format=yuv420p"
      ;;
    pad)
      VF="scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black,fps=${FPS},format=yuv420p"
      ;;
    stretch)
      VF="scale=${W}:${H},fps=${FPS},format=yuv420p"
      ;;
    *) die "Invalid --fit: $FIT" ;;
  esac

  # Build duration flag if max_duration_s is set
  DUR_FLAG=()
  if [[ -n "$MAXDUR" && "$MAXDUR" != "null" ]]; then
    SRC_DUR=$(probe_duration "$IN")
    if (( $(awk -v a="$SRC_DUR" -v b="$MAXDUR" 'BEGIN{print (a>b)?1:0}') )); then
      warn "Source ${SRC_DUR}s exceeds preset max ${MAXDUR}s -> trimming"
      DUR_FLAG=(-t "$MAXDUR")
    fi
  fi

  # Bitrate caps
  BR_FLAG=()
  if [[ -n "$VBRMAX" && "$VBRMAX" != "null" ]]; then
    BR_FLAG+=(-maxrate "$VBRMAX")
    [[ -n "$VBUF" && "$VBUF" != "null" ]] && BR_FLAG+=(-bufsize "$VBUF")
  fi

  log "Encoding -> $OUT"
  ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" "${DUR_FLAG[@]}" \
    -vf "$VF" \
    -c:v libx264 -preset "$VPRESET" -crf "$CRF" -pix_fmt yuv420p \
    "${BR_FLAG[@]}" \
    -af "loudnorm=I=${LUFS}:TP=-1.0:LRA=11" \
    -c:a aac -b:a "$ABR" -ar 48000 -ac 2 \
    -movflags +faststart \
    "$OUT"
  ok "$p -> $OUT"
done

log "All exports complete."
