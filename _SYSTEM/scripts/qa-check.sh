#!/usr/bin/env bash
# qa-check.sh - Automated QA for rendered videos. Checks resolution, duration,
#               loudness, audio presence, silence gaps, black frames, and
#               optionally VMAF against a master reference.
#
# Usage: qa-check.sh <video.mp4> [--target-lufs -14] [--target-duration 30]
#                    [--target-width 1080] [--target-height 1920]
#                    [--master master.mp4]

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -ge 1 ]] || die "Usage: $(basename "$0") <video.mp4> [--target-lufs -14] [--target-duration 30] [--target-width 1080] [--target-height 1920] [--master master.mp4]"

IN="$1"; shift
TARGET_LUFS=-14
TARGET_DURATION=""
TARGET_WIDTH=""
TARGET_HEIGHT=""
MASTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-lufs)     TARGET_LUFS="$2";     shift 2 ;;
    --target-duration) TARGET_DURATION="$2"; shift 2 ;;
    --target-width)    TARGET_WIDTH="$2";    shift 2 ;;
    --target-height)   TARGET_HEIGHT="$2";   shift 2 ;;
    --master)          MASTER="$2";          shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ -f "$IN" ]] || die "Input not found: $IN"
[[ -n "$MASTER" && ! -f "$MASTER" ]] && die "Master not found: $MASTER"

VENV="$VIDEO_ROOT/_SYSTEM/.venv"

# ---- helpers ----------------------------------------------------------------
pass_mark() { printf "PASS"; }
fail_mark() { printf "FAIL"; }

# ---- collect measurements ---------------------------------------------------
log "Probing $IN ..."

# Resolution
RESOLUTION=$(probe_resolution "$IN")
ACT_W="${RESOLUTION%%x*}"
ACT_H="${RESOLUTION##*x}"

# Duration
ACT_DUR=$(probe_duration "$IN")
ACT_DUR_INT=$(printf "%.0f" "$ACT_DUR")

# Audio streams present?
AUDIO_STREAMS=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | wc -l | tr -d ' ')

# Loudness (pass-1 loudnorm JSON)
log "Measuring loudness (pass 1) ..."
LUFS_JSON=$(ffmpeg -hide_banner -i "$IN" \
  -af "loudnorm=I=${TARGET_LUFS}:TP=-1.0:LRA=11:print_format=json" \
  -f null - 2>&1 | awk '/^\{/,/^\}/')

ACT_LUFS=""
if [[ -n "$LUFS_JSON" ]]; then
  ACT_LUFS=$(echo "$LUFS_JSON" | grep '"input_i"' | sed -E 's/.*: "?([^",]+)"?.*/\1/')
fi

# Silence gaps > 1 s
log "Detecting silence gaps ..."
SILENCE_GAPS=$(ffmpeg -hide_banner -i "$IN" \
  -af "silencedetect=noise=-40dB:d=1" -f null - 2>&1 \
  | grep -c "silence_start" || true)

# Black frames > 0.5 s
log "Detecting black frames ..."
BLACK_FRAMES=$(ffmpeg -hide_banner -i "$IN" \
  -vf "blackdetect=d=0.5:pic_th=0.98" -an -f null - 2>&1 \
  | grep -c "black_start" || true)

# ---- evaluate checks --------------------------------------------------------
OVERALL=0   # 0 = all pass, 1 = at least one fail

check_resolution() {
  [[ -z "$TARGET_WIDTH" && -z "$TARGET_HEIGHT" ]] && { echo "skip"; return; }
  local ok=1
  [[ -n "$TARGET_WIDTH"  && "$ACT_W" != "$TARGET_WIDTH"  ]] && ok=0
  [[ -n "$TARGET_HEIGHT" && "$ACT_H" != "$TARGET_HEIGHT" ]] && ok=0
  [[ $ok -eq 1 ]] && echo "PASS" || { echo "FAIL"; OVERALL=1; }
}

check_duration() {
  [[ -z "$TARGET_DURATION" ]] && { echo "skip"; return; }
  local diff
  diff=$(echo "$ACT_DUR $TARGET_DURATION" | awk '{d=$1-$2; print (d<0?-d:d)}')
  local within
  within=$(echo "$diff" | awk '{print ($1 <= 2.0) ? "yes" : "no"}')
  [[ "$within" == "yes" ]] && echo "PASS" || { echo "FAIL"; OVERALL=1; }
}

check_loudness() {
  [[ -z "$ACT_LUFS" ]] && { echo "skip"; return; }
  local diff
  diff=$(echo "$ACT_LUFS $TARGET_LUFS" | awk '{d=$1-$2; print (d<0?-d:d)}')
  local within
  within=$(echo "$diff" | awk '{print ($1 <= 0.5) ? "yes" : "no"}')
  [[ "$within" == "yes" ]] && echo "PASS" || { echo "FAIL"; OVERALL=1; }
}

check_audio() {
  [[ "$AUDIO_STREAMS" -gt 0 ]] && echo "PASS" || { echo "FAIL"; OVERALL=1; }
}

check_silence() {
  [[ "$SILENCE_GAPS" -eq 0 ]] && echo "PASS" || { echo "WARN"; }
}

check_black() {
  [[ "$BLACK_FRAMES" -eq 0 ]] && echo "PASS" || { echo "WARN"; }
}

RES_STATUS=$(check_resolution)
DUR_STATUS=$(check_duration)
LUFS_STATUS=$(check_loudness)
AUDIO_STATUS=$(check_audio)
SILENCE_STATUS=$(check_silence)
BLACK_STATUS=$(check_black)

# ---- optional VMAF ----------------------------------------------------------
VMAF_STATUS="skip"
VMAF_SCORE="-"
if [[ -n "$MASTER" ]]; then
  if [[ -x "$VENV/bin/python" ]]; then
    log "Computing VMAF vs master ..."
    VMAF_OUT=$(mktemp -t bmp_vmaf.XXXX.json)
    "$VENV/bin/python" - <<PYEOF 2>/dev/null
import subprocess, sys
cmd = [
    "ffmpeg", "-hide_banner", "-loglevel", "error",
    "-i", "$IN",
    "-i", "$MASTER",
    "-lavfi", "libvmaf=log_fmt=json:log_path=$VMAF_OUT:n_threads=4",
    "-f", "null", "-"
]
r = subprocess.run(cmd)
sys.exit(r.returncode)
PYEOF
    if [[ -f "$VMAF_OUT" && -s "$VMAF_OUT" ]]; then
      VMAF_SCORE=$(python3 -c "import json,sys; d=json.load(open('$VMAF_OUT')); print(round(d['pooled_metrics']['vmaf']['mean'],2))" 2>/dev/null || echo "-")
      if [[ "$VMAF_SCORE" != "-" ]]; then
        VMAF_PASS=$(echo "$VMAF_SCORE" | awk '{print ($1 >= 85) ? "PASS" : "FAIL"}')
        VMAF_STATUS="$VMAF_PASS"
        [[ "$VMAF_PASS" == "FAIL" ]] && OVERALL=1
      fi
    fi
    rm -f "$VMAF_OUT"
  else
    warn "ffmpeg-quality-metrics venv not found; skipping VMAF"
  fi
fi

# ---- build target strings ---------------------------------------------------
RES_TARGET="${TARGET_WIDTH:-?}x${TARGET_HEIGHT:-?}"
DUR_TARGET="${TARGET_DURATION:--}s (±2s)"
LUFS_TARGET="${TARGET_LUFS} LUFS (±0.5)"
ACT_LUFS_DISP="${ACT_LUFS:--}"

# ---- print markdown table ---------------------------------------------------
printf "\n## BMP QA Report — %s\n\n" "$(basename "$IN")"
printf "| Check             | Target              | Actual                | Status |\n"
printf "|-------------------|---------------------|-----------------------|--------|\n"
printf "| Resolution        | %-19s | %-21s | %-6s |\n" "$RES_TARGET" "${ACT_W}x${ACT_H}" "$RES_STATUS"
printf "| Duration          | %-19s | %-21s | %-6s |\n" "$DUR_TARGET" "${ACT_DUR_INT}s" "$DUR_STATUS"
printf "| Loudness          | %-19s | %-21s | %-6s |\n" "$LUFS_TARGET" "${ACT_LUFS_DISP} LUFS" "$LUFS_STATUS"
printf "| Audio present     | %-19s | %-21s | %-6s |\n" "yes" "${AUDIO_STREAMS} stream(s)" "$AUDIO_STATUS"
printf "| Silence gaps >1s  | %-19s | %-21s | %-6s |\n" "0" "${SILENCE_GAPS} gap(s)" "$SILENCE_STATUS"
printf "| Black frames >0.5s| %-19s | %-21s | %-6s |\n" "0" "${BLACK_FRAMES} segment(s)" "$BLACK_STATUS"
printf "| VMAF vs master    | %-19s | %-21s | %-6s |\n" "≥85" "$VMAF_SCORE" "$VMAF_STATUS"
printf "\n"

if [[ "$OVERALL" -eq 0 ]]; then
  ok "All required checks passed."
else
  err "One or more required checks FAILED."
fi

exit "$OVERALL"
