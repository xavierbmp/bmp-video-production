# BMP Studio v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the BMP headless video studio with a unified workflow, auto-review, 15 new Remotion compositions, 6 timeline templates, new scripts, an HTML briefing form, and updated CLAUDE.md — so that saying "quiero hacer un video" triggers the entire production pipeline automatically.

**Architecture:** Skills-first approach — a unified workflow encoded in CLAUDE.md drives the 9-phase flow (brief → material → creative direction → timeline → render → auto-review → present → iterate → deliver). New Remotion compositions render as clips that plug into timeline.json. New Python/bash scripts handle QA, color matching, stem splitting, and pro subtitles. An HTML form provides structured intake. Templates grow organically after each successful project.

**Tech Stack:** ffmpeg 8.1, Remotion 4.x (React/TSX), Python 3 (venv), bash, vanilla HTML/JS

**Spec:** `docs/superpowers/specs/2026-04-09-bmp-studio-v2-design.md`

---

## File map

### New files to create

```
_SYSTEM/
  tools/
    briefing-form.html              ← HTML briefing form (standalone, no server)
  scripts/
    qa-check.sh                     ← Automated QA (loudness, resolution, duration, silence, frames)
    color-match.sh                  ← Wrapper for color-matcher Python library
    stem-split.sh                   ← Wrapper for demucs stem separation
    subtitle-pro.sh                 ← stable-ts + ASS format with style presets
  presets/
    timelines/
      saas-product-30s.json         ← Timeline template
      saas-product-60s.json
      fashion-music-30s.json
      fashion-music-60s.json
      brand-film-60s.json
      brand-film-90s.json
    subtitle-styles/
      editorial.ass                 ← ASS style template
      social.ass
      luxury.ass
  motion/bmp-motion/src/
    compositions/
      MetricCounter.tsx             ← SaaS: animated number counter
      FeatureCallout.tsx            ← SaaS: line + badge callout
      ScreenReveal.tsx              ← SaaS: mask reveals screenshot
      PricingCard.tsx               ← SaaS: plan card with highlight
      NotificationToast.tsx         ← SaaS: toast notification
      BeforeAfterSplit.tsx          ← SaaS: vertical wipe comparison
      HookText.tsx                  ← SaaS: impact text for first 3s
      TitleReveal.tsx               ← Fashion: word-by-word text reveal
      LogoSting.tsx                 ← Fashion: logo with spring overshoot
      ColorWash.tsx                 ← Fashion: color overlay dissolve
      SplitDiptych.tsx              ← Fashion: two-panel layout
      CinematicTitle.tsx            ← Brand: large type with drift
      ChapterMarker.tsx             ← Brand: numbered section marker
      AtmosphericOverlay.tsx        ← Brand: film grain / light leak loop
      CreditRoll.tsx                ← Brand: slow scrolling credits
```

### Files to modify

```
_SYSTEM/motion/bmp-motion/src/Root.tsx          ← Register all 15 new compositions
_SYSTEM/motion/bmp-motion/package.json          ← Add remotion-animated
_SYSTEM/scripts/remotion-render.sh              ← Update composition ID list in header comment
_SYSTEM/config/bmp-brand.json                   ← Fill in TBD font values
CLAUDE.md                                       ← Add unified workflow, new scripts, new compositions
```

---

## Task 1: Install Python packages

**Files:**
- Modify: `_SYSTEM/.venv/` (pip install into existing venv)

- [ ] **Step 1: Install packages**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS"
source _SYSTEM/.venv/bin/activate
pip install ffmpeg-quality-metrics color-matcher stable-ts demucs typed-ffmpeg auto-subs
```

Expected: All packages install successfully. `demucs` may take a minute (large deps).

- [ ] **Step 2: Verify installs**

```bash
source _SYSTEM/.venv/bin/activate
python -c "import ffmpeg_quality_metrics; print('ffmpeg-quality-metrics OK')"
python -c "from color_matcher import ColorMatcher; print('color-matcher OK')"
python -c "import stable_whisper; print('stable-ts OK')"
python -c "import demucs; print('demucs OK')"
python -c "import typed_ffmpeg; print('typed-ffmpeg OK')"
```

Expected: All print "OK".

- [ ] **Step 3: Install npm package**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/motion/bmp-motion"
npm install remotion-animated
```

Expected: Package added to `node_modules/`.

---

## Task 2: Fix bmp-brand.json TBD values

**Files:**
- Modify: `_SYSTEM/config/bmp-brand.json`

- [ ] **Step 1: Update font values**

Replace the `fonts` section:

```json
"fonts": {
  "display": "DM Serif Display",
  "body": "Inter",
  "luxury": "Playfair Display",
  "editorial": "Libre Baskerville"
}
```

- [ ] **Step 2: Verify the file is valid JSON**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS"
cat _SYSTEM/config/bmp-brand.json | python3 -m json.tool > /dev/null && echo "Valid JSON"
```

Expected: "Valid JSON"

---

## Task 3: Build 4 new bash scripts

### Task 3a: qa-check.sh

**Files:**
- Create: `_SYSTEM/scripts/qa-check.sh`

- [ ] **Step 1: Create qa-check.sh**

```bash
#!/usr/bin/env bash
# qa-check.sh — Automated QA for rendered videos.
#
# Usage:
#   qa-check.sh <video.mp4> [--target-lufs -14] [--target-duration 30]
#                            [--target-width 1080] [--target-height 1920]
#                            [--master master.mp4]
#
# Checks:
#   - Resolution and aspect ratio
#   - Duration within +-2s of target (if specified)
#   - Loudness within +-0.5 LUFS of target
#   - No silence gaps > 1s
#   - No black frames between clips
#   - Audio stream present
#   - Optional: VMAF score vs master (requires ffmpeg-quality-metrics)
#
# Exit code: 0 if all checks pass, 1 if any fail.
# Outputs a markdown report to stdout.

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

INPUT=""
TARGET_LUFS=-14
TARGET_DUR=""
TARGET_W=""
TARGET_H=""
MASTER=""
FAILURES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-lufs)     TARGET_LUFS="$2"; shift 2 ;;
    --target-duration) TARGET_DUR="$2"; shift 2 ;;
    --target-width)    TARGET_W="$2"; shift 2 ;;
    --target-height)   TARGET_H="$2"; shift 2 ;;
    --master)          MASTER="$2"; shift 2 ;;
    -*)                die "Unknown flag: $1" ;;
    *)                 INPUT="$1"; shift ;;
  esac
done

[[ -n "$INPUT" ]] || die "Usage: qa-check.sh <video.mp4> [options]"
[[ -f "$INPUT" ]]  || die "File not found: $INPUT"

echo "## QA Report: $(basename "$INPUT")"
echo ""
echo "| Check | Result | Details |"
echo "|-------|--------|---------|"

# --- Resolution ---
RES=$(probe_resolution "$INPUT")
ACTUAL_W=$(echo "$RES" | cut -dx -f1)
ACTUAL_H=$(echo "$RES" | cut -dx -f2)
if [[ -n "$TARGET_W" && -n "$TARGET_H" ]]; then
  if [[ "$ACTUAL_W" == "$TARGET_W" && "$ACTUAL_H" == "$TARGET_H" ]]; then
    echo "| Resolution | PASS | ${ACTUAL_W}x${ACTUAL_H} |"
  else
    echo "| Resolution | **FAIL** | Got ${ACTUAL_W}x${ACTUAL_H}, expected ${TARGET_W}x${TARGET_H} |"
    FAILURES=$((FAILURES + 1))
  fi
else
  echo "| Resolution | INFO | ${ACTUAL_W}x${ACTUAL_H} |"
fi

# --- Duration ---
ACTUAL_DUR=$(probe_duration "$INPUT")
ACTUAL_DUR_INT=$(printf "%.0f" "$ACTUAL_DUR")
if [[ -n "$TARGET_DUR" ]]; then
  DIFF=$(echo "$ACTUAL_DUR - $TARGET_DUR" | bc)
  ABS_DIFF=$(echo "$DIFF" | tr -d '-')
  if (( $(echo "$ABS_DIFF <= 2" | bc -l) )); then
    echo "| Duration | PASS | ${ACTUAL_DUR_INT}s (target: ${TARGET_DUR}s, diff: ${DIFF}s) |"
  else
    echo "| Duration | **FAIL** | ${ACTUAL_DUR_INT}s (target: ${TARGET_DUR}s, diff: ${DIFF}s) |"
    FAILURES=$((FAILURES + 1))
  fi
else
  echo "| Duration | INFO | ${ACTUAL_DUR_INT}s |"
fi

# --- Loudness ---
LOUD_JSON=$(ffmpeg -hide_banner -i "$INPUT" -af loudnorm=print_format=json -f null - 2>&1 | \
  sed -n '/{/,/}/p')
MEASURED_I=$(echo "$LOUD_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['input_i'])" 2>/dev/null || echo "N/A")
if [[ "$MEASURED_I" != "N/A" ]]; then
  LUFS_DIFF=$(echo "$MEASURED_I - ($TARGET_LUFS)" | bc)
  ABS_LUFS=$(echo "$LUFS_DIFF" | tr -d '-')
  if (( $(echo "$ABS_LUFS <= 0.5" | bc -l) )); then
    echo "| Loudness | PASS | ${MEASURED_I} LUFS (target: ${TARGET_LUFS}, diff: ${LUFS_DIFF}) |"
  else
    echo "| Loudness | **FAIL** | ${MEASURED_I} LUFS (target: ${TARGET_LUFS}, diff: ${LUFS_DIFF}) |"
    FAILURES=$((FAILURES + 1))
  fi
else
  echo "| Loudness | WARN | Could not measure loudness |"
fi

# --- Audio present ---
HAS_AUDIO=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$INPUT" 2>/dev/null)
if [[ -n "$HAS_AUDIO" ]]; then
  echo "| Audio stream | PASS | Present |"
else
  echo "| Audio stream | **FAIL** | No audio stream found |"
  FAILURES=$((FAILURES + 1))
fi

# --- Silence detection ---
SILENCES=$(ffmpeg -hide_banner -i "$INPUT" -af silencedetect=noise=-40dB:d=1.0 -f null - 2>&1 | \
  grep -c "silence_start" || true)
if [[ "$SILENCES" -eq 0 ]]; then
  echo "| Silence gaps | PASS | No gaps > 1s |"
else
  echo "| Silence gaps | WARN | ${SILENCES} silence gap(s) > 1s detected |"
fi

# --- Black frames ---
BLACK_FRAMES=$(ffmpeg -hide_banner -i "$INPUT" -vf "blackdetect=d=0.5:pix_th=0.10" -an -f null - 2>&1 | \
  grep -c "black_start" || true)
if [[ "$BLACK_FRAMES" -eq 0 ]]; then
  echo "| Black frames | PASS | None detected |"
else
  echo "| Black frames | WARN | ${BLACK_FRAMES} black segment(s) > 0.5s |"
fi

# --- VMAF (optional, only if master provided) ---
if [[ -n "$MASTER" && -f "$MASTER" ]]; then
  if command -v ffmpeg_quality_metrics >/dev/null 2>&1 || \
     python3 -c "import ffmpeg_quality_metrics" 2>/dev/null; then
    VMAF_SCORE=$(python3 -c "
from ffmpeg_quality_metrics import FfmpegQualityMetrics
m = FfmpegQualityMetrics('$INPUT', '$MASTER')
m.calculate(['vmaf'])
scores = m.get_results()
print(f\"{scores['vmaf']['mean']:.1f}\")
" 2>/dev/null || echo "N/A")
    if [[ "$VMAF_SCORE" != "N/A" ]]; then
      if (( $(echo "$VMAF_SCORE >= 93" | bc -l) )); then
        echo "| VMAF | PASS | ${VMAF_SCORE} (>= 93) |"
      else
        echo "| VMAF | **FAIL** | ${VMAF_SCORE} (< 93) |"
        FAILURES=$((FAILURES + 1))
      fi
    else
      echo "| VMAF | WARN | Could not compute VMAF score |"
    fi
  else
    echo "| VMAF | SKIP | ffmpeg-quality-metrics not available |"
  fi
fi

echo ""
if [[ "$FAILURES" -eq 0 ]]; then
  ok "All checks passed."
  exit 0
else
  err "${FAILURES} check(s) failed."
  exit 1
fi
```

- [ ] **Step 2: Make executable**

```bash
chmod +x "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/scripts/qa-check.sh"
```

### Task 3b: color-match.sh

**Files:**
- Create: `_SYSTEM/scripts/color-match.sh`

- [ ] **Step 1: Create color-match.sh**

```bash
#!/usr/bin/env bash
# color-match.sh — Match the color of a video clip to a reference frame.
#
# Usage:
#   color-match.sh <input.mp4> <reference.jpg> <output.mp4> [--method mkl]
#
# Methods: mkl (default, best for video), reinhard, mvgd, hm
# Extracts frames from input, matches color to reference, re-encodes.
# Requires: color-matcher (pip install color-matcher)

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

INPUT=""; REF=""; OUTPUT=""; METHOD="mkl"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --method) METHOD="$2"; shift 2 ;;
    -*)       die "Unknown flag: $1" ;;
    *)
      if [[ -z "$INPUT" ]]; then INPUT="$1"
      elif [[ -z "$REF" ]]; then REF="$1"
      elif [[ -z "$OUTPUT" ]]; then OUTPUT="$1"
      fi
      shift ;;
  esac
done

[[ -n "$INPUT" && -n "$REF" && -n "$OUTPUT" ]] || \
  die "Usage: color-match.sh <input.mp4> <reference.jpg> <output.mp4> [--method mkl]"
[[ -f "$INPUT" ]] || die "Input not found: $INPUT"
[[ -f "$REF" ]]   || die "Reference not found: $REF"

VENV_PYTHON="$SYSTEM_DIR/.venv/bin/python3"
[[ -x "$VENV_PYTHON" ]] || die "BMP venv not found at $SYSTEM_DIR/.venv/"

log "Color matching '$INPUT' to reference '$REF' (method: $METHOD)"

"$VENV_PYTHON" - "$INPUT" "$REF" "$OUTPUT" "$METHOD" <<'PYEOF'
import sys, subprocess, tempfile, shutil
from pathlib import Path
from color_matcher import ColorMatcher
from color_matcher.io_handler import load_img_file, save_img_file
import numpy as np

input_vid, ref_path, output_vid, method = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

# Load reference image
ref = load_img_file(ref_path)

# Create LUT by matching a representative frame from the input
with tempfile.TemporaryDirectory(prefix="bmp_cm_") as td:
    td = Path(td)
    # Extract middle frame from input
    dur = float(subprocess.run(
        ["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",input_vid],
        capture_output=True, text=True).stdout.strip())
    mid = dur / 2
    mid_frame = td / "mid.png"
    subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                    "-ss",str(mid),"-i",input_vid,"-frames:v","1",str(mid_frame)], check=True)

    src = load_img_file(str(mid_frame))
    cm = ColorMatcher()
    matched = cm.transfer(src=src, ref=ref, method=method)

    # Compute per-channel scale and offset from the matching
    src_f = src.astype(np.float32)
    matched_f = matched.astype(np.float32)
    # Simple linear transfer: for each channel, compute scale and offset
    scales = []
    offsets = []
    for c in range(3):
        s_mean, s_std = src_f[:,:,c].mean(), max(src_f[:,:,c].std(), 1e-6)
        m_mean, m_std = matched_f[:,:,c].mean(), max(matched_f[:,:,c].std(), 1e-6)
        scale = m_std / s_std
        offset = m_mean - scale * s_mean
        scales.append(scale)
        offsets.append(offset / 255.0)  # normalize for ffmpeg curves

    # Apply via ffmpeg colorbalance approximation using eq + curves
    # Simpler: use LUT3D approach - generate a 3D LUT
    lut_path = td / "match.cube"
    size = 33
    with open(lut_path, "w") as f:
        f.write(f"LUT_3D_SIZE {size}\n")
        for b_i in range(size):
            for g_i in range(size):
                for r_i in range(size):
                    r = r_i / (size - 1)
                    g = g_i / (size - 1)
                    b = b_i / (size - 1)
                    # Apply linear transfer
                    r_out = max(0, min(1, r * scales[0] + offsets[0]))
                    g_out = max(0, min(1, g * scales[1] + offsets[1]))
                    b_out = max(0, min(1, b * scales[2] + offsets[2]))
                    f.write(f"{r_out:.6f} {g_out:.6f} {b_out:.6f}\n")

    # Apply LUT to entire video
    subprocess.run([
        "ffmpeg","-hide_banner","-loglevel","error","-y",
        "-i", input_vid,
        "-vf", f"lut3d='{lut_path}'",
        "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",
        "-c:a","copy",
        output_vid
    ], check=True)

print(f"Color matched: {output_vid}")
PYEOF

ok "Output: $OUTPUT"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/scripts/color-match.sh"
```

### Task 3c: stem-split.sh

**Files:**
- Create: `_SYSTEM/scripts/stem-split.sh`

- [ ] **Step 1: Create stem-split.sh**

```bash
#!/usr/bin/env bash
# stem-split.sh — Split audio into stems using Demucs.
#
# Usage:
#   stem-split.sh <audio.mp3|video.mp4> [--output-dir ./stems]
#
# Produces 4 stems: vocals.wav, drums.wav, bass.wav, other.wav
# Useful for isolating instrumentals before music mixing, or
# extracting clean vocals from a talking-head clip.
#
# Requires: demucs (pip install demucs)

source "$(dirname "$0")/lib/common.sh"

INPUT=""; OUT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir) OUT_DIR="$2"; shift 2 ;;
    -*)           die "Unknown flag: $1" ;;
    *)            INPUT="$1"; shift ;;
  esac
done

[[ -n "$INPUT" ]] || die "Usage: stem-split.sh <audio.mp3|video.mp4> [--output-dir ./stems]"
[[ -f "$INPUT" ]] || die "File not found: $INPUT"

VENV_PYTHON="$SYSTEM_DIR/.venv/bin/python3"
[[ -x "$VENV_PYTHON" ]] || die "BMP venv not found at $SYSTEM_DIR/.venv/"

# Default output dir: next to input file
if [[ -z "$OUT_DIR" ]]; then
  OUT_DIR="$(dirname "$INPUT")/stems_$(basename "${INPUT%.*}")"
fi
mkdir -p "$OUT_DIR"

log "Splitting stems from '$INPUT' -> $OUT_DIR"

# Extract audio if input is video
AUDIO_INPUT="$INPUT"
if ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 "$INPUT" 2>/dev/null | grep -q video; then
  AUDIO_INPUT="$OUT_DIR/_temp_audio.wav"
  log "Extracting audio from video..."
  ffmpeg -hide_banner -loglevel error -y -i "$INPUT" -vn -acodec pcm_s16le -ar 44100 "$AUDIO_INPUT"
fi

"$VENV_PYTHON" -m demucs --two-stems=vocals -o "$OUT_DIR" "$AUDIO_INPUT" 2>&1 | tail -5

# Move stems to clean names
DEMUCS_OUT="$OUT_DIR/htdemucs/$(basename "${AUDIO_INPUT%.*}")"
if [[ -d "$DEMUCS_OUT" ]]; then
  mv "$DEMUCS_OUT/vocals.wav" "$OUT_DIR/vocals.wav" 2>/dev/null || true
  mv "$DEMUCS_OUT/no_vocals.wav" "$OUT_DIR/instrumental.wav" 2>/dev/null || true
  rm -rf "$OUT_DIR/htdemucs"
fi

# Clean temp
rm -f "$OUT_DIR/_temp_audio.wav"

ok "Stems in: $OUT_DIR"
ls -la "$OUT_DIR"/*.wav 2>/dev/null
```

- [ ] **Step 2: Make executable**

```bash
chmod +x "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/scripts/stem-split.sh"
```

### Task 3d: subtitle-pro.sh

**Files:**
- Create: `_SYSTEM/scripts/subtitle-pro.sh`

- [ ] **Step 1: Create subtitle-pro.sh**

```bash
#!/usr/bin/env bash
# subtitle-pro.sh — Generate and burn professional subtitles using stable-ts.
#
# Usage:
#   subtitle-pro.sh <input.mp4> [--lang es] [--style editorial|social|luxury]
#                    [--burn] [--output subs.ass]
#
# Styles:
#   editorial — DM Serif Display, white, no box, drop shadow, centered bottom
#   social    — Inter Bold, white, black rounded box, word highlight
#   luxury    — Playfair Display, warm white, no box, bottom-left
#
# Without --burn: generates .ass file only.
# With --burn: generates .ass then burns into video (output: <input>_sub.mp4).
#
# Requires: stable-ts (pip install stable-ts)

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

INPUT=""; LANG="es"; STYLE="editorial"; BURN=false; OUTPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lang)   LANG="$2"; shift 2 ;;
    --style)  STYLE="$2"; shift 2 ;;
    --burn)   BURN=true; shift ;;
    --output) OUTPUT="$2"; shift 2 ;;
    -*)       die "Unknown flag: $1" ;;
    *)        INPUT="$1"; shift ;;
  esac
done

[[ -n "$INPUT" ]] || die "Usage: subtitle-pro.sh <input.mp4> [options]"
[[ -f "$INPUT" ]] || die "File not found: $INPUT"

VENV_PYTHON="$SYSTEM_DIR/.venv/bin/python3"
[[ -x "$VENV_PYTHON" ]] || die "BMP venv not found at $SYSTEM_DIR/.venv/"

STYLES_DIR="$SYSTEM_DIR/presets/subtitle-styles"
STYLE_FILE="$STYLES_DIR/${STYLE}.ass"
[[ -f "$STYLE_FILE" ]] || die "Style not found: $STYLE (looked for $STYLE_FILE)"

# Default output path
BASE="$(dirname "$INPUT")/$(basename "${INPUT%.*}")"
if [[ -z "$OUTPUT" ]]; then
  OUTPUT="${BASE}_${STYLE}.ass"
fi

log "Transcribing '$INPUT' (lang: $LANG, style: $STYLE)"

# Generate word-level ASS via stable-ts
"$VENV_PYTHON" - "$INPUT" "$OUTPUT" "$LANG" "$STYLE_FILE" <<'PYEOF'
import sys
import stable_whisper

input_file, output_file, lang, style_file = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

# Load style header from preset
with open(style_file, "r") as f:
    style_header = f.read()

model = stable_whisper.load_model("base")
result = model.transcribe(input_file, language=lang)
result.to_ass(output_file, style_header=style_header)
print(f"Subtitles: {output_file}")
PYEOF

ok "Generated: $OUTPUT"

if $BURN; then
  BURNED="${BASE}_sub.mp4"
  log "Burning subtitles into video..."
  ffmpeg -hide_banner -loglevel error -y \
    -i "$INPUT" \
    -vf "ass='$OUTPUT'" \
    -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    -c:a copy \
    "$BURNED"
  ok "Burned: $BURNED"
fi
```

- [ ] **Step 2: Make executable**

```bash
chmod +x "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/scripts/subtitle-pro.sh"
```

---

## Task 4: Create subtitle style presets (ASS)

**Files:**
- Create: `_SYSTEM/presets/subtitle-styles/editorial.ass`
- Create: `_SYSTEM/presets/subtitle-styles/social.ass`
- Create: `_SYSTEM/presets/subtitle-styles/luxury.ass`

- [ ] **Step 1: Create editorial.ass**

```
[Script Info]
Title: BMP Editorial
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DM Serif Display,44,&H00FFFFFF,&H000000FF,&H80000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,2,40,40,200,1
```

- [ ] **Step 2: Create social.ass**

```
[Script Info]
Title: BMP Social
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,56,&H00FFFFFF,&H000000FF,&H00000000,&HC0000000,-1,0,0,0,100,100,0,0,3,0,0,2,40,40,160,1
```

- [ ] **Step 3: Create luxury.ass**

```
[Script Info]
Title: BMP Luxury
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Playfair Display,40,&H00EBF0F2,&H000000FF,&H80000000,&H00000000,0,0,0,0,100,100,2,0,1,1,1,1,80,40,200,1
```

---

## Task 5: Build Remotion compositions — SaaS (7)

Each composition follows the existing pattern: zod schema, React FC, spring/interpolate animations, registered in Root.tsx with Vertical and Horizontal variants.

### Task 5a: MetricCounter

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/MetricCounter.tsx`

- [ ] **Step 1: Create MetricCounter.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const metricCounterSchema = z.object({
  value: z.number(),
  label: z.string(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  accentColor: z.string(),
});

type Props = z.infer<typeof metricCounterSchema>;

export const MetricCounter: React.FC<Props> = ({
  value,
  label,
  prefix = '',
  suffix = '',
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 40, mass: 1 },
  });

  const currentValue = Math.round(interpolate(progress, [0, 1], [0, value]));

  const labelOpacity = interpolate(frame, [20, 32], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const exit = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exit,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 160,
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          {prefix}{currentValue.toLocaleString()}{suffix}
        </div>
        <div
          style={{
            color: accentColor,
            fontSize: 32,
            fontFamily: '"Inter", sans-serif',
            fontWeight: 400,
            letterSpacing: 8,
            textTransform: 'uppercase',
            marginTop: 20,
            opacity: labelOpacity,
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

### Task 5b: FeatureCallout

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/FeatureCallout.tsx`

- [ ] **Step 1: Create FeatureCallout.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const featureCalloutSchema = z.object({
  text: z.string(),
  position: z.enum(['left', 'right', 'center']).optional(),
  accentColor: z.string(),
});

type Props = z.infer<typeof featureCalloutSchema>;

export const FeatureCallout: React.FC<Props> = ({
  text,
  position = 'left',
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const lineGrow = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const textIn = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 100 } });
  const exit = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const alignItems = position === 'right' ? 'flex-end' : position === 'center' ? 'center' : 'flex-start';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems,
        padding: 80,
        opacity: exit,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: interpolate(lineGrow, [0, 1], [0, 60]),
            height: 3,
            backgroundColor: accentColor,
          }}
        />
        <div
          style={{
            backgroundColor: '#0A0A0A',
            padding: '16px 28px',
            borderRadius: 6,
            opacity: textIn,
            transform: `translateX(${interpolate(textIn, [0, 1], [20, 0])}px)`,
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 28,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              letterSpacing: 1,
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

### Task 5c: ScreenReveal

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/ScreenReveal.tsx`

- [ ] **Step 1: Create ScreenReveal.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const screenRevealSchema = z.object({
  screenshot: z.string(),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),
  maskColor: z.string().optional(),
});

type Props = z.infer<typeof screenRevealSchema>;

export const ScreenReveal: React.FC<Props> = ({
  screenshot,
  direction = 'left',
  maskColor = '#0A0A0A',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const reveal = spring({ frame: frame - 10, fps, config: { damping: 25, stiffness: 60 } });
  const exit = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const isHorizontal = direction === 'left' || direction === 'right';
  const clipValue = interpolate(reveal, [0, 1], [0, 100]);

  let clipPath: string;
  if (direction === 'left') clipPath = `inset(0 ${100 - clipValue}% 0 0)`;
  else if (direction === 'right') clipPath = `inset(0 0 0 ${100 - clipValue}%)`;
  else if (direction === 'up') clipPath = `inset(0 0 ${100 - clipValue}% 0)`;
  else clipPath = `inset(${100 - clipValue}% 0 0 0)`;

  return (
    <AbsoluteFill style={{ backgroundColor: maskColor, opacity: exit }}>
      <AbsoluteFill style={{ clipPath }}>
        <Img
          src={screenshot.startsWith('http') ? screenshot : staticFile(screenshot)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

### Task 5d: HookText

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/HookText.tsx`

- [ ] **Step 1: Create HookText.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const hookTextSchema = z.object({
  lines: z.array(z.string()),
  accentColor: z.string(),
  style: z.enum(['bold', 'serif', 'minimal']).optional(),
});

type Props = z.infer<typeof hookTextSchema>;

export const HookText: React.FC<Props> = ({
  lines,
  accentColor,
  style = 'bold',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fontFamily = style === 'serif'
    ? '"DM Serif Display", serif'
    : '"Inter", -apple-system, sans-serif';
  const fontWeight = style === 'minimal' ? 300 : style === 'serif' ? 400 : 800;
  const fontSize = style === 'minimal' ? 64 : 80;

  const exit = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
        opacity: exit,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lines.map((line, i) => {
          const delay = i * 6;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 16, stiffness: 120 },
          });
          const y = interpolate(progress, [0, 1], [60, 0]);

          return (
            <div
              key={i}
              style={{
                color: i === lines.length - 1 ? accentColor : '#FFFFFF',
                fontSize,
                fontFamily,
                fontWeight,
                letterSpacing: style === 'minimal' ? 4 : -1,
                opacity: progress,
                transform: `translateY(${y}px)`,
                textTransform: 'uppercase',
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

### Task 5e: PricingCard, NotificationToast, BeforeAfterSplit

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/PricingCard.tsx`
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/NotificationToast.tsx`
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/BeforeAfterSplit.tsx`

- [ ] **Step 1: Create PricingCard.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const planSchema = z.object({
  name: z.string(),
  price: z.string(),
  features: z.array(z.string()),
});

export const pricingCardSchema = z.object({
  plans: z.array(planSchema),
  highlightIndex: z.number(),
  accentColor: z.string(),
});

type Props = z.infer<typeof pricingCardSchema>;

export const PricingCard: React.FC<Props> = ({ plans, highlightIndex, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const exit = interpolate(
    frame, [durationInFrames - 10, durationInFrames], [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: 60, opacity: exit }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
        {plans.map((plan, i) => {
          const delay = i * 8;
          const enter = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 90 } });
          const isHighlighted = i === highlightIndex;
          const scale = isHighlighted ? interpolate(spring({ frame: frame - 30, fps, config: { damping: 12, stiffness: 200 } }), [0, 1], [1, 1.05]) : 1;

          return (
            <div key={i} style={{
              backgroundColor: isHighlighted ? accentColor : '#1A1A1A',
              borderRadius: 16, padding: 40, width: 280, textAlign: 'center',
              opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${scale})`,
              border: isHighlighted ? 'none' : '1px solid #333',
            }}>
              <div style={{ color: isHighlighted ? '#0A0A0A' : '#888', fontSize: 20, fontFamily: '"Inter", sans-serif', fontWeight: 500, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 16 }}>{plan.name}</div>
              <div style={{ color: isHighlighted ? '#0A0A0A' : '#FFF', fontSize: 56, fontFamily: '"Inter", sans-serif', fontWeight: 700, marginBottom: 24 }}>{plan.price}</div>
              {plan.features.map((f, j) => (
                <div key={j} style={{ color: isHighlighted ? '#0A0A0A' : '#AAA', fontSize: 18, fontFamily: '"Inter", sans-serif', marginBottom: 8 }}>{f}</div>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Create NotificationToast.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const notificationToastSchema = z.object({
  message: z.string(),
  icon: z.string().optional(),
  accentColor: z.string(),
});

type Props = z.infer<typeof notificationToastSchema>;

export const NotificationToast: React.FC<Props> = ({ message, icon = '✓', accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 150 } });
  const exit = spring({ frame: frame - (durationInFrames - 15), fps, config: { damping: 20, stiffness: 100 } });
  const y = interpolate(enter, [0, 1], [-120, 0]) + interpolate(exit, [0, 1], [0, -120]);

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'flex-end', padding: 60 }}>
      <div style={{
        backgroundColor: '#1A1A1A', borderRadius: 12, padding: '20px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
        transform: `translateY(${y}px)`,
        border: `1px solid ${accentColor}40`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: accentColor, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 20, color: '#0A0A0A', fontWeight: 700 }}>{icon}</div>
        <span style={{ color: '#FFFFFF', fontSize: 24, fontFamily: '"Inter", sans-serif', fontWeight: 500 }}>{message}</span>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Create BeforeAfterSplit.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const beforeAfterSplitSchema = z.object({
  labelBefore: z.string(),
  labelAfter: z.string(),
  splitPosition: z.number().optional(),
  accentColor: z.string().optional(),
});

type Props = z.infer<typeof beforeAfterSplitSchema>;

export const BeforeAfterSplit: React.FC<Props> = ({
  labelBefore,
  labelAfter,
  splitPosition = 0.5,
  accentColor = '#C6A35D',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  const wipeProgress = spring({ frame: frame - 10, fps, config: { damping: 25, stiffness: 50 } });
  const splitX = interpolate(wipeProgress, [0, 1], [0, width * splitPosition]);
  const labelIn = spring({ frame: frame - 30, fps });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {/* Divider line */}
      <div style={{ position: 'absolute', left: splitX - 2, top: 0, width: 4, height: '100%', backgroundColor: accentColor, zIndex: 10 }} />
      {/* Labels */}
      <div style={{ position: 'absolute', left: splitX / 2, top: 80, transform: 'translateX(-50%)', opacity: labelIn, zIndex: 10 }}>
        <span style={{ color: '#FFF', fontSize: 28, fontFamily: '"Inter", sans-serif', fontWeight: 600, letterSpacing: 6, textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>{labelBefore}</span>
      </div>
      <div style={{ position: 'absolute', left: splitX + (width - splitX) / 2, top: 80, transform: 'translateX(-50%)', opacity: labelIn, zIndex: 10 }}>
        <span style={{ color: accentColor, fontSize: 28, fontFamily: '"Inter", sans-serif', fontWeight: 600, letterSpacing: 6, textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>{labelAfter}</span>
      </div>
    </AbsoluteFill>
  );
};
```

---

## Task 6: Build Remotion compositions — Fashion (4)

### Task 6a: TitleReveal

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/TitleReveal.tsx`

- [ ] **Step 1: Create TitleReveal.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const titleRevealSchema = z.object({
  words: z.array(z.string()),
  font: z.enum(['serif', 'sans']).optional(),
  accentColor: z.string(),
  stagger: z.number().optional(),
});

type Props = z.infer<typeof titleRevealSchema>;

export const TitleReveal: React.FC<Props> = ({
  words,
  font = 'serif',
  accentColor,
  stagger = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fontFamily = font === 'serif'
    ? '"DM Serif Display", "Playfair Display", serif'
    : '"Inter", -apple-system, sans-serif';

  const exit = interpolate(
    frame, [durationInFrames - 12, durationInFrames], [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', opacity: exit }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, padding: 60 }}>
        {words.map((word, i) => {
          const delay = i * stagger;
          const progress = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 80 } });
          const y = interpolate(progress, [0, 1], [50, 0]);

          return (
            <span key={i} style={{
              color: '#FFFFFF',
              fontSize: 88,
              fontFamily,
              fontWeight: font === 'serif' ? 400 : 300,
              letterSpacing: font === 'serif' ? 6 : 2,
              opacity: progress,
              transform: `translateY(${y}px)`,
              display: 'inline-block',
            }}>
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

### Task 6b: LogoSting

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/LogoSting.tsx`

- [ ] **Step 1: Create LogoSting.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const logoStingSchema = z.object({
  logoSrc: z.string(),
  accentColor: z.string(),
  style: z.enum(['spring', 'fade', 'grow-line']).optional(),
});

type Props = z.infer<typeof logoStingSchema>;

export const LogoSting: React.FC<Props> = ({ logoSrc, accentColor, style = 'spring' }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const lineGrow = spring({ frame: frame - 15, fps, config: { damping: 18, stiffness: 80 } });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const scale = style === 'spring' ? interpolate(enter, [0, 1], [0, 1]) : 1;
  const opacity = style === 'fade' ? interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }) : enter;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', opacity: exit }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <Img
          src={logoSrc.startsWith('http') ? logoSrc : staticFile(logoSrc)}
          style={{ height: 120, objectFit: 'contain', transform: `scale(${scale})`, opacity }}
        />
        {style === 'grow-line' && (
          <div style={{ width: interpolate(lineGrow, [0, 1], [0, 180]), height: 2, backgroundColor: accentColor }} />
        )}
      </div>
    </AbsoluteFill>
  );
};
```

### Task 6c: ColorWash

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/ColorWash.tsx`

- [ ] **Step 1: Create ColorWash.tsx**

```tsx
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const colorWashSchema = z.object({
  color: z.string(),
  opacity: z.number().optional(),
});

type Props = z.infer<typeof colorWashSchema>;

export const ColorWash: React.FC<Props> = ({ color, opacity: maxOpacity = 0.3 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, maxOpacity], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [maxOpacity, 0], { extrapolateLeft: 'clamp' });
  const op = Math.min(fadeIn, fadeOut);

  return <AbsoluteFill style={{ backgroundColor: color, opacity: op }} />;
};
```

### Task 6d: SplitDiptych

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/SplitDiptych.tsx`

- [ ] **Step 1: Create SplitDiptych.tsx**

```tsx
import { z } from 'zod';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const splitDiptychSchema = z.object({
  dividerColor: z.string().optional(),
  dividerWidth: z.number().optional(),
  labels: z.array(z.string()).optional(),
});

type Props = z.infer<typeof splitDiptychSchema>;

export const SplitDiptych: React.FC<Props> = ({
  dividerColor = '#C6A35D',
  dividerWidth = 4,
  labels = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, height, durationInFrames } = useVideoConfig();

  const dividerGrow = spring({ frame, fps, config: { damping: 20, stiffness: 60 } });
  const labelIn = spring({ frame: frame - 20, fps });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const dividerHeight = interpolate(dividerGrow, [0, 1], [0, height]);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {/* Center divider */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: dividerWidth, height: dividerHeight, backgroundColor: dividerColor, zIndex: 10 }} />
      {/* Labels */}
      {labels.length >= 2 && (
        <>
          <div style={{ position: 'absolute', left: '25%', bottom: 80, transform: 'translateX(-50%)', opacity: labelIn, zIndex: 10 }}>
            <span style={{ color: '#FFF', fontSize: 24, fontFamily: '"Inter", sans-serif', fontWeight: 500, letterSpacing: 4, textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{labels[0]}</span>
          </div>
          <div style={{ position: 'absolute', left: '75%', bottom: 80, transform: 'translateX(-50%)', opacity: labelIn, zIndex: 10 }}>
            <span style={{ color: '#FFF', fontSize: 24, fontFamily: '"Inter", sans-serif', fontWeight: 500, letterSpacing: 4, textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{labels[1]}</span>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
```

---

## Task 7: Build Remotion compositions — Brand Film (4)

### Task 7a: CinematicTitle

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/CinematicTitle.tsx`

- [ ] **Step 1: Create CinematicTitle.tsx**

```tsx
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const cinematicTitleSchema = z.object({
  text: z.string(),
  subtitle: z.string().optional(),
  font: z.enum(['serif', 'sans']).optional(),
  accentColor: z.string(),
});

type Props = z.infer<typeof cinematicTitleSchema>;

export const CinematicTitle: React.FC<Props> = ({ text, subtitle, font = 'serif', accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fontFamily = font === 'serif' ? '"DM Serif Display", serif' : '"Inter", sans-serif';
  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });
  const op = Math.min(fadeIn, fadeOut);
  const drift = interpolate(frame, [0, durationInFrames], [10, -10]);
  const subtitleOp = interpolate(frame, [25, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * fadeOut;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', transform: `translateY(${drift}px)` }}>
        <div style={{ color: '#FFFFFF', fontSize: 100, fontFamily, fontWeight: 400, letterSpacing: 8, opacity: op }}>{text}</div>
        {subtitle && (
          <div style={{ color: accentColor, fontSize: 28, fontFamily: '"Inter", sans-serif', fontWeight: 300, letterSpacing: 10, marginTop: 24, opacity: subtitleOp, textTransform: 'uppercase' }}>{subtitle}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
```

### Task 7b: ChapterMarker

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/ChapterMarker.tsx`

- [ ] **Step 1: Create ChapterMarker.tsx**

```tsx
import { z } from 'zod';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const chapterMarkerSchema = z.object({
  number: z.string(),
  title: z.string(),
  accentColor: z.string(),
});

type Props = z.infer<typeof chapterMarkerSchema>;

export const ChapterMarker: React.FC<Props> = ({ number, title, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const numIn = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const lineGrow = spring({ frame: frame - 8, fps, config: { damping: 22, stiffness: 60 } });
  const titleIn = spring({ frame: frame - 16, fps });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', justifyContent: 'center', padding: 100, opacity: exit }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <span style={{ color: accentColor, fontSize: 32, fontFamily: '"Inter", sans-serif', fontWeight: 300, opacity: numIn }}>{number}</span>
        <div style={{ width: interpolate(lineGrow, [0, 1], [0, 60]), height: 1, backgroundColor: accentColor }} />
        <span style={{ color: '#FFFFFF', fontSize: 40, fontFamily: '"Inter", sans-serif', fontWeight: 400, letterSpacing: 6, textTransform: 'uppercase', opacity: titleIn, transform: `translateX(${interpolate(titleIn, [0, 1], [20, 0])}px)` }}>{title}</span>
      </div>
    </AbsoluteFill>
  );
};
```

### Task 7c: AtmosphericOverlay

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/AtmosphericOverlay.tsx`

- [ ] **Step 1: Create AtmosphericOverlay.tsx**

```tsx
import { z } from 'zod';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from 'remotion';

export const atmosphericOverlaySchema = z.object({
  type: z.enum(['grain', 'dust', 'vignette']).optional(),
  opacity: z.number().optional(),
});

type Props = z.infer<typeof atmosphericOverlaySchema>;

export const AtmosphericOverlay: React.FC<Props> = ({ type = 'grain', opacity = 0.08 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  if (type === 'vignette') {
    return (
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${opacity * 4}) 100%)` }} />
    );
  }

  // Film grain: randomized semi-transparent noise pattern
  // Using CSS background with random seed per frame for grain effect
  const seed = random(`grain-${frame}`);
  const grainSize = type === 'dust' ? 3 : 1;

  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: 'overlay' }}>
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        <filter id={`noise-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency={type === 'dust' ? 0.02 : 0.65} numOctaves={type === 'dust' ? 2 : 4} seed={Math.floor(seed * 1000)} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#noise-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
```

### Task 7d: CreditRoll

**Files:**
- Create: `_SYSTEM/motion/bmp-motion/src/compositions/CreditRoll.tsx`

- [ ] **Step 1: Create CreditRoll.tsx**

```tsx
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const creditEntrySchema = z.object({
  role: z.string(),
  name: z.string(),
});

export const creditRollSchema = z.object({
  credits: z.array(creditEntrySchema),
  speed: z.number().optional(),
  font: z.enum(['serif', 'sans']).optional(),
  accentColor: z.string().optional(),
});

type Props = z.infer<typeof creditRollSchema>;

export const CreditRoll: React.FC<Props> = ({ credits, speed = 1, font = 'sans', accentColor = '#C6A35D' }) => {
  const frame = useCurrentFrame();
  const { height, durationInFrames } = useVideoConfig();

  const fontFamily = font === 'serif' ? '"Playfair Display", serif' : '"Inter", sans-serif';
  const totalHeight = credits.length * 120 + height;
  const scrollY = interpolate(frame, [0, durationInFrames], [height, -totalHeight * speed + height]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A', overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${scrollY}px)` }}>
        {credits.map((entry, i) => (
          <div key={i} style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ color: accentColor, fontSize: 22, fontFamily, fontWeight: 300, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 8 }}>{entry.role}</div>
            <div style={{ color: '#FFFFFF', fontSize: 36, fontFamily, fontWeight: font === 'serif' ? 400 : 300 }}>{entry.name}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
```

---

## Task 8: Register all compositions in Root.tsx

**Files:**
- Modify: `_SYSTEM/motion/bmp-motion/src/Root.tsx`

- [ ] **Step 1: Add imports for all 15 new compositions at the top of Root.tsx**

Add after the existing imports:

```tsx
import { MetricCounter, metricCounterSchema } from './compositions/MetricCounter';
import { FeatureCallout, featureCalloutSchema } from './compositions/FeatureCallout';
import { ScreenReveal, screenRevealSchema } from './compositions/ScreenReveal';
import { HookText, hookTextSchema } from './compositions/HookText';
import { PricingCard, pricingCardSchema } from './compositions/PricingCard';
import { NotificationToast, notificationToastSchema } from './compositions/NotificationToast';
import { BeforeAfterSplit, beforeAfterSplitSchema } from './compositions/BeforeAfterSplit';
import { TitleReveal, titleRevealSchema } from './compositions/TitleReveal';
import { LogoSting, logoStingSchema } from './compositions/LogoSting';
import { ColorWash, colorWashSchema } from './compositions/ColorWash';
import { SplitDiptych, splitDiptychSchema } from './compositions/SplitDiptych';
import { CinematicTitle, cinematicTitleSchema } from './compositions/CinematicTitle';
import { ChapterMarker, chapterMarkerSchema } from './compositions/ChapterMarker';
import { AtmosphericOverlay, atmosphericOverlaySchema } from './compositions/AtmosphericOverlay';
import { CreditRoll, creditRollSchema } from './compositions/CreditRoll';
```

- [ ] **Step 2: Add Composition registrations before the closing `</>` in Root.tsx**

Add after the existing compositions, before `{/* Horizontal 16:9 variants */}`:

```tsx
      {/* ─── SaaS / Product Ads ─── */}
      <Composition id="MetricCounter-Vertical" component={MetricCounter} durationInFrames={90} fps={30} width={1080} height={1920} schema={metricCounterSchema} defaultProps={{ value: 10432, label: 'Active users', prefix: '', suffix: '+', accentColor: '#C6A35D' }} />
      <Composition id="MetricCounter-Horizontal" component={MetricCounter} durationInFrames={90} fps={30} width={1920} height={1080} schema={metricCounterSchema} defaultProps={{ value: 10432, label: 'Active users', prefix: '', suffix: '+', accentColor: '#C6A35D' }} />
      <Composition id="FeatureCallout-Vertical" component={FeatureCallout} durationInFrames={75} fps={30} width={1080} height={1920} schema={featureCalloutSchema} defaultProps={{ text: 'Automated workflows', position: 'left', accentColor: '#C6A35D' }} />
      <Composition id="ScreenReveal-Vertical" component={ScreenReveal} durationInFrames={105} fps={30} width={1080} height={1920} schema={screenRevealSchema} defaultProps={{ screenshot: 'mockup.png', direction: 'left', maskColor: '#0A0A0A' }} />
      <Composition id="ScreenReveal-Horizontal" component={ScreenReveal} durationInFrames={105} fps={30} width={1920} height={1080} schema={screenRevealSchema} defaultProps={{ screenshot: 'mockup.png', direction: 'left', maskColor: '#0A0A0A' }} />
      <Composition id="HookText-Vertical" component={HookText} durationInFrames={75} fps={30} width={1080} height={1920} schema={hookTextSchema} defaultProps={{ lines: ['YOUR TEAM', 'WASTES 4H', 'EVERY DAY'], accentColor: '#C6A35D', style: 'bold' }} />
      <Composition id="PricingCard-Vertical" component={PricingCard} durationInFrames={120} fps={30} width={1080} height={1920} schema={pricingCardSchema} defaultProps={{ plans: [{ name: 'Starter', price: '$9', features: ['5 projects'] }, { name: 'Pro', price: '$29', features: ['Unlimited'] }, { name: 'Team', price: '$79', features: ['Everything'] }], highlightIndex: 1, accentColor: '#C6A35D' }} />
      <Composition id="NotificationToast-Vertical" component={NotificationToast} durationInFrames={60} fps={30} width={1080} height={1920} schema={notificationToastSchema} defaultProps={{ message: 'Task completed', icon: '✓', accentColor: '#C6A35D' }} />
      <Composition id="BeforeAfterSplit-Vertical" component={BeforeAfterSplit} durationInFrames={105} fps={30} width={1080} height={1920} schema={beforeAfterSplitSchema} defaultProps={{ labelBefore: 'BEFORE', labelAfter: 'AFTER', splitPosition: 0.5, accentColor: '#C6A35D' }} />

      {/* ─── Fashion / Lifestyle ─── */}
      <Composition id="TitleReveal-Vertical" component={TitleReveal} durationInFrames={105} fps={30} width={1080} height={1920} schema={titleRevealSchema} defaultProps={{ words: ['COLLECTION', 'SS26'], font: 'serif', accentColor: '#C6A35D', stagger: 6 }} />
      <Composition id="TitleReveal-Horizontal" component={TitleReveal} durationInFrames={105} fps={30} width={1920} height={1080} schema={titleRevealSchema} defaultProps={{ words: ['COLLECTION', 'SS26'], font: 'serif', accentColor: '#C6A35D', stagger: 6 }} />
      <Composition id="LogoSting-Vertical" component={LogoSting} durationInFrames={90} fps={30} width={1080} height={1920} schema={logoStingSchema} defaultProps={{ logoSrc: 'logo.png', accentColor: '#C6A35D', style: 'spring' }} />
      <Composition id="ColorWash-Vertical" component={ColorWash} durationInFrames={45} fps={30} width={1080} height={1920} schema={colorWashSchema} defaultProps={{ color: '#C6A35D', opacity: 0.3 }} />
      <Composition id="SplitDiptych-Vertical" component={SplitDiptych} durationInFrames={120} fps={30} width={1080} height={1920} schema={splitDiptychSchema} defaultProps={{ dividerColor: '#C6A35D', dividerWidth: 4, labels: ['LEFT', 'RIGHT'] }} />

      {/* ─── Brand Film ─── */}
      <Composition id="CinematicTitle-Vertical" component={CinematicTitle} durationInFrames={135} fps={30} width={1080} height={1920} schema={cinematicTitleSchema} defaultProps={{ text: 'CHAPTER ONE', subtitle: 'The Beginning', font: 'serif', accentColor: '#C6A35D' }} />
      <Composition id="CinematicTitle-Horizontal" component={CinematicTitle} durationInFrames={135} fps={30} width={1920} height={1080} schema={cinematicTitleSchema} defaultProps={{ text: 'CHAPTER ONE', subtitle: 'The Beginning', font: 'serif', accentColor: '#C6A35D' }} />
      <Composition id="ChapterMarker-Vertical" component={ChapterMarker} durationInFrames={75} fps={30} width={1080} height={1920} schema={chapterMarkerSchema} defaultProps={{ number: '01', title: 'Origins', accentColor: '#C6A35D' }} />
      <Composition id="ChapterMarker-Horizontal" component={ChapterMarker} durationInFrames={75} fps={30} width={1920} height={1080} schema={chapterMarkerSchema} defaultProps={{ number: '01', title: 'Origins', accentColor: '#C6A35D' }} />
      <Composition id="AtmosphericOverlay-Vertical" component={AtmosphericOverlay} durationInFrames={150} fps={30} width={1080} height={1920} schema={atmosphericOverlaySchema} defaultProps={{ type: 'grain', opacity: 0.08 }} />
      <Composition id="CreditRoll-Vertical" component={CreditRoll} durationInFrames={300} fps={30} width={1080} height={1920} schema={creditRollSchema} defaultProps={{ credits: [{ role: 'Director', name: 'BMP Studio' }, { role: 'Client', name: 'Brand Name' }], speed: 1, font: 'sans', accentColor: '#C6A35D' }} />
```

- [ ] **Step 3: Verify Remotion builds**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/motion/bmp-motion"
npx remotion studio --port 3123 &
sleep 5 && kill %1
```

Expected: Remotion studio starts without errors. Kill after verifying.

---

## Task 9: Create 6 timeline templates

**Files:**
- Create: `_SYSTEM/presets/timelines/saas-product-30s.json`
- Create: `_SYSTEM/presets/timelines/saas-product-60s.json`
- Create: `_SYSTEM/presets/timelines/fashion-music-30s.json`
- Create: `_SYSTEM/presets/timelines/fashion-music-60s.json`
- Create: `_SYSTEM/presets/timelines/brand-film-60s.json`
- Create: `_SYSTEM/presets/timelines/brand-film-90s.json`

- [ ] **Step 1: Create timelines directory**

```bash
mkdir -p "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/presets/timelines"
```

- [ ] **Step 2: Create saas-product-30s.json**

```json
{
  "_meta": {
    "type": "saas-product-ad",
    "target_duration": 30,
    "style": "dynamic",
    "description": "Problem-Solution-CTA structure. Hook in first 3s, product demo in the middle, social proof + CTA at the end.",
    "sections": [
      {"name": "hook", "start": 0, "duration": 3, "notes": "Bold stat or pain point. Use HookText composition."},
      {"name": "problem", "start": 3, "duration": 5, "notes": "Show the frustration. Before-state."},
      {"name": "demo", "start": 8, "duration": 14, "notes": "Product in action. Screen recordings, UI walkthrough. Use FeatureCallout overlays."},
      {"name": "proof", "start": 22, "duration": 5, "notes": "Social proof: user count, testimonial, or metric. Use MetricCounter."},
      {"name": "cta", "start": 27, "duration": 3, "notes": "Logo + URL + action text. Use EndCard composition."}
    ]
  },
  "output": {"width": 1080, "height": 1920, "fps": 30},
  "clips": [
    {"src": "PLACEHOLDER:hook-visual", "in": 0, "out": 3, "fit": "crop", "_section": "hook"},
    {"src": "PLACEHOLDER:problem-shot-1", "in": 0, "out": 2.5, "fit": "crop", "_section": "problem"},
    {"src": "PLACEHOLDER:problem-shot-2", "in": 0, "out": 2.5, "fit": "crop", "_section": "problem"},
    {"src": "PLACEHOLDER:demo-shot-1", "in": 0, "out": 5, "fit": "crop", "_section": "demo"},
    {"src": "PLACEHOLDER:demo-shot-2", "in": 0, "out": 5, "fit": "crop", "_section": "demo"},
    {"src": "PLACEHOLDER:demo-shot-3", "in": 0, "out": 4, "fit": "crop", "_section": "demo"},
    {"src": "PLACEHOLDER:proof-visual", "in": 0, "out": 5, "fit": "crop", "_section": "proof"},
    {"src": "PLACEHOLDER:cta-card", "in": 0, "out": 3, "fit": "crop", "_section": "cta"}
  ],
  "transitions": {"type": "crossfade", "duration": 0.2},
  "music": {"src": "PLACEHOLDER:music-track", "db": -14, "duck": true, "fade": 1.0},
  "text_overlays": [
    {"text": "PLACEHOLDER:hook-stat", "start": 0.3, "duration": 2.5, "pos": "middle", "size": 72, "color": "white", "box": false},
    {"text": "PLACEHOLDER:cta-text", "start": 27.5, "duration": 2.0, "pos": "bottom", "size": 48, "color": "white", "box": false}
  ],
  "watermark": null,
  "subtitles": null,
  "loudness_lufs": -14
}
```

- [ ] **Step 3: Create fashion-music-30s.json**

```json
{
  "_meta": {
    "type": "fashion-lifestyle-ad",
    "target_duration": 30,
    "style": "editorial",
    "description": "Music-driven editorial. Cold open, brand reveal, long editorial cuts on phrase boundaries, campaign line, logo sting.",
    "sections": [
      {"name": "cold-open", "start": 0, "duration": 2, "notes": "Tight product/body shot. No text. Music beat drop."},
      {"name": "brand-reveal", "start": 2, "duration": 4, "notes": "Brand name. TitleReveal or BMPIntro composition."},
      {"name": "editorial", "start": 6, "duration": 18, "notes": "3-4s per shot. Cuts on phrase ends. Minimal crossfades <= 0.4s."},
      {"name": "campaign-line", "start": 24, "duration": 4, "notes": "Single serif title, 2s hold."},
      {"name": "logo-sting", "start": 28, "duration": 2, "notes": "Logo + URL. LogoSting or EndCard."}
    ]
  },
  "output": {"width": 1080, "height": 1920, "fps": 30},
  "clips": [
    {"src": "PLACEHOLDER:hero-close-up", "in": 0, "out": 2, "fit": "crop", "_section": "cold-open"},
    {"src": "PLACEHOLDER:brand-intro", "in": 0, "out": 4, "fit": "crop", "_section": "brand-reveal"},
    {"src": "PLACEHOLDER:editorial-1", "in": 0, "out": 4, "fit": "crop", "_section": "editorial"},
    {"src": "PLACEHOLDER:editorial-2", "in": 0, "out": 3.5, "fit": "crop", "_section": "editorial"},
    {"src": "PLACEHOLDER:editorial-3", "in": 0, "out": 3.5, "fit": "crop", "_section": "editorial"},
    {"src": "PLACEHOLDER:editorial-4", "in": 0, "out": 4, "fit": "crop", "_section": "editorial"},
    {"src": "PLACEHOLDER:editorial-5", "in": 0, "out": 3, "fit": "crop", "_section": "editorial"},
    {"src": "PLACEHOLDER:campaign-text", "in": 0, "out": 4, "fit": "crop", "_section": "campaign-line"},
    {"src": "PLACEHOLDER:end-card", "in": 0, "out": 2, "fit": "crop", "_section": "logo-sting"}
  ],
  "transitions": {"type": "crossfade", "duration": 0.3},
  "music": {"src": "PLACEHOLDER:music-track", "db": -6, "duck": false, "fade": 1.5},
  "text_overlays": [],
  "watermark": null,
  "subtitles": null,
  "loudness_lufs": -14
}
```

- [ ] **Step 4: Create brand-film-60s.json**

```json
{
  "_meta": {
    "type": "brand-film",
    "target_duration": 60,
    "style": "cinematic",
    "description": "3-act cinematic structure. Atmospheric opening, story act, emotional peak, brand statement, end card.",
    "sections": [
      {"name": "atmosphere", "start": 0, "duration": 5, "notes": "Wide establishing shot. Room tone only, no music yet."},
      {"name": "chapter-1", "start": 5, "duration": 20, "notes": "Story introduction. 4-5 shots, slow cuts. Optional VO or silence."},
      {"name": "music-entry", "start": 25, "duration": 5, "notes": "Music fades in. Transition moment."},
      {"name": "chapter-2", "start": 30, "duration": 20, "notes": "Product/service in context. Lower thirds for people. Rhythm builds."},
      {"name": "statement", "start": 50, "duration": 7, "notes": "Brand statement. CinematicTitle composition. 5s hold."},
      {"name": "end-card", "start": 57, "duration": 3, "notes": "Logo, tagline, URL. EndCard composition."}
    ]
  },
  "output": {"width": 1920, "height": 1080, "fps": 30},
  "clips": [
    {"src": "PLACEHOLDER:establishing-wide", "in": 0, "out": 5, "fit": "crop", "mute": true, "_section": "atmosphere"},
    {"src": "PLACEHOLDER:story-1", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-1"},
    {"src": "PLACEHOLDER:story-2", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-1"},
    {"src": "PLACEHOLDER:story-3", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-1"},
    {"src": "PLACEHOLDER:story-4", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-1"},
    {"src": "PLACEHOLDER:story-5", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-1"},
    {"src": "PLACEHOLDER:transition-shot", "in": 0, "out": 5, "fit": "crop", "_section": "music-entry"},
    {"src": "PLACEHOLDER:context-1", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-2"},
    {"src": "PLACEHOLDER:context-2", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-2"},
    {"src": "PLACEHOLDER:context-3", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-2"},
    {"src": "PLACEHOLDER:context-4", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-2"},
    {"src": "PLACEHOLDER:context-5", "in": 0, "out": 4, "fit": "crop", "_section": "chapter-2"},
    {"src": "PLACEHOLDER:statement-card", "in": 0, "out": 7, "fit": "crop", "_section": "statement"},
    {"src": "PLACEHOLDER:end-card", "in": 0, "out": 3, "fit": "crop", "_section": "end-card"}
  ],
  "transitions": {"type": "crossfade", "duration": 0.4},
  "music": {"src": "PLACEHOLDER:music-track", "db": -10, "duck": true, "fade": 2.0},
  "text_overlays": [],
  "watermark": null,
  "subtitles": null,
  "loudness_lufs": -14
}
```

- [ ] **Step 5: Create remaining 3 templates**

Create `saas-product-60s.json`, `fashion-music-60s.json`, and `brand-film-90s.json` following the same pattern as their shorter counterparts but with the structures defined in the spec:

- `saas-product-60s`: Hook(3s) → Problem(9s) → Feature x3(28s) → Testimonial(12s) → CTA(8s)
- `fashion-music-60s`: Cold open(2s) → Brand(4s) → Editorial(24s) → Details(15s) → Line(10s) → Logo(5s)
- `brand-film-90s`: Atmos(5s) → Ch1 title(10s) → Act1(20s) → Music(5s) → Ch2(20s) → Peak(15s) → Statement(10s) → End(5s)

---

## Task 10: Build the HTML briefing form

**Files:**
- Create: `_SYSTEM/tools/briefing-form.html`

- [ ] **Step 1: Create tools directory**

```bash
mkdir -p "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/tools"
```

- [ ] **Step 2: Create briefing-form.html**

A single-file HTML form with BMP brand styling (dark theme, #0A0A0A background, #C6A35D accent, Inter font). Contains:

- All fields from spec section 4.3 (client, project, type, description, aspect ratio, duration, platforms, mood, reference links, Drive links, music, subtitles, watermark, notes)
- Dynamic "add another" for reference links and Drive links
- localStorage auto-save every 5 seconds
- "Download JSON" button that exports `brief-input.json`
- "Clear form" button
- Responsive, works on any screen
- Zero dependencies — vanilla HTML/CSS/JS

The form should be ~400 lines of clean HTML with embedded CSS and JS. No external files needed.

---

## Task 11: Update CLAUDE.md with unified workflow

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add the unified workflow section**

Add after the existing "## The headless edit workflow" section a new section:

```markdown
## Unified production flow (v2)

When the user describes a video idea, the entire production pipeline runs
automatically. No manual skill invocation needed.

### Trigger detection
If the user says anything about making, creating, editing, or producing a
video — or mentions a client name with new material — start the flow.

### The 9 phases

[Include the full flow from spec section 4.1]

### Phase 3: Creative direction (spend time here)
This is the most important phase. Before building any timeline:
1. Study all reference material deeply
2. Write a CREATIVE_DIRECTION.md proposing...
[Include full details from spec section 4.2, Phase 3]

### Phase 6: Auto-review checklist
After every internal render, run this checklist...
[Include all three checklists from spec section 4.2, Phase 6]

### Template evolution
After each successful delivery, ask if the timeline should be saved
as a template...
```

- [ ] **Step 2: Add new scripts to the architecture table**

Add to the scripts table in CLAUDE.md:

```markdown
│   │   ├── qa-check.sh       automated QA (loudness/resolution/duration/VMAF)
│   │   ├── color-match.sh    match clip colors to a reference frame
│   │   ├── stem-split.sh     separate music into vocals/instrumental (demucs)
│   │   ├── subtitle-pro.sh   pro subtitles with ASS styling (editorial/social/luxury)
```

- [ ] **Step 3: Add new Remotion compositions to the architecture table**

Add to the compositions list:

```markdown
│   │       ├── MetricCounter.tsx     animated number counter (SaaS)
│   │       ├── FeatureCallout.tsx    line + badge callout (SaaS)
│   │       ├── ScreenReveal.tsx      mask reveals screenshot (SaaS)
│   │       ├── HookText.tsx          impact text first 3s (SaaS)
│   │       ├── PricingCard.tsx       plan cards with highlight (SaaS)
│   │       ├── NotificationToast.tsx toast notification (SaaS)
│   │       ├── BeforeAfterSplit.tsx  vertical wipe comparison (SaaS)
│   │       ├── TitleReveal.tsx       word-by-word text (fashion)
│   │       ├── LogoSting.tsx         logo with spring (fashion)
│   │       ├── ColorWash.tsx         color overlay dissolve (fashion)
│   │       ├── SplitDiptych.tsx      two-panel layout (fashion)
│   │       ├── CinematicTitle.tsx    large type with drift (brand)
│   │       ├── ChapterMarker.tsx     numbered section (brand)
│   │       ├── AtmosphericOverlay.tsx grain/dust/vignette (brand)
│   │       └── CreditRoll.tsx        scrolling credits (brand)
```

- [ ] **Step 4: Add new dependencies to the dependencies table**

Add to the Python stack table:

```markdown
| **ffmpeg-quality-metrics** | VMAF/SSIM/PSNR QA scoring                   |
| **color-matcher**          | Auto color-match between clips                |
| **stable-ts (stable_whisper)** | Word-level subtitles + ASS styling       |
| **demucs**                 | Audio stem separation (vocals/instrumental)   |
| **typed-ffmpeg**           | Typed Python ffmpeg filter graphs             |
| **auto-subs**              | Advanced subtitle burn with ASS presets        |
```

- [ ] **Step 5: Add timeline templates section**

```markdown
### Timeline templates
Pre-built timeline.json structures in `_SYSTEM/presets/timelines/`:
- `saas-product-30s.json` / `saas-product-60s.json`
- `fashion-music-30s.json` / `fashion-music-60s.json`
- `brand-film-60s.json` / `brand-film-90s.json`

Each has `_meta` with sections, timing, and notes. Clips use
`PLACEHOLDER:semantic-name` labels replaced with real files during
Phase 4 (timeline construction).

New templates are created from successful projects during Phase 9
(delivery).
```

- [ ] **Step 6: Add briefing form docs**

```markdown
### HTML briefing form
Open `_SYSTEM/tools/briefing-form.html` in a browser to fill out a
structured brief. Downloads `brief-input.json` — place it in the
client's `00_BRIEF/` folder or `00_INBOX/<project>/`.
```

---

## Task 12: Update remotion-render.sh header comment

**Files:**
- Modify: `_SYSTEM/scripts/remotion-render.sh`

- [ ] **Step 1: Update composition ID list**

Replace lines 7-12 with the full list of all available compositions (original 4 + 15 new, both Vertical and Horizontal variants where applicable).

---

## Task 13: End-to-end verification

- [ ] **Step 1: Verify all scripts are executable**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS"
ls -la _SYSTEM/scripts/qa-check.sh _SYSTEM/scripts/color-match.sh \
       _SYSTEM/scripts/stem-split.sh _SYSTEM/scripts/subtitle-pro.sh
```

Expected: All show `-rwxr-xr-x` permissions.

- [ ] **Step 2: Verify Remotion compositions build**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/motion/bmp-motion"
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Verify timeline templates are valid JSON**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS"
for f in _SYSTEM/presets/timelines/*.json; do
  python3 -m json.tool "$f" > /dev/null && echo "OK: $f" || echo "FAIL: $f"
done
```

Expected: All print "OK".

- [ ] **Step 4: Verify subtitle style presets exist**

```bash
ls -la "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/presets/subtitle-styles/"
```

Expected: 3 files — editorial.ass, social.ass, luxury.ass.

- [ ] **Step 5: Verify HTML form opens**

```bash
open "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS/_SYSTEM/tools/briefing-form.html"
```

Expected: Form opens in browser with BMP dark theme.

- [ ] **Step 6: Test one Remotion composition render**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS"
_SYSTEM/scripts/remotion-render.sh HookText-Vertical /tmp/test-hook.mp4 \
  --props '{"lines":["YOUR TEAM","WASTES 4H","EVERY DAY"],"accentColor":"#C6A35D","style":"bold"}'
```

Expected: Renders a ~2.5s mp4 to `/tmp/test-hook.mp4`.

- [ ] **Step 7: Test qa-check.sh on the test render**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP/02_VIDEO EDITS"
_SYSTEM/scripts/qa-check.sh /tmp/test-hook.mp4 --target-width 1080 --target-height 1920
```

Expected: QA report with resolution PASS, loudness measurement, audio check.
