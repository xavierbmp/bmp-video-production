#!/usr/bin/env bash
# color-grade.sh - Apply a basic color grade to a clip. Supports:
#                  (a) CDL-style lift/gamma/gain + saturation + contrast
#                  (b) A 3D LUT file (.cube)
#                  (c) Editorial presets: "editorial", "warm", "cool", "luxury", "bw"
#
# Usage:
#   color-grade.sh <input> <output> --preset editorial
#   color-grade.sh <input> <output> --lut path/to/look.cube
#   color-grade.sh <input> <output> --lift 0.02 --gamma 0.98 --gain 1.05 --sat 1.1 --contrast 1.08

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 2 ]] || die "Usage: $(basename "$0") <input> <output> [--preset NAME | --lut FILE | --lift N --gamma N --gain N --sat N --contrast N]"

IN="$1"; OUT="$2"; shift 2
PRESET=""
LUT=""
LIFT=""
GAMMA=""
GAIN=""
SAT=""
CONTRAST=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preset)   PRESET="$2"; shift 2 ;;
    --lut)      LUT="$2"; shift 2 ;;
    --lift)     LIFT="$2"; shift 2 ;;
    --gamma)    GAMMA="$2"; shift 2 ;;
    --gain)     GAIN="$2"; shift 2 ;;
    --sat)      SAT="$2"; shift 2 ;;
    --contrast) CONTRAST="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Not found: $IN"
mkdir -p "$(dirname "$OUT")"

# Preset defaults
case "$PRESET" in
  editorial)  LIFT=0.01 GAMMA=0.96 GAIN=1.03 SAT=0.92 CONTRAST=1.08 ;;
  warm)       LIFT=0.02 GAMMA=0.98 GAIN=1.05 SAT=1.1  CONTRAST=1.06 ;;
  cool)       LIFT=0.0  GAMMA=0.97 GAIN=1.02 SAT=0.95 CONTRAST=1.1 ;;
  luxury)     LIFT=0.015 GAMMA=0.94 GAIN=1.02 SAT=0.88 CONTRAST=1.12 ;;
  bw)         SAT=0 CONTRAST=1.15 GAMMA=0.95 ;;
  "")         ;;
  *) die "Unknown preset: $PRESET (try editorial|warm|cool|luxury|bw)" ;;
esac

if [[ -n "$LUT" ]]; then
  [[ -f "$LUT" ]] || die "LUT not found: $LUT"
  log "Applying 3D LUT: $LUT"
  VF="lut3d='${LUT}'"
else
  FILTERS=()
  [[ -n "$CONTRAST" ]] && FILTERS+=("eq=contrast=${CONTRAST}")
  [[ -n "$SAT"      ]] && FILTERS+=("eq=saturation=${SAT}")
  [[ -n "$GAMMA"    ]] && FILTERS+=("eq=gamma=${GAMMA}")
  [[ -n "$LIFT" && -n "$GAIN" ]] && FILTERS+=("colorlevels=rimin=-${LIFT}:gimin=-${LIFT}:bimin=-${LIFT}:rimax=${GAIN}:gimax=${GAIN}:bimax=${GAIN}")
  case "$PRESET" in
    warm)   FILTERS+=("colorbalance=rs=.05:gs=0:bs=-.03:rh=.02:bh=-.02") ;;
    cool)   FILTERS+=("colorbalance=rs=-.04:gs=0:bs=.05:rh=-.02:bh=.03") ;;
    luxury) FILTERS+=("colorbalance=rs=0:gs=-.02:bs=.02:rm=.02:bm=-.02") ;;
  esac
  VF=$(IFS=','; echo "${FILTERS[*]}")
  [[ -z "$VF" ]] && die "Nothing to do — specify --preset or --lut or manual params"
  log "Grade: $VF"
fi

ffmpeg -hide_banner -loglevel error -stats -y -i "$IN" \
  -vf "$VF" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a copy -movflags +faststart "$OUT"

ok "Done: $OUT"
