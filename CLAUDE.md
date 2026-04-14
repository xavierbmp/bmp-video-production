# CLAUDE.md — BMP Video Production workspace

> **⛔ STOP. READ THIS ENTIRE FILE BEFORE DOING ANYTHING. NO EXCEPTIONS.**
> This file is LAW. Every rule exists because it was violated and caused hours
> of wasted work. If you skip reading this, you WILL repeat the same mistakes.
> The user DOES NOT CARE about token cost. Read it ALL. Every time.

## ⛔ MANDATORY PROTOCOL — READ BEFORE EVERY PROJECT

> These rules exist because Livitum Diseñadora required 11+ versions to reach
> quality. Every error was caused by skipping verification, assuming outputs
> were correct without looking, or changing things the user didn't ask to change.
> This protocol prevents ALL of those failures.
>
> **EVERY SINGLE CHANGE you make must pass the VERIFY-FIX-VERIFY loop below.**
> **There are ZERO exceptions. Not for "small" changes. Not for "obvious" ones.**
> **If you didn't extract a frame and Read it, you didn't verify it.**

---

### 🔴 RULE MINUS ONE — USE EXISTING RESOURCES (before writing ANY command)

**Before typing ANY ffmpeg command, Python script, or manual operation, STOP and ask:**
> "Does a script, preset, template, or Remotion composition already exist for this?"

**The answer is almost always YES.** This workspace has 32+ scripts, 25 Remotion
compositions, 61 Python packages, 8 timeline templates, 3 subtitle presets,
9 export presets, and a briefing form. USE THEM.

**MANDATORY: Read `_SYSTEM/RESOURCE_GUIDE.md` at the start of every session.**
It has the complete index. Here's the cheat sheet for instant lookup:

#### RESOURCE CHEAT SHEET — ALWAYS CHECK BEFORE DOING ANYTHING MANUALLY

```
NEED TO...                          → USE THIS, NOT RAW FFMPEG
─────────────────────────────────────────────────────────────────
Crop vertical talking head          → face-detect-crop.py --apply
Cut/trim a clip                     → trim.sh (--reencode for frame-accurate)
Join clips                          → concat.sh / crossfade.sh
Reframe aspect ratio                → reframe.sh (crop/pad/blur-bg modes)
Remove silences from interview      → auto-cut.sh
Stabilize shaky footage             → stabilize.sh
Animate a still photo               → ken-burns.sh
Apply color grade                   → color-grade.sh --preset editorial
Match color across clips            → color-match.sh
Remove background                   → remove-bg.sh
Generate subtitles                  → subtitle-pro.sh --style editorial --burn
Normalize audio loudness            → normalize-audio.sh --lufs -14
Add music with ducking              → music-mix.sh --duck
Separate vocals/instrumental        → stem-split.sh
Detect BPM/beats                    → bpm.py --json
Add text overlay                    → text-overlay.sh / drawtext in timeline
Add watermark                       → watermark.sh
Extract text from video             → ocr.sh
Render motion graphics              → remotion-render.sh <composition-id>
Render full edit from timeline      → render-edit.py timeline.json
Run QA checks                       → qa-check.sh + qa-visual.sh
Export to all platforms              → export-social.sh master.mp4 Client all
Clean up intermediate files         → cleanup.sh "Client"
Find best timeline template         → template-selector.sh --keywords "..."
Animated split-screen transition    → split-screen-expand.py
Create lower third text             → drawtext in ffmpeg (NOT Remotion+colorkey)
Animated intro/outro/endcard        → remotion-render.sh (BMPIntro/EndCard/LogoSting)
Before/after wipe reveal            → remotion-render.sh BeforeAfterReveal-Vertical
Animated metric/counter             → remotion-render.sh MetricCounter-Vertical
Film grain/texture overlay          → remotion-render.sh AtmosphericOverlay-Vertical
Inspect file metadata               → probe.sh
Visual contact sheet                → thumbnail.sh --grid 3x3
```

**If you catch yourself writing a raw ffmpeg command for any of the above tasks,
STOP. Use the script. The scripts handle setsar=1, format normalization,
error checking, and all the edge cases that raw commands miss.**

**If no script exists for what you need → check Python packages in RESOURCE_GUIDE.md
(opencv, moviepy, librosa, rembg, etc.) before writing anything from scratch.**

---

### 🔴 RULE ZERO — VERIFY-FIX-VERIFY LOOP (applies to EVERY SINGLE CHANGE)

**Every time you modify anything — a crop, a filter, a clip swap, a subtitle,
an overlay, an animation, a concat, ANYTHING — you MUST:**

1. **Make the change.**
2. **Extract a frame or probe the output IMMEDIATELY.**
3. **Read/inspect the output with the Read tool.**
4. **Compare the result against what the user asked for.**
5. **If it's wrong → fix it → go back to step 2.**
6. **Repeat steps 2-5 with NO LIMIT until the output matches the request.**
7. **Only then move to the next task.**

**NEVER skip steps 2-6. NEVER say "done" without having visually confirmed.**
**NEVER assume an ffmpeg command worked correctly — ALWAYS check the output.**

**After EVERY command, read `_SYSTEM/VERIFY_CHECKLIST.md` and run the
applicable checks. This file contains the specific ffprobe/ffmpeg commands
to run for each type of operation. READ IT. RUN THE CHECKS. EVERY TIME.**

Concrete examples of what this means:
- Changed a clip? → Extract a frame, Read it, confirm it's the right clip.
- Changed a crop? → Extract a frame, Read it, confirm framing is correct.
- Applied an overlay? → Extract a frame at the overlay timestamp, Read it,
  confirm it's visible and correctly positioned.
- Changed audio? → Probe duration, check it's not truncated.
- Used `-shortest`? → Verify the output duration matches expectations.
- Used `concat`? → Probe the output, verify total duration = sum of parts.
- Changed SAR/scale? → Check SAR=1:1 in output with ffprobe.

---

### 🔴 RULE ONE — NEVER CHANGE WHAT WASN'T ASKED

**When the user asks you to change ONE thing, change ONLY that thing.**
Do not "improve" other things. Do not reorganize clips. Do not change clips
that weren't mentioned. Do not touch aspect ratios, audio levels, or positions
of elements that were already approved.

**Catalog of past violations:**
- User said "change clip 1" → changed clip 2 as well.
- User said "fix the EndCard" → also changed the LowerThird.
- User said "move subtitles lower" → also changed subtitle font.
- User said "fix aspect ratio" → also rearranged clip order.

**Before delivering, mentally ask:** "Did I change ONLY what was requested?"

---

### 🔴 RULE TWO — NEVER DEFORM ASPECT RATIOS

**When scaling any video or image:**
- ALWAYS use `scale=W:-1` or `scale=-1:H` (auto-calculate one dimension).
- ALWAYS add `setsar=1` after any scale operation.
- NEVER specify both W and H unless mathematically verified they match the
  source ratio.
- After scaling, verify with ffprobe that SAR=1:1 and DAR matches expected.
- The delivered video MUST have `SAR=1:1, DAR=9:16` for vertical content.

**When cropping:**
- Crop does NOT change aspect ratio. It removes pixels from edges.
- Use `crop=W:H:X:Y` where W:H is the desired output dimensions.
- To show the interesting part of a clip, change Y (vertical offset):
  - `y=0` = top of clip (often ceiling/sky — usually bad)
  - `y=(ih-H)/2` = center (usually the best default)
  - Inspect a frame AFTER cropping to verify content is good.

---

### 🔴 RULE THREE — LAYER ORDER MATTERS

**In split-screen or overlay compositions:**
- The element that should be VISIBLE ON TOP must be the LAST overlay applied.
- In ffmpeg: overlays are applied in order. Later overlays cover earlier ones.
- When animating (one layer grows to cover another), the GROWING layer must
  be overlaid ON TOP of the shrinking layer.
- After compositing, extract a frame and VERIFY which layer is on top.

**Past violation:** The bottom b-roll clip was rendered on top of the expanding
image, making it look like the bottom was covering the top instead of the
top growing downward over the bottom.

---

### 🔴 RULE FOUR — AUDIO INTEGRITY

**Never cut audio without verification:**
- After ANY audio operation (`-shortest`, trim, concat, amix, afade):
  1. Probe the output duration.
  2. If using `-shortest`: verify the shorter stream isn't truncating speech.
  3. After `afade`: verify the fade doesn't kill audio for the REST of the file
     (afade=t=out makes ALL subsequent audio silent — it doesn't recover).
  4. Extract audio at t=1s, t=middle, and t=end-1s and check volume levels.

**Past violations:**
- `-shortest` cut "siempre has soñado" because visual was 0.9s too short.
- `afade=t=out:st=18.55:d=0.1` killed ALL audio after 18.65s permanently.
- Audio from different bruto sections (different timestamps) had audible splice.

---

### 🔴 RULE FIVE — REMOTION vs FFMPEG: USE THE RIGHT TOOL

**Use Remotion for:**
- Animated compositions (EndCard, LowerThird, wipe reveals, motion graphics).
- Anything requiring spring animations, clip-path, or React rendering.
- Remotion output is reliable and pixel-perfect.

**Use ffmpeg for:**
- Cutting, trimming, concatenating, scaling, cropping video.
- Burning subtitles (drawtext or libass).
- Audio mixing, normalization.
- Simple overlays (static images on video).

**Do NOT use ffmpeg for:**
- Animated wipe transitions between images (use Remotion's BeforeAfterReveal).
- Complex overlay animations with moving positions (ffmpeg crop expressions
  with `t` variable are unreliable with image inputs and `-ss` seeking).

**Do NOT use Remotion output + colorkey for overlays:**
- Colorkey on h264 creates blur/artifacts around text edges.
- For text overlays (LowerThird), use ffmpeg `drawtext` directly on the video.
- For transparent overlays, use Python (cv2) frame-by-frame compositing.

---

### SESSION START (every session, before any action)

**Token cost is IRRELEVANT. The user explicitly does not care about token
consumption. What matters is ZERO broken deliveries. Read everything.
Verify everything. Fix everything. No shortcuts.**

1. **Read this entire CLAUDE.md** — not a skim. Every section, every rule.
2. **Read `_SYSTEM/VERIFY_CHECKLIST.md`** — you will run these checks after EVERY command.
3. **Read `_SYSTEM/RESOURCE_GUIDE.md`** — the full catalog of tools. Check it before doing anything manually.
4. **Check `~/.claude/projects/.../memory/MEMORY.md`** for feedback and project notes.
5. **Read the client's `brief.json`** and `README.md`.
6. **List project files** — `ls -la` on the client folder and all subfolders.
7. Never assume you remember the state of a project. Read the actual files.

---

## 🚀 PROJECT START FLOW — FOLLOW THIS EXACTLY

> When the user describes a new video or drops material, follow these steps
> in ORDER. Do not skip any. Do not jump to editing before completing analysis.

### STEP 1 — SETUP (30 seconds)

```bash
# Does the client folder exist?
ls CLIENTS/ | grep -i "ClientName"

# If NOT → create it from template
_SYSTEM/scripts/new-client.sh "ClientName"

# If YES → read what's there
ls -laR "CLIENTS/ClientName/"
cat "CLIENTS/ClientName/PROJECT.md" 2>/dev/null
cat "CLIENTS/ClientName/brief.json" 2>/dev/null
```

**Output of this step:** You know where the project lives and what exists.

### STEP 2 — BRIEF ANALYSIS (2 minutes)

**If the user provided a brief-input.json:**
```bash
cat CLIENTS/ClientName/brief.json | python3 -m json.tool
```

**If the user described the video in chat:** Extract these from their message:
- [ ] Video type (talking head / product / brand film / before-after)
- [ ] Aspect ratio (9:16 / 16:9 / 1:1)
- [ ] Target duration (seconds)
- [ ] Target platforms (IG Reel, TikTok, YouTube...)
- [ ] Speaker info (name, role — for LowerThird)
- [ ] Music (provided? which track?)
- [ ] Subtitles (language, style)
- [ ] Special elements (before/after, split-screen, Trustpilot badge...)

**Ask ONLY for what's missing.** Do NOT ask obvious questions. The user hates
feedback loops. If they said "video vertical de 30s para Instagram" you already
know: 9:16, 30s, instagram-reel, -14 LUFS.

**Write the brief to `brief.json`** with all extracted info.

### STEP 3 — TEMPLATE SELECTION (30 seconds)

```bash
_SYSTEM/scripts/template-selector.sh --keywords "TYPE ASPECT DURATION STYLE"
```

Pick the best match. Copy it:
```bash
_SYSTEM/scripts/template-selector.sh --keywords "talking head vertical 30s" --copy "ClientName"
```

**Now you have a timeline.json skeleton to fill in.**

### STEP 4 — MATERIAL INVENTORY (5 minutes)

**Probe EVERY file** the user provided:
```bash
for f in CLIENTS/ClientName/IN/raw/*; do
  _SYSTEM/scripts/probe.sh "$f"
done
```

**Generate contact sheets** for every video clip:
```bash
for f in CLIENTS/ClientName/IN/raw/*.mp4 CLIENTS/ClientName/IN/raw/*.MOV; do
  name=$(basename "$f" | sed 's/\.[^.]*$//')
  _SYSTEM/scripts/thumbnail.sh "$f" "CLIENTS/ClientName/WORK/thumb_${name}.jpg" --grid 3x3
done
```

**READ each contact sheet** with the Read tool. Describe what you see in each clip.

**Check Finder tags** (green = user wants these clips used):
```bash
for f in CLIENTS/ClientName/IN/raw/**/*.mp4; do
  tags=$(xattr -px com.apple.metadata:_kMDItemUserTags "$f" 2>/dev/null)
  [[ -n "$tags" ]] && echo "TAGGED: $f"
done
```

**Scene detection** on clips > 15s:
```bash
_SYSTEM/scripts/scene-detect.sh "long_clip.mp4" --threshold 27
```

**List ALL available assets:**
```bash
ls CLIENTS/ClientName/IN/assets/logos/
ls CLIENTS/ClientName/IN/assets/music/
ls CLIENTS/ClientName/IN/assets/references/
```

**Output of this step:** You know EXACTLY what material is available:
- Every clip's content (from reading contact sheets)
- Resolutions, durations, codecs
- Which clips are tagged as must-use
- What music, logos, references exist

**Do NOT propose any edit until this step is complete.**

### STEP 5 — FACE DETECTION (if talking head)

If any clip has a person talking to camera:
```bash
_SYSTEM/scripts/face-detect-crop.py "bruto.MOV" --target 1080x1920 --verify check.jpg
```
**Read check.jpg** — confirm face centered, head not cropped, eyes at 1/3.

### STEP 6 — TRANSCRIPTION (if speech)

```bash
source _SYSTEM/.venv/bin/activate
python3 -c "
from faster_whisper import WhisperModel
model = WhisperModel('medium', device='cpu', compute_type='int8')
segments, info = model.transcribe('bruto.MOV', language='es', word_timestamps=True, beam_size=5)
for seg in segments:
    for w in seg.words:
        print(f'{w.start:7.3f} - {w.end:7.3f}  {w.word.strip()}')
"
```

**Read the full transcription.** Identify:
- Where each phrase starts and ends (word-level timestamps)
- Natural cut points (pauses, phrase boundaries)
- Which sections to include vs exclude

### STEP 7 — CREATIVE DIRECTION (present to user)

Based on material inventory + transcription + brief, write:

```markdown
## Creative Direction — [Project Name]

### Structure
1. Act 1 (0-Xs): [description + which clip + which audio segment]
2. Act 2 (X-Ys): [...]
3. ...

### B-roll selection
- Clip A: [what it shows, why chosen]
- Clip B: [...]

### Motion graphics
- LowerThird: [composition, props, timing]
- EndCard: [composition, props]
- Other: [...]

### Audio
- VO segments: [which words, timestamps]
- Music: [track, BPM, entry point]
- Ducking: yes/no

### Subtitles
- Style: [editorial/social/luxury]
- Language: [es/en]
```

**Present to user for approval BEFORE any rendering.**

### STEP 8 — TIMELINE BUILD

Fill in the timeline.json from step 3 with real paths from step 4:
- Replace all PLACEHOLDERs with actual file paths
- Set in/out timestamps from step 6 transcription
- Configure music, overlays, subtitles

### STEP 9 — RENDER + QA

```bash
# Render
python3 _SYSTEM/scripts/render-edit.py timeline.json v01.mp4

# Automated QA (MANDATORY)
_SYSTEM/scripts/qa-check.sh v01.mp4 --target-lufs -14 --target-duration 30 \
  --target-width 1080 --target-height 1920

# Visual QA: extract frame per act
for ts in [act midpoints]; do
  ffmpeg -ss $ts -i v01.mp4 -vframes 1 qa_${ts}s.jpg
done
# READ EACH FRAME. Compare to creative direction. Fix if wrong.
```

**If QA fails → fix → re-render → re-QA. Do NOT present until ALL pass.**

### STEP 10 — PRESENT TO USER

Copy to review folder with correct naming:
```bash
cp v01.mp4 CLIENTS/ClientName/OUT/review/ClientName_Project_Format_v01.mp4
```

Show the user: duration, format, what was auto-corrected.
Wait for feedback.

### STEP 11 — ITERATE

Map user feedback to specific timeline.json changes.
Bump version → re-render → re-QA → present again.
**Change ONLY what was requested. Nothing else.**

### STEP 12 — DELIVER

```bash
# Copy approved version as master
cp approved.mp4 CLIENTS/ClientName/OUT/master/ClientName_Project_Master_vNN.mp4

# Export to all requested platforms
_SYSTEM/scripts/export-social.sh master.mp4 "ClientName" all

# QA each export
for f in CLIENTS/ClientName/OUT/*/; do
  _SYSTEM/scripts/qa-check.sh "$f"/*.mp4 --target-lufs -14
done

# Cleanup
_SYSTEM/scripts/cleanup.sh "ClientName" --dry-run
# If OK:
_SYSTEM/scripts/cleanup.sh "ClientName"
```

---

### GATE 1 — MATERIAL INSPECTION (before any edit decision)

> **This gate is covered by STEP 4 above. If you followed the Project Start Flow,
> you already completed this. If you're mid-project and new material arrives,
> run these checks on the new material before using it.**

- `probe.sh` every media file → read duration, resolution, codec, audio streams.
- `thumbnail.sh --grid 3x3` every clip → **Read the contact sheet image with the
  Read tool and describe what you see.** Never assume what's in a clip.
- `scene-detect.sh` on any clip > 15s.
- Check macOS Finder tags (green = must use): `xattr -px com.apple.metadata:_kMDItemUserTags`
- Do NOT propose a timeline until you have visually confirmed every clip's content.

### GATE 2 — AUDIO CUT (before any trim of speech)

- **ALWAYS** transcribe with `word_timestamps=True` via faster-whisper Python.
  Never use segment-level timestamps for cut points.
- Read the word-level JSON output. Find the exact word at each cut boundary.
- Analyze waveform around cut points to verify no bleed from adjacent words:
  ```python
  data, sr = sf.read(wav_file, start=int(cut*sr), stop=int((cut+0.2)*sr))
  ```
- Set cut-in at the silence gap BEFORE the first word (verify amplitude < 0.01).
- After trimming, extract first 0.5s and last 0.5s, Read them or check amplitude.
- **Never start a segment mid-word or mid-phrase.** Verify before assembly.

### GATE 3 — FACE CROP / VERTICAL REFRAME (before processing any clip batch)

- Extract a reference frame from the source: `ffmpeg -ss 2 -vframes 1 ref.jpg`.
- Run OpenCV face detection (haarcascades) to get face center coordinates.
  Never assume the face is at arithmetic center of a wide frame.
- Calculate crop: `x = face_center_x - (crop_w / 2)`, clamp to valid range.
- Extract 1 frame from the cropped output and **Read it with Read tool**.
- Verify: head not cropped at top, eyes at upper third, subject centered.
- **Only then** batch-process remaining segments with that crop.
- After batch: spot-check a frame from EACH segment to confirm crop is consistent.

### GATE 4 — SUBTITLE SIZING (before burning subs into any clip)

- Subtitles must be timed against the **assembled video**, not the bruto source.
  Transcribe the assembled audio. Use those timestamps.
- For libass on **1080×1920** (empirically confirmed):
  - FontSize=8: minimal readable
  - FontSize=10-12: clean editorial (RECOMMENDED)
  - FontSize=18+: oversized, wraps
  - FontSize=22+: covers entire frame
- Test on a REAL video frame (not synthetic black):
  `ffmpeg -i assembly.mp4 -vf "subtitles=test.srt:force_style='...'" -ss T -vframes 1 test.jpg`
- **Read the test frame.** Confirm position, size, readability.
- MarginV=40 for bottom-of-screen. MarginV=100+ pushes toward center.
- Ensure subtitles do NOT overlap with LowerThird or other overlays.

### GATE 5 — OVERLAY COMPOSITING (LowerThird, EndCard, title cards)

- **LowerThird:** Use ffmpeg `drawtext` (NOT Remotion + colorkey).
  drawtext produces pixel-perfect text directly on the video.
  For animated slide-in: use x/y expressions with `t` variable.
- **EndCard:** Use Remotion for animations. Verify with frame extraction at
  key animation phases (start, peak, end).
- **Wipe animations:** Use Remotion's BeforeAfterReveal (NOT ffmpeg crop expressions
  on image inputs — these are unreliable).
- After compositing: extract frames at EVERY phase and Read them.
- Verify layer order: the element that should be on top IS on top.

### GATE 6 — ASSEMBLY VERIFICATION (after EVERY concat/assembly step)

After concatenating segments:
1. `ffprobe` → verify total duration = sum of segments (±0.1s tolerance).
2. `ffprobe` → verify SAR=1:1, DAR=9:16 (or expected), resolution correct.
3. Extract 1 frame from EACH segment boundary (±0.5s) → Read to verify:
   - No black frames at joins.
   - Correct clip at correct position.
   - No aspect ratio distortion.
   - Audio present (probe audio stream duration).
4. Extract 1 frame at t=1s → verify first clip is correct.
5. Extract 1 frame at t=end-1s → verify last clip/endcard is correct.

### GATE 7 — PRE-DELIVERY QA (mandatory — never skip)

**Automated:**
```bash
_SYSTEM/scripts/qa-check.sh render.mp4 \
  --target-lufs -14 --target-duration [N] \
  --target-width 1080 --target-height 1920
```

**Visual (extract and Read a frame at EVERY act transition):**
```bash
for ts in [list of key timestamps]; do
  ffmpeg -ss $ts -i render.mp4 -vframes 1 qa_${ts}s.jpg
done
```
Read EACH frame and verify against the user's latest request:
- [ ] Correct clip at each position (compare to user's clip list)
- [ ] No unintended changes from previous approved version
- [ ] Subtitles present, readable, correctly positioned
- [ ] Overlays visible, correct timing
- [ ] No black bars, no aspect ratio distortion
- [ ] SAR=1:1 in ffprobe output
- [ ] Audio plays throughout (no cuts, no silence where there shouldn't be)
- [ ] EndCard animation correct

**Rule: if you cannot visually verify something, DO NOT deliver. Fix it first.**

---

---

### GUIDED WORKFLOW — USE THIS FOR EVERY PROJECT

**This is the mandatory workflow. Do NOT freestyle with raw ffmpeg commands.
Use the scripts that exist. They were built for this.**

#### Phase 0 — PROJECT SETUP
```bash
# 1. Create client folder (if new)
_SYSTEM/scripts/new-client.sh "ClientName"

# 2. Find the best timeline template for this brief
_SYSTEM/scripts/template-selector.sh --brief CLIENTS/ClientName/brief.json

# 3. Copy template to project
_SYSTEM/scripts/template-selector.sh --keywords "talking head vertical" --copy "ClientName"
```

#### Phase 1 — MATERIAL ANALYSIS
```bash
# Probe every file
_SYSTEM/scripts/probe.sh CLIENTS/ClientName/IN/raw/*.mp4

# Generate contact sheets (Read each one!)
_SYSTEM/scripts/thumbnail.sh clip.mp4 sheet.jpg --grid 3x3

# Check Finder tags for must-use clips
for f in CLIENTS/ClientName/IN/raw/Videos\ Interior/*.mp4; do
  tags=$(xattr -px com.apple.metadata:_kMDItemUserTags "$f" 2>/dev/null)
  [[ -n "$tags" ]] && echo "TAGGED: $f"
done

# Face detection for any talking head clips
_SYSTEM/scripts/face-detect-crop.py bruto.mp4 --target 1080x1920 --verify check.jpg
```

#### Phase 2 — TIMELINE & EDIT
```bash
# Edit the timeline.json (replace PLACEHOLDERs with real paths)
# NEVER use raw ffmpeg commands — use render-edit.py

# Render from timeline
python3 _SYSTEM/scripts/render-edit.py CLIENTS/ClientName/timeline.json output.mp4
```

#### Phase 3 — QUALITY ASSURANCE
```bash
# Automated QA (MANDATORY after every render)
_SYSTEM/scripts/qa-check.sh output.mp4 --target-lufs -14 --target-duration 30 \
  --target-width 1080 --target-height 1920

# Visual QA: extract frames at every key moment
for ts in 1 5 10 15 20 25; do
  ffmpeg -ss $ts -i output.mp4 -vframes 1 qa_${ts}s.jpg
done
# Read EACH frame. Compare to user request. Fix if wrong.

# Read VERIFY_CHECKLIST.md for operation-specific checks
```

#### Phase 4 — SUBTITLES
```bash
# Professional subtitles (NOT manual SRT)
_SYSTEM/scripts/subtitle-pro.sh output.mp4 --lang es --style editorial --burn
```

#### Phase 5 — DELIVERY
```bash
# Multi-platform export (one command, all platforms)
_SYSTEM/scripts/export-social.sh master.mp4 ClientName all

# Or specific platform
_SYSTEM/scripts/export-social.sh master.mp4 ClientName instagram-reel
```

#### Phase 6 — CLEANUP (after approval)
```bash
# Archive intermediate files
_SYSTEM/scripts/cleanup.sh "ClientName"
# Or preview first
_SYSTEM/scripts/cleanup.sh "ClientName" --dry-run
```

#### Available Scripts Quick Reference

| Task | Script | Example |
|------|--------|---------|
| Face-centered crop | `face-detect-crop.py` | `face-detect-crop.py bruto.mp4 --target 1080x1920 --apply out.mp4` |
| Split-screen expand | `split-screen-expand.py` | `split-screen-expand.py split.mp4 after.png out.mp4 --split-at 1060` |
| Template selector | `template-selector.sh` | `template-selector.sh --keywords "talking head vertical"` |
| Color match clips | `color-match.sh` | `color-match.sh clip.mp4 reference.jpg matched.mp4` |
| Beat detection | `bpm.py` | `bpm.py music.mp3 --json > beats.json` |
| Stem split | `stem-split.sh` | `stem-split.sh music.mp3` |
| Pro subtitles | `subtitle-pro.sh` | `subtitle-pro.sh video.mp4 --lang es --style editorial --burn` |
| Music mix | `music-mix.sh` | `music-mix.sh video.mp4 music.mp3 --duck` |
| Audio normalize | `normalize-audio.sh` | `normalize-audio.sh video.mp4 normalized.mp4` |
| Ken Burns still | `ken-burns.sh` | `ken-burns.sh photo.jpg video.mp4 --duration 5 --direction in` |
| Remotion render | `remotion-render.sh` | `remotion-render.sh EndCard-Vertical out.mp4 --props '{...}'` |
| Cleanup | `cleanup.sh` | `cleanup.sh "ClientName" --dry-run` |

---

### ANTI-PATTERNS — DO NOT REPEAT THESE

These are specific mistakes made during Livitum Diseñadora production.
Read this list before every change to avoid repeating them.

| # | Anti-pattern | What happened | Prevention |
|---|-------------|---------------|------------|
| 1 | **Assumed crop center** | Face was at x=1322, used x=1312 (arithmetic center) | Always run face detection |
| 2 | **Used segment timestamps** | Audio started mid-sentence because Whisper segment ≠ word boundary | Always use word_timestamps=True |
| 3 | **Never tested subtitle size** | FontSize=22 covered entire frame on 1080×1920 | Always render test frame before burning |
| 4 | **Timed subs against bruto** | Subtitle timestamps didn't match assembled video | Always transcribe the ASSEMBLY |
| 5 | **Used shortest without checking** | `-shortest` truncated audio, cutting final phrase | Always verify output duration matches audio |
| 6 | **Used afade incorrectly** | `afade=t=out` killed ALL audio after the fade point | Never use afade for mid-stream fixes |
| 7 | **Changed unrelated clips** | User asked to change clip 1, also changed clip 2 | Change ONLY what was requested |
| 8 | **Distorted aspect ratio** | Used scale=W:H with wrong ratio, SAR≠1:1 | Always setsar=1, always verify with ffprobe |
| 9 | **Wrong layer order** | Bottom clip rendered on top of expanding top clip | Verify layer order with frame extraction |
| 10 | **Colorkey blur on text** | Remotion h264 + colorkey = blurry text edges | Use drawtext for text, Python for compositing |
| 11 | **SVG recreation of logo** | Tried to draw logo in SVG instead of using real PNG | NEVER recreate assets. Use the original files. |
| 12 | **Delivered without looking** | Presented render with 6 visible errors | ALWAYS Read frames before delivering |
| 13 | **ffmpeg wipe on images** | Crop expressions unreliable with looped image inputs | Use Remotion for animated wipe transitions |
| 14 | **Multiple fixes in one pass** | Changed 5 things, 3 broke, couldn't isolate which | Make ONE change at a time, verify, then next |

---

## What this folder is

This is the **video production hub** for **BMP**, an AI content studio in
Barcelona producing work for fashion, cosmetics and luxury brands. This studio
operates **headless**: there is no Premiere, DaVinci, or FCP in the loop. The
studio owner describes an idea, drops raw material in `00_INBOX/`, and Claude
(you) performs the entire edit — cutting, color, music mixing, text overlays,
subtitles, multi-platform exports — via the ffmpeg-based scripts in
`_SYSTEM/scripts/`. The output must look like it was edited by a professional
human.

## House defaults (from onboarding — 2026-04-08)

These are the studio's standing decisions. Apply them unless the user tells
you otherwise for a specific project:

| Default           | Value                                                    |
|-------------------|----------------------------------------------------------|
| Delivery protocol | User drops clips + music + assets in `00_INBOX/<project>/` and describes the idea in chat. You read the files, propose a `timeline.json`, the user approves, you render. |
| Aspect ratio      | **Ask first.** Never assume. Confirm 9:16 / 16:9 / 1:1 / square / 4:5 before touching anything. |
| Editing style     | **Editorial / luxury by default.** Long, clean cuts (2–4s), minimal transitions (subtle crossfades ≤0.4s), serif typography, sober palette, generous breathing room. Rhythm is slow and confident — not social-style frenetic. Use fast-cut style only when briefed. |
| Subtitles         | **Always burn ES subtitles** via Whisper. Clean style: Helvetica 20pt, white, semi-transparent black box, margin 80px bottom. Skip only if explicitly told. |
| Loudness          | -14 LUFS integrated, -1 dBTP for deliverables. -16 LUFS for master archive. |
| Color             | Rec.709. LUTs applied only when the user provides one or the brief calls for it. |
| Watermark         | Off on client deliverables. On for BMP portfolio cuts (use `_ASSETS/logos/bmp-watermark.png`). |
| Music             | The user provides the track. Never pull music from anywhere else. |

## Architecture

```
02_VIDEO EDITS/
├── CLAUDE.md                <- you are here
├── README.md                <- human-facing quickstart
├── _SYSTEM/                 <- the toolkit (do not put project files here)
│   ├── scripts/             <- scripts you should use for every task
│   │   ├── lib/common.sh    <- shared helpers (sourced by every bash script)
│   │   ├── render-edit.py   <- ⭐ MAIN: declarative timeline → finished video
│   │   │
│   │   │  --- Intake & inspection ---
│   │   ├── new-client.sh    scaffold a new client from the template
│   │   ├── ingest.sh        ingest raw footage with SHA256 + manifest
│   │   ├── proxy.sh         generate editing proxies
│   │   ├── probe.sh         inspect file metadata
│   │   ├── thumbnail.sh     stills and contact sheets (read to "see" clips)
│   │   ├── scene-detect.sh  auto-detect scenes in a long clip
│   │   ├── ocr.sh           extract on-screen text via tesseract
│   │   │
│   │   │  --- Cut & assemble ---
│   │   ├── trim.sh          keyframe or frame-accurate trim
│   │   ├── concat.sh        simple clip join
│   │   ├── crossfade.sh     join clips with xfade transitions
│   │   ├── reframe.sh       change aspect ratio (crop / pad / blur-bg)
│   │   ├── side-by-side.sh  A-vs-B comparison (vertical or horizontal)
│   │   ├── speed.sh         speed change with pitch-corrected audio
│   │   ├── auto-cut.sh      auto-remove silences (talking head)
│   │   ├── stabilize.sh     vidstab two-pass stabilization
│   │   ├── ken-burns.sh     animate a still with pan+zoom
│   │   │
│   │   │  --- Color & text ---
│   │   ├── color-grade.sh   CDL or LUT or preset (editorial/luxury/warm/cool/bw)
│   │   ├── text-overlay.sh  single animated title on a video
│   │   ├── watermark.sh     overlay logo
│   │   │
│   │   │  --- Audio ---
│   │   ├── music-mix.sh     add music with sidechain ducking
│   │   ├── normalize-audio.sh  two-pass EBU R128 loudness
│   │   ├── bpm.py           detect BPM + beat timestamps (librosa)
│   │   │
│   │   │  --- AI / advanced ---
│   │   ├── transcribe.sh    Whisper subtitles (srt/vtt, optional burn)
│   │   ├── remove-bg.sh     rembg background removal (image + video)
│   │   ├── subtitle-pro.sh  pro subtitles: stable-ts + ASS (editorial/social/luxury)
│   │   │
│   │   │  --- Quality & color ---
│   │   ├── qa-check.sh      automated QA (loudness/resolution/duration/VMAF)
│   │   ├── color-match.sh   match clip colors to a reference frame
│   │   ├── stem-split.sh    separate music into vocals/instrumental (demucs)
│   │   │
│   │   │  --- Motion graphics ---
│   │   ├── remotion-render.sh  render a Remotion composition to mp4
│   │   │
│   │   │  --- Distribution ---
│   │   └── export-social.sh fan out to all platforms from a master
│   ├── tools/
│   │   └── briefing-form.html     <- HTML form for structured video briefs
│   ├── motion/
│   │   └── bmp-motion/      <- Remotion React project (motion graphics)
│   │       └── src/compositions/  <- .tsx files for each animated template
│   │           ├── BMPIntro.tsx / LowerThird.tsx / TitleCard.tsx / EndCard.tsx (original)
│   │           ├── MetricCounter / FeatureCallout / ScreenReveal / HookText (SaaS)
│   │           ├── PricingCard / NotificationToast / BeforeAfterSplit (SaaS)
│   │           ├── TitleReveal / LogoSting / ColorWash / SplitDiptych (fashion)
│   │           └── CinematicTitle / ChapterMarker / AtmosphericOverlay / CreditRoll (brand)
│   ├── presets/
│   │   ├── export-presets.json    <- per-platform encoding specs
│   │   ├── ffmpeg-recipes.md      <- raw ffmpeg cheat sheet
│   │   ├── luts/                  <- 3D LUTs (.cube)
│   │   ├── subtitle-styles/       <- ASS style presets (editorial/social/luxury)
│   │   └── timelines/             <- timeline.json templates by video type
│   ├── templates/
│   │   └── _CLIENT_TEMPLATE/      <- skeleton copied for every new client
│   └── config/
│       └── bmp-brand.json         <- brand colors, fonts, watermark spec
├── _ASSETS/                  <- studio-wide reusable assets
│   ├── logos/   music/   sfx/   fonts/   stock/   intros/
├── _DELIVERABLES/            <- archive of approved final files
├── 00_INBOX/                 <- drop zone for unsorted footage
├── 00_INBOX/                 <- drop zone for unsorted footage
└── CLIENTS/
    └── <ClientName>/         <- one folder per client (created by new-client.sh)
        ├── brief.json        <- project brief (fill first)
        ├── timeline.json     <- edit decisions (from template-selector.sh)
        ├── IN/               <- user input — SACRED, never modify
        │   ├── raw/          <- video footage (MOV, MP4)
        │   └── assets/       <- logos, music, references, images
        ├── WORK/             <- Claude's workspace — everything disposable
        │   └── (segments, renders, debug frames, remotion outputs...)
        └── OUT/              <- final deliverables
            ├── master/       <- high-quality archive (from export-social.sh)
            ├── instagram-reel/ <- platform exports (from export-social.sh)
            └── ...
```

### Folder rules — simple

1. **`IN/` is sacred.** Never modify, rename, or delete files inside.
2. **`WORK/` is disposable.** Everything can be regenerated from IN + timeline.json.
   Run `cleanup.sh` after project approval to archive intermediates.
3. **`OUT/` is for finals only.** Review versions and platform exports go here.
4. **`brief.json` and `timeline.json`** live at the project root — they ARE the project.
5. **No numbered folders.** IN, WORK, OUT. That's it.

## Naming conventions

```
{Client}_{Project}_{Format}_v{NN}.mp4
Livitum_AvsD_IGReel_v03.mp4
Livitum_BrandFilm_Master_v01.mp4
```

- Client name in PascalCase (no spaces).
- Project slug in PascalCase (e.g. `BrandFilm`, `SS26Launch`).
- Format token: `Master`, `IGReel`, `IGStory`, `TikTok`, `YT16x9`, `YTShort`,
  `LinkedIn`.
- Version `vNN` zero-padded, increment on every send to client.

## Dependencies (installed 2026-04-08)

### Core (brew)
| Tool              | Purpose                              |
|-------------------|--------------------------------------|
| **ffmpeg-full 8.1** | every encoding/edit op. Includes drawtext (libfreetype), libass (subtitles), vidstab (stabilization), libplacebo, libwhisper embedded, videotoolbox HW accel |
| jq, mediainfo, imagemagick, yt-dlp, tesseract, sox, rubberband | utilities |
| **Editorial fonts** | Playfair Display, DM Serif Display, Libre Baskerville, Inter (installed in `~/Library/Fonts`) |

### Python stack — BMP venv at `_SYSTEM/.venv/`
Activate with: `source _SYSTEM/.venv/bin/activate` or call binaries directly.
| Package              | What it unlocks                                  |
|----------------------|--------------------------------------------------|
| **scenedetect[opencv]** | Auto scene detection in long clips            |
| **librosa**          | BPM / beat detection for beat-sync editing      |
| **rembg[cpu]**       | Background removal (image + video with alpha)   |
| **moviepy**          | Python-programmable edits                        |
| **opencv-python-headless** | Computer vision (face detection, tracking) |
| **faster-whisper**   | 4× faster Whisper for subtitles                 |
| **Pillow**, numpy, scipy, soundfile | image/audio processing           |
| **ffmpeg-quality-metrics** | VMAF/SSIM/PSNR QA scoring per export     |
| **color-matcher**          | Auto color-match clips from different sources |
| **stable-ts (stable_whisper)** | Word-level subtitles + ASS styling   |
| **demucs**                 | Audio stem separation (vocals/instrumental) |

### Pipx tools (isolated)
- **auto-editor 29.3.1** — silence removal
- **openai-whisper 20250625** — CLI subtitles

### Motion graphics — Remotion at `_SYSTEM/motion/bmp-motion/`
React-based programmable video. Contains these compositions:

**Original (4):**
- `BMPIntro-Vertical` / `BMPIntro-Horizontal` — animated brand intro
- `LowerThird-Vertical` / `LowerThird-Horizontal` — name+role caption
- `TitleCard-Vertical` — "ANTES / DESPUÉS"-style section markers
- `EndCard-Vertical` — outro with CTA

**SaaS / Product Ads (7):**
- `MetricCounter` — animated number counter (value, label, prefix, suffix)
- `FeatureCallout` — line + badge callout for UI features
- `ScreenReveal` — mask wipe revealing a screenshot/mockup
- `HookText` — large impact text for first 3s (lines, style: bold/serif/minimal)
- `PricingCard` — plan cards with highlighted tier
- `NotificationToast` — toast notification slide-in
- `BeforeAfterSplit` — vertical wipe comparison overlay

**Fashion / Lifestyle (4):**
- `TitleReveal` — word-by-word text reveal (serif/sans, configurable stagger)
- `LogoSting` — logo with spring overshoot (spring/fade/grow-line variants)
- `ColorWash` — color overlay dissolve (transparent, for compositing)
- `SplitDiptych` — two-panel divider layout overlay

**Brand Film (4):**
- `CinematicTitle` — large display type with slow fade + vertical drift
- `ChapterMarker` — numbered section marker ("01 — TITLE")
- `AtmosphericOverlay` — film grain / dust / vignette loop (transparent)
- `CreditRoll` — slow scrolling credits

All compositions have `-Vertical` (1080x1920) and `-Horizontal` (1920x1080) variants.

Render with `_SYSTEM/scripts/remotion-render.sh <composition-id> <out.mp4> --props '<json>'`.
Dev studio (hot-reload preview): `cd _SYSTEM/motion/bmp-motion && npm start`.

### Additional tools (installed 2026-04-09)
| Tool | Purpose |
|------|---------|
| **remotion-animated** | Declarative `<Animated>` component for spring/fade/scale in Remotion compositions |
| **katna** | Python smart-crop/resize with Mediapipe (content-aware reframing for talking heads) |

### GitHub repos to evaluate (not yet installed)
| Repo | Stars | Purpose |
|------|-------|---------|
| [Autocrop-vertical](https://github.com/kamilstanuch/Autocrop-vertical) | ~60 | YOLOv8 auto-reframe horizontal→vertical |
| [3D Ken Burns](https://github.com/sniklaus/3d-ken-burns) | ~1.4k | Parallax Ken Burns from depth estimation |
| [PupCaps](https://github.com/hosuaby/PupCaps) | ~100 | CSS3-styled subtitle overlays as transparent MOV |
| [Motion Canvas](https://github.com/motion-canvas/motion-canvas) | ~18k | Alternative motion graphics framework |
| [Revideo](https://github.com/redotvideo/revideo) | ~3.7k | Headless Motion Canvas fork for CLI rendering |

### Reinstall everything
```bash
brew install ffmpeg-full jq mediainfo imagemagick yt-dlp tesseract sox rubberband pipx
brew install --cask font-playfair-display font-inter font-libre-baskerville font-dm-serif-display
python3 -m venv _SYSTEM/.venv
_SYSTEM/.venv/bin/pip install "scenedetect[opencv]" librosa numpy Pillow moviepy \
  opencv-python-headless soundfile faster-whisper "rembg[cpu]" onnxruntime
pipx install auto-editor openai-whisper
cd _SYSTEM/motion/bmp-motion && npm install
```

## How to use the scripts

All scripts live in `_SYSTEM/scripts/` and are executable. They source
`lib/common.sh` which exposes `VIDEO_ROOT`, `CLIENTS_DIR`, `client_dir`,
logging helpers, and dependency checks.

### Onboard a new client
```bash
_SYSTEM/scripts/new-client.sh "Vulcano"
```
Creates `CLIENTS/Vulcano/` from the template and stamps `PROJECT.md`.

### Ingest footage from an SD card or folder
```bash
_SYSTEM/scripts/ingest.sh /Volumes/SD_CARD/DCIM Livitum
```
Copies media into `CLIENTS/Livitum/01_FOOTAGE/raw/`, computes SHA256, writes
`_manifest.tsv`, and is idempotent (skips already-ingested files).

### Generate proxies (for editing)
```bash
_SYSTEM/scripts/proxy.sh Livitum                # 1080p H.264 default
_SYSTEM/scripts/proxy.sh Livitum --height 720   # smaller proxies
```

### Inspect a file
```bash
_SYSTEM/scripts/probe.sh "CLIENTS/Livitum/01_FOOTAGE/raw/clip.mp4"
```

### Trim a clip
```bash
# Lossless (keyframe-aligned, instant)
_SYSTEM/scripts/trim.sh in.mp4 00:00:10 00:00:25 cut.mp4
# Frame-accurate (re-encodes)
_SYSTEM/scripts/trim.sh in.mp4 5 +12 cut.mp4 --reencode
```

### Assemble multiple clips
```bash
# From a list file
_SYSTEM/scripts/concat.sh -o roughcut.mp4 -f edl.txt
# Or inline
_SYSTEM/scripts/concat.sh -o roughcut.mp4 a.mp4 b.mp4 c.mp4
```

### Normalize audio to broadcast spec (-14 LUFS)
```bash
_SYSTEM/scripts/normalize-audio.sh roughcut.mp4 roughcut_norm.mp4
```

### Add the studio watermark
```bash
_SYSTEM/scripts/watermark.sh in.mp4 out.mp4 --pos br --scale 0.12
```
> Drop the studio watermark PNG (transparent) in `_ASSETS/logos/bmp-watermark.png`.

### Transcribe & burn captions
```bash
_SYSTEM/scripts/transcribe.sh in.mp4 --lang es --burn
```

### Export a master to every social platform
```bash
_SYSTEM/scripts/export-social.sh master.mp4 Livitum all
# Or just one
_SYSTEM/scripts/export-social.sh master.mp4 Livitum instagram-reel --fit crop
```
`--fit` controls aspect handling: `pad` (letterbox, default), `crop` (center
crop, no bars), `stretch` (avoid).

### Generate a thumbnail / contact sheet
```bash
_SYSTEM/scripts/thumbnail.sh in.mp4 thumb.jpg --at 00:00:03
_SYSTEM/scripts/thumbnail.sh in.mp4 sheet.jpg --grid 4x3
```

### QA check a rendered video
```bash
_SYSTEM/scripts/qa-check.sh render.mp4 --target-lufs -14 --target-duration 30 \
  --target-width 1080 --target-height 1920
# Optional: compare vs master for VMAF score
_SYSTEM/scripts/qa-check.sh export.mp4 --master master.mp4
```

### Color-match clips to a reference
```bash
_SYSTEM/scripts/color-match.sh clip.mp4 reference.jpg matched.mp4
# Methods: mkl (default, best), reinhard, mvgd, hm
_SYSTEM/scripts/color-match.sh clip.mp4 ref.jpg out.mp4 --method reinhard
```

### Split music into stems
```bash
_SYSTEM/scripts/stem-split.sh music.mp3
# Output: stems_music/vocals.wav + stems_music/instrumental.wav
_SYSTEM/scripts/stem-split.sh talking_head.mp4 --output-dir ./stems
```

### Pro subtitles with ASS styling
```bash
# Generate .ass file only
_SYSTEM/scripts/subtitle-pro.sh input.mp4 --lang es --style editorial
# Generate and burn into video
_SYSTEM/scripts/subtitle-pro.sh input.mp4 --lang es --style social --burn
# Styles: editorial | social | luxury
```

## Professional criteria system — READ BEFORE EVERY PROJECT

These rules are derived from analysis of high-performing paid social ads,
agency production frameworks, and editorial video standards. They are **not
optional** — they are the minimum bar for quality. If a render violates any
of these rules, it must be fixed before showing to the user.

### Phase 0 — Research (MANDATORY before creative direction)

Before proposing any creative direction, you MUST:

1. **Research the client's brand** — visit their website, read their copy,
   understand their value proposition, tone, and visual identity. Extract:
   colors, fonts, taglines, pricing, social proof stats, CTA language.
2. **Download additional assets from their web** — screenshots of key pages,
   product images, team photos. Don't rely only on what the user provides.
3. **Study 3+ reference ads** from competitors or the same category. Note
   their structure, pacing, text treatment, and CTA approach.
4. **Define the video type** and select the matching framework below.

### Ad frameworks by type

#### Talking Head + B-Roll Ad (most common for service brands)

```
STRUCTURE:
  Hook (0-3s)     → Pattern interrupt. Bold claim or relatable pain point.
                     Speaker starts MID-SENTENCE, not with "Hola, soy..."
  Body (3-20s)    → Alternate talking head ↔ b-roll every 3-5 seconds.
                     Audio from speaker CONTINUES over b-roll (J-cut).
                     Never cut audio and video at the same time.
  CTA (last 2-3s) → Logo + one line + directive. Audio still live, not silence.
                     Hold last frame 1-1.5s after final word.
```

#### Product/Service Showcase (no talking head)

```
STRUCTURE:
  Hook (0-3s)     → Before/after reveal, or striking visual + text hook.
  Features (3-15s)→ Product shots with animated text callouts.
  Social proof     → Counter animation (reviews, users, projects).
  CTA (last 3s)   → Clean end card with pricing + URL.
```

### Shot composition rules (vertical 9:16)

| Rule | Standard |
|------|----------|
| Talking head framing | Subject centered, eyes at 1/3 from top. Chest to head visible. NEVER crop the top of the head. |
| Horizontal source → vertical | Use **auto-reframe** (face detection) when available. Fallback: blur-bg with subject at 83% width, NOT aggressive center-crop. |
| B-roll framing | Full-bleed cover crop. If horizontal source, use the most interesting 9:16 region, not always center. |
| Render/still framing | Ken Burns (zoom 1.0→1.12 over 2s). Alternate in/out between consecutive renders. |
| Safe zones | **Top 180px and bottom 180px** clear of text/logos (platform UI). For Reels/Stories: top 360px, bottom 900px completely clear. Title-safe = center 80% of frame (864×1536 on 1080×1920). |

### Text overlay rules (mobile-first)

| Rule | Standard |
|------|----------|
| Font size | **Minimum 36pt** for headings, 24pt for body. Anything smaller is unreadable on mobile. Max 20% of frame covered by text at any moment. |
| Words per screen | **3-6 words max** per text overlay. One idea per screen. |
| Font family | Sans-serif for readability (Inter Bold). Serif only for brand/luxury moments (DM Serif Display). |
| Contrast | White text + drop shadow (0 2px 12px rgba(0,0,0,0.6)). Or semi-transparent dark pill behind text. |
| Position | **Center or lower-third area** (above bottom safe zone). Never top — covered by platform UI. |
| Keyword highlight | One word per overlay can be in accent color for emphasis. |
| Lower thirds | Name: 36pt+ serif. Role: 20pt+ sans. Animated accent line. Appear within first 2s, last max 3s. |
| Duration | Minimum 1.5s on screen. Fade in 0.2s, hold, fade out 0.2s. |

### Transition rules

| Rule | Standard |
|------|----------|
| Default | **Hard cut** (80% of transitions). Clean and professional. |
| Crossfade | Only between thematic sections (e.g., talking head → render showcase). Max 0.25s. |
| Slide / Wipe / Zoom | **NEVER USE.** These look amateur on paid social. |
| Jump cut | Acceptable between different angles of same speaker. |
| Match cut | Ideal: cut from talking head gesture → b-roll that continues the motion. |

### Audio mixing rules

| Rule | Standard |
|------|----------|
| VO level | -14 LUFS integrated for the VO track alone. |
| Music level | -18 to -22 dB below VO. Must be barely perceptible during speech. |
| Ducking | Sidechain compress music against VO. Ratio 8:1, attack 5ms, release 300ms. |
| Music fade in | 0.5-1.0s at video start. Music should already be playing when VO begins. |
| Music fade out | Start fading 1.5s before video end. End at silence. |
| Silence gaps | Max 0.3s between VO segments. Fill with room tone or music. |
| End card audio | Music only (no VO), slightly louder than during speech segments. |

### Color and look rules

| Rule | Standard |
|------|----------|
| Base | Rec.709. No heavy grading unless brief specifies. |
| Consistency | All clips must match in white balance and exposure. Use color-match.sh against a reference frame if sources vary. |
| Editorial preset | Contrast +8%, saturation -8%, slight warm shift. Consistent across all clips. |
| Film grain | Subtle (noise=alls=3:allf=t in ffmpeg) on final render for texture. Never on renders/stills. |
| Black levels | Lift blacks slightly (0.02) for a matte/editorial look. Crushed blacks = amateur. |

### Pacing rules

| Rule | Standard |
|------|----------|
| Editorial/luxury | 2-4s per shot. Cuts on phrase/sentence boundaries. |
| Social/performance | 1.5-2.5s per shot. Cuts closer to beat-level. |
| First shot | Minimum 1.5s. Breathing room — don't rush. |
| Last shot before CTA | Hold 1.0s after last word. Don't cut to black immediately. |
| B-roll during speech | Audio leads video change by 0.2-0.3s (J-cut). |
| Music-synced cuts | For editorial: cuts on phrase ends (every 4-8 bars). Never on every beat. |

### Auto-review checklist (Phase 6 — MUST ALL PASS)

Before showing ANY render to the user, verify ALL of these:

**Technical:**
- [ ] Resolution matches target (1080×1920 for vertical)
- [ ] Loudness -14 LUFS ±0.5dB
- [ ] No unexpected silence > 0.5s (check with qa-check.sh)
- [ ] No black frames > 0.3s between clips
- [ ] Audio present on all clips that should have it

**Composition (check via contact sheet + key frame extraction):**
- [ ] Talking head: subject properly framed (head not cropped, eyes at 1/3)
- [ ] Text overlays: readable at phone size (36pt+ headings)
- [ ] Text overlays: appear OVER video, never on black/solid backgrounds
- [ ] Lower third: appears on the talking head clip, not on b-roll
- [ ] No slide/wipe transitions (only cuts and crossfades)
- [ ] End card: logo clearly visible, CTA readable

**Narrative:**
- [ ] Hook in first 3s (bold statement, not "Hola soy...")
- [ ] VO audio continues over b-roll (J-cut style)
- [ ] Pacing matches the framework (2-4s for editorial, 1.5-2.5s for social)
- [ ] CTA is clear and appears in last 2-3s
- [ ] Music is subtle, not competing with VO

**Brand alignment:**
- [ ] Uses client's actual brand colors/fonts where relevant
- [ ] Stats/numbers match the client's real data (not rounded or guessed)
- [ ] CTA language matches what the client uses on their website




When the user describes a video idea, the entire production pipeline runs
automatically. **No manual skill invocation needed.** Just say something
about making a video and the flow starts.

### Trigger detection
If the user mentions making, creating, editing, or producing a video — or
mentions a client name with new material — start the flow immediately.

### HTML briefing form (optional)
The user can optionally fill `_SYSTEM/tools/briefing-form.html` in a browser
beforehand. It exports a `brief-input.json` that you read in Phase 1. This
is NOT required — the user can also just describe the video in chat.

### The 9 phases

```
USER INPUT (chat or brief-input.json)
  → [1] BRIEFING (2-5 questions to fill gaps → brief.md)
  → [2] MATERIAL ANALYSIS (probe + contact sheets + scene detect → material-report.md)
  → [3] CREATIVE DIRECTION (study refs, propose treatment → CREATIVE_DIRECTION.md)
        >>> USER APPROVES <<<
  → [4] TIMELINE (build timeline.json from approved direction)
        >>> USER APPROVES <<<
  → [5] RENDER v01 (internal — user does NOT see this)
  → [6] AUTO-REVIEW (checklist against brief → REVISION_NOTES.md → fix → re-render)
  → [7] PRESENTATION (show passing render to user)
        >>> USER FEEDBACK <<<
  → [8] ITERATION (if needed: edit timeline, re-render, re-QA)
  → [9] DELIVERY (export-social + QA per export + save as template?)
```

### Phase 1 — Briefing
- Check for `brief-input.json` in the project folder or `00_INBOX/`
- Detect video type: SaaS product ad / fashion-lifestyle / brand film
- Ask ONLY what's missing (2-5 targeted questions max)
- Required before proceeding: video type, aspect ratio, duration, platforms
- Create client folder if needed (`new-client.sh`)
- Output: `CLIENTS/<Client>/brief.json`

### Phase 2 — Material analysis
- `probe.sh` on every media file
- `thumbnail.sh --grid 3x3` on every clip → Read contact sheets to "see" content
- `scene-detect.sh` on clips > 15s
- Catalog all assets: logos, music, fonts, references
- Output: `CLIENTS/<Client>/00_BRIEF/material-report.md`

### Phase 3 — Creative direction (SPEND TIME HERE)
**This is the most important phase.** Think deeply before touching any timeline.

1. **Study references** — analyze cut rhythm, color palette, typography, mood
2. **Write treatment document** covering:
   - Narrative arc (3-act, problem-solution, mood progression)
   - Rhythm and cuts (shot duration per section, transition choices + rationale)
   - Color direction (preset/LUT, reference frame for color-matcher)
   - Typography and overlays (which Remotion compositions, where, with what props)
   - Motion graphics plan (every animated element with timestamp + composition ID)
   - Music and audio (BPM analysis, beat/phrase alignment, ducking, fades)
   - Shot selection (specific clips + timestamps with rationale for each)
3. **Present for approval** — user sees the full creative direction and can
   redirect BEFORE any rendering happens

Output: `CLIENTS/<Client>/00_BRIEF/CREATIVE_DIRECTION.md`

### Phase 4 — Timeline construction
- Load appropriate base template from `_SYSTEM/presets/timelines/`
- Replace PLACEHOLDER clips with real clips from material report
- Apply creative direction decisions (transitions, timing, overlays)
- If music provided: run `bpm.py`, align cuts to beat/phrase boundaries
- Present to user as a readable table (not raw JSON)
- Output: `CLIENTS/<Client>/03_EDIT/timelines/<project>_v01.timeline.json`

### Phase 5 — Internal render
- Run `render-edit.py` with approved timeline
- Output to temp location — user never sees v01

### Phase 6 — Auto-review (MANDATORY GATE — never skip)
Run these checks on every internal render. Fix and re-render until passing.
**Run BOTH scripts:** `qa-check.sh` (technical) AND `qa-visual.sh` (visual).
Then READ the contact sheet yourself and verify the manual checklist.
**If any check fails, DO NOT present to the user. Fix and re-render.**

**Technical (automated via qa-check.sh):**
- Duration within +-2s of brief target
- Resolution and aspect ratio correct
- Loudness -14 LUFS +-0.5dB
- No unexpected silence > 1s
- No black frames between clips
- Audio present

**Editorial (AI self-review via contact sheet of render):**
- First clip has >= 0.5s breathing room
- Last clip holds >= 1s before black
- No text shorter than 1.5s or longer than 4s
- Crossfades <= 0.4s (editorial) unless brief says otherwise
- No clip shorter than 1.5s (except intentional hooks)

**Brief alignment (AI self-review):**
- Opening 3s have a clear hook
- Narrative matches creative direction
- All motion graphics from the plan are present
- Pacing matches requested style
- Brand elements present where specified

Output: `CLIENTS/<Client>/03_EDIT/REVISION_NOTES.md`
Max 3 internal loops. If still failing, present with notes explaining what
couldn't be auto-fixed.

### Phase 7 — Presentation
- Copy passing render to `OUT/{Client}_{Project}_{Format}_v01.mp4`
- Show summary: duration, format, what was auto-corrected
- Wait for user feedback

### Phase 8 — Iteration
- Map natural language feedback to timeline changes
- Bump version → re-render → re-run auto-review → present again

### Phase 9 — Delivery
1. Copy approved to `OUT/master/{Client}_{Project}_Master_v{NN}.mp4`
2. Run `export-social.sh` for all platforms in the brief
3. Run `qa-check.sh` on each export
4. Ask: "Save this timeline as a template for future projects?"
   - If yes: strip paths → replace with semantic PLACEHOLDERs → save to
     `_SYSTEM/presets/timelines/` with `_meta` tags

### Timeline templates
Pre-built timeline.json structures in `_SYSTEM/presets/timelines/`:
- `saas-product-30s.json` / `saas-product-60s.json`
- `fashion-music-30s.json` / `fashion-music-60s.json`
- `brand-film-60s.json` / `brand-film-90s.json`

Each has `_meta` with sections, timing, and notes. Clips use
`PLACEHOLDER:semantic-name` labels replaced with real files during Phase 4.

### Subtitle style presets
Three ASS presets in `_SYSTEM/presets/subtitle-styles/`:
- `editorial` — DM Serif Display, white, no box, subtle shadow, centered bottom
- `social` — Inter Bold, white, black box, word highlight, centered
- `luxury` — Playfair Display, warm white, no box, letter-spacing, bottom-left

Use via: `subtitle-pro.sh input.mp4 --style editorial --lang es --burn`

---

## Legacy workflow reference (v1)

> The v1 workflow below is still valid for quick one-off tasks. For full
> video production, use the unified v2 flow above.

### Quick edit steps (v1)
1. Probe + contact sheet every clip
2. Ask format/duration/destination
3. Write timeline.json, show it, wait for approval
4. Render with `render-edit.py`
5. Iterate: edit timeline, bump version, re-render
6. Finalize: copy to `OUT/master/`, run `export-social.sh`

## Advanced capabilities — when to reach for which tool

### Motion graphics beyond drawtext
For anything more than a simple title — animated brand intros, lower thirds,
title cards, end cards, counters, progress bars, kinetic text — use Remotion
(`_SYSTEM/motion/bmp-motion/`). It's React/TSX, fully programmable, and the
output is pristine. Pre-built compositions:
- `BMPIntro-Vertical` — letters rise with stagger spring, gold line grows under
- `TitleCard-Vertical` — "ANTES / DESPUÉS"-style section markers
- `LowerThird-Vertical` — name+role caption sliding in from left
- `EndCard-Vertical` — outro with brand + CTA + URL

Render a 3-second intro with custom brand:
```bash
_SYSTEM/scripts/remotion-render.sh BMPIntro-Vertical intro.mp4 \
  --props '{"brand":"LIVITUM","tagline":"BY BMP","primaryColor":"#0A0A0A","accentColor":"#C6A35D"}'
```
You can edit any composition file (.tsx) to tune the animation and re-render —
no rebuild step needed, Remotion handles it.

To create a NEW composition:
1. Add a `.tsx` file under `_SYSTEM/motion/bmp-motion/src/compositions/`
2. Import and register it in `src/Root.tsx` with a `<Composition>` element
3. Render via `remotion-render.sh <composition-id> ...`

### Beat-sync editing (music-driven cuts)
When the user provides music, detect beats first:
```bash
_SYSTEM/scripts/bpm.py music.mp3 --json > /tmp/beats.json
```
You get BPM, beat timestamps, downbeats (every 4th beat) and phrase ends
(every 32nd beat = 8-bar phrases). For editorial/luxury, cuts should land on
phrase ends, not every beat. Feed those timestamps into a timeline.json as
the `out` times of consecutive clips for a perfectly synced edit.

### Auto scene detection
For long clips that contain multiple shots internally:
```bash
_SYSTEM/scripts/scene-detect.sh input.mp4 --threshold 27
# Or split into individual files:
_SYSTEM/scripts/scene-detect.sh input.mp4 --split
```
Threshold: lower = more sensitive. Use ~20 for dynamic footage, ~27 for stable.

### Background removal
`remove-bg.sh image.jpg out.png` — product cutouts, model isolation.
`remove-bg.sh clip.mp4 out.mov` (to mov/prores4444 or webm/vp9) — video with alpha.
First run downloads the u2net model (~170MB).

### Color grading
Quick looks without a LUT:
```bash
_SYSTEM/scripts/color-grade.sh in.mp4 out.mp4 --preset editorial
# Presets: editorial | warm | cool | luxury | bw
```
With a LUT: `--lut path/to/look.cube`.
Manual: `--lift 0.02 --gamma 0.96 --gain 1.05 --sat 0.92 --contrast 1.08`.

### Stabilization
For phone / handheld footage: `stabilize.sh shaky.mp4 stable.mp4`.
Two-pass (detect → transform), crops slightly to hide borders.

### Still → video (Ken Burns)
For product shots or rendered stills:
```bash
_SYSTEM/scripts/ken-burns.sh shot.jpg shot.mp4 \
  --duration 5 --direction in --zoom 1.15 --easing ease-in-out
```
Directions: in, out, left, right, up, down, diag.

### OCR on video
Extract on-screen text from a video (timestamps + detected text):
`ocr.sh video.mp4 --lang spa+eng` — useful for auto-indexing footage.

## Editorial principles (how to make it look human)

When composing a timeline, apply these by default — they are what separates an
AI-generated edit from a professional one.

1. **Breathing room.** First and last clip of the sequence should have ~0.5s
   of "air" (no text, no music change) to anchor the viewer.
2. **Cut on motion, not on stillness.** Trim a clip to end just before action
   starts in the next clip — it hides the cut.
3. **J/L cuts on dialogue.** When the user provides VO, let the audio lead
   the video by 0.2-0.4s. The opposite — video changing before audio — feels
   robotic.
4. **Music-aware cuts.** If the user supplies music, analyze its BPM (use
   `ffprobe` + audio envelope, or just listen to the first 8 bars and place
   cuts on downbeats). For editorial style, cuts land on phrase ends (every
   4 or 8 bars), not every beat.
5. **Text timing.** A title needs ~0.3s fade-in, ~1.5-2.5s read time, ~0.3s
   fade-out. Never let text snap.
6. **Color consistency.** If clips come from different sources, apply a mild
   contrast/saturation normalization (ffmpeg eq filter) before concat.
7. **One idea per shot.** If a clip has multiple moments, trim it to the best
   2-3 seconds. Do not keep anything "just because".
8. **End frame.** Hold the last frame for ~1s after the music fade before
   black. Premature cuts to black feel amateur.

## Workflow you should follow when the user gives you a video task

1. **Locate the project.** If they drop files in `00_INBOX/`, it's a new
   project. If they mention a client name, read that client's `PROJECT.md`.
2. **Inspect every input.** probe + contact sheet. Never operate blind.
3. **Ask format + duration + destination** if not specified.
4. **Propose a timeline.json in chat** before rendering. Wait for approval.
5. **Use render-edit.py** for the main edit. Use the specialized wrappers
   (side-by-side, reframe, text-overlay) only for quick one-offs.
6. **Write outputs in the right folder** — reviews in `OUT/`, finals in
   `OUT/`. Never dump in project root.
7. **Respect naming**: `{Client}_{Project}_{Format}_v{NN}.mp4`.
8. **Stay idempotent.** Re-running = overwrite cleanly, no duplicates.
9. **Run the delivery checklist** before declaring anything final.

## Things you should NOT do

- Do **not** edit, rename or delete anything inside `01_FOOTAGE/raw/`.
- Do **not** run destructive bulk operations (`rm -rf`, find -delete) without
  explicit confirmation, even on proxy/render folders.
- Do **not** install heavy software (ffmpeg, whisper, brew packages) without
  asking. Just tell the user the install command.
- Do **not** invent new top-level folders. Extend within the existing
  architecture or propose a change in this file first.
- Do **not** create marketing copy, social captions, or hashtags unless asked.
- Do **not** bypass `export-social.sh` to roll your own encode for a final
  delivery — the presets are intentional.

## Conventions for editing this CLAUDE.md

If the architecture changes, update **this file first**, then the README. New
scripts need: a one-line description in this table, a usage example, and a
header comment block matching the style of the existing scripts.
