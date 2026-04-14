# BMP Studio v2 — Design Spec

> **Date:** 2026-04-09
> **Status:** Draft — pending user approval
> **Scope:** Full system upgrade for the BMP headless video production studio

---

## 1. Problem statement

The current BMP setup has functional scripts and a small Remotion library, but
every project requires improvisation. There are no guided workflows, no
creative planning phase, no auto-QA, no reusable templates, and only 4 basic
motion graphics compositions. The result: inconsistent quality, wasted time
re-discovering the same patterns, and videos that often need heavy revision
after first render.

## 2. Goal

When the user describes a video idea (optionally via an HTML briefing form),
the system runs a continuous flow — briefing, material analysis, creative
direction, timeline, render, self-review, presentation — producing
professional-quality video with minimal iteration. Each successful project
feeds back into the system as a reusable template.

## 3. Success criteria

- User can go from "quiero hacer un video de X" to first presentable render
  without invoking any skill or script manually.
- The system self-reviews every render against the brief before showing it
  to the user, catching 80%+ of the issues that currently require revision.
- At least 6 timeline templates exist covering the 3 core video types
  (SaaS ad, fashion ad, brand film) in 30s and 60s variants.
- At least 15 new Remotion compositions are available for motion graphics.
- Every delivery passes an automated QA checklist (loudness, resolution,
  duration, VMAF).
- Templates grow organically — after each successful delivery, the system
  offers to save the timeline as a new template.

---

## 4. Architecture overview

### 4.1 The unified flow

The entire workflow is a single continuous conversation. No manual skill
invocation. The user says something about a video and the system detects the
intent and runs through these phases:

```
USER INPUT (chat or brief-input.json)
  |
  v
[1] BRIEFING .............. 2-5 questions to fill gaps
  |                         Output: brief.md
  v
[2] MATERIAL ANALYSIS ..... probe + contact sheets + scene detect
  |                         Output: material-report.md
  v
[3] CREATIVE DIRECTION .... study references, propose visual treatment
  |                         Output: CREATIVE_DIRECTION.md
  |                         >>> USER APPROVES <<<
  v
[4] TIMELINE .............. build timeline.json from approved direction
  |                         >>> USER APPROVES <<<
  v
[5] RENDER v01 ............ internal, user does NOT see this
  v
[6] AUTO-REVIEW ........... checklist against brief + editorial rules
  |                         Output: REVISION_NOTES.md
  |                         Fix timeline -> re-render (loop until pass)
  v
[7] PRESENTATION .......... show video + revision notes to user
  |                         >>> USER FEEDBACK <<<
  v
[8] ITERATION ............. edit timeline, re-render, re-QA (if needed)
  v
[9] DELIVERY .............. export-social + QA per export + archive
                            Ask: save as template?
```

### 4.2 Phase details

#### Phase 1: Briefing

**Trigger:** User mentions making a video, or says "nuevo video".

**Input sources (in priority order):**
1. `brief-input.json` from the HTML form (if exists in project folder)
2. Chat message content
3. Existing `PROJECT.md` if client folder exists

**Process:**
- Detect video type from context (SaaS ad / fashion / brand film)
- Check what info is already available
- Ask ONLY what's missing — 2-5 targeted questions max
- If client folder doesn't exist, run `new-client.sh`
- If material is in `00_INBOX/`, move to client folder structure

**Output:** `CLIENTS/<Client>/00_BRIEF/brief.md` (structured)

**Required fields (must have before proceeding):**
- Video type
- Aspect ratio (9:16 / 16:9 / both)
- Target duration
- Target platforms
- Available material (what exists in folders)

**Optional fields (enhance quality but not blocking):**
- Reference links
- Mood / 3 keywords
- Music info
- Subtitle language
- Specific requests / things to avoid

#### Phase 2: Material analysis

**Process:**
- `probe.sh` on every media file in `IN/raw/` and `00_INBOX/<project>/`
- `thumbnail.sh --grid 3x3` on every video clip → Read contact sheets
- `scene-detect.sh` on any clip > 15s
- Catalog all assets: logos, music, fonts, references
- If reference images exist, analyze color palette and mood

**Output:** `CLIENTS/<Client>/00_BRIEF/material-report.md`

```markdown
## Material Report — Livitum SS26

### Video clips (4 files, 142s total)
| File | Resolution | FPS | Duration | Scenes | Notes |
|------|-----------|-----|----------|--------|-------|
| hero.mp4 | 3840x2160 | 30 | 38.5s | 8 | Talking head + product |
| ...

### Images (36 files)
| Folder | Count | Resolution | Content |
|--------|-------|-----------|---------|
| references/p1_madera-verde | 11 | 1600x1200 | Interior renders, green wood |
| ...

### Audio
- Music: none provided (user to supply)
- VO: embedded in hero.mp4

### Logos
- livitum-logo.png (800x200, white bg)
- livitum-logo-transparent.png (800x200, alpha)

### Usable duration by shot type
- Close-ups: ~24s across 3 clips
- Wide shots: ~18s across 2 clips
- Talking head: ~38s (1 clip, needs trimming)
- Product detail: ~12s across 4 clips
- Still images suitable for ken-burns: 36 frames
```

#### Phase 3: Creative direction

**This is the most important phase.** The system spends significant time
thinking about the video before touching any timeline.

**Process:**

**3a. Reference study** (if links provided)
- Analyze reference videos/images for: cut rhythm, color palette,
  typography style, transition types, mood, pacing
- Document what to take from each reference and what to skip

**3b. Write treatment document** covering:
- **Narrative arc:** How the video tells its story (3-act structure,
  problem-solution, mood progression, etc.)
- **Rhythm and cuts:** Average shot duration per section, where the pace
  changes, transition choices with rationale
- **Color direction:** Preset or LUT choice, reference frame for
  color-matcher, consistency strategy
- **Typography and overlays:** Which Remotion compositions to use, where
  they go, font/color/size choices
- **Motion graphics plan:** Every animated element with timestamp, duration,
  composition ID, and props
- **Music and audio:** BPM analysis (if track provided), where cuts align
  with beats/phrases, ducking strategy, fade timing
- **Shot selection:** Specific clips and timestamps chosen, with rationale
  for each ("opens with texture for tactile feel", "cuts to wide to
  establish space")

**3c. Present for approval** — The user sees the full creative direction
and can redirect before any rendering happens. This is where "the video is
wrong" gets caught early — at the concept level, not the render level.

**Output:** `CLIENTS/<Client>/00_BRIEF/CREATIVE_DIRECTION.md`

#### Phase 4: Timeline construction

**Process:**
- Load the appropriate base template from `_SYSTEM/presets/timelines/`
- Replace placeholder clips with real clips from material report
- Apply the creative direction decisions (transitions, timing, overlays)
- If music provided: run `bpm.py`, align cuts to beat/phrase boundaries
- Validate: total duration within brief range, all files exist, no gaps

**Output:** `CLIENTS/<Client>/03_EDIT/timelines/<project>_v01.timeline.json`

**Present to user:** Show the timeline in chat as a readable table
(not raw JSON) with timestamps, clip names, and what happens at each point.

#### Phase 5: Internal render

- Run `render-edit.py` with the approved timeline
- Output goes to a temp location (not review folder yet)
- This render is internal — user never sees v01 directly

#### Phase 6: Auto-review

**Technical checklist (automated):**
- [ ] Duration within +-2s of brief target
- [ ] Resolution and aspect ratio match brief
- [ ] Loudness -14 LUFS +-0.5dB (via ffmpeg loudnorm measurement)
- [ ] No unexpected silence > 1s
- [ ] No black frames between clips (sample frames at transition points)
- [ ] Audio present in every section that should have it
- [ ] Subtitles present if brief requires them

**Editorial checklist (AI self-review):**
- [ ] First clip has >= 0.5s breathing room before text/action
- [ ] Last clip holds >= 1s before fade to black
- [ ] No text overlay shorter than 1.5s or longer than 4s
- [ ] Crossfades <= 0.4s (editorial style) unless brief says otherwise
- [ ] No clip shorter than 1.5s (except intentional hook cuts)
- [ ] Color consistency across clips (visual check via contact sheet)
- [ ] Text readable (contrast against background)

**Brief alignment checklist (AI self-review):**
- [ ] Opening 3 seconds have a clear hook
- [ ] Narrative structure matches creative direction
- [ ] All motion graphics from the plan are present
- [ ] Pacing matches the style requested (editorial=slow, social=fast)
- [ ] Brand elements present where specified (logo, colors, fonts)

**Process:**
- Run technical checks automatically
- Generate contact sheet of the rendered video
- Review the contact sheet against the creative direction
- Document all findings in REVISION_NOTES.md
- If issues found: fix timeline, re-render, re-check (max 3 loops)
- If still failing after 3 loops, present to user with notes explaining
  what couldn't be auto-fixed

**Output:** `CLIENTS/<Client>/03_EDIT/REVISION_NOTES.md`

#### Phase 7: Presentation

- Copy passing render to `CLIENTS/<Client>/06_REVIEW/<naming>_v01.mp4`
- Show user the file path
- Show a summary: duration, format, what was auto-corrected
- Wait for feedback

#### Phase 8: Iteration

- Receive feedback in natural language
- Map feedback to timeline changes
- Bump version (v01 → v02)
- Re-render + re-run auto-review
- Present again

#### Phase 9: Delivery

- Copy approved version to `05_EXPORTS/master/`
- Run `export-social.sh` for all platforms in the brief
- Run QA on each export (resolution, duration within platform max, loudness)
- Generate delivery report
- Ask: "Save this timeline as a template for future projects?"
  - If yes: copy to `_SYSTEM/presets/timelines/` with descriptive name
    and metadata header (type, duration, style, client, date)

---

### 4.3 HTML briefing form

**Location:** `_SYSTEM/tools/briefing-form.html`

**Architecture:** Single static HTML file, no server needed. Opens in any
browser. Uses vanilla JS + localStorage for draft persistence.

**Fields:**
- Client name (text)
- Project name (text)
- Video type (select: SaaS Product Ad / Fashion-Lifestyle Ad / Brand Film / Other)
- Description (textarea, large)
- Aspect ratio (checkboxes: 9:16, 16:9, 1:1, 4:5)
- Duration (range slider: 15s / 30s / 60s / 90s / custom input)
- Target platforms (checkboxes: IG Reel, IG Story, IG Feed, TikTok, YouTube, YT Shorts, LinkedIn)
- Mood — 3 keywords (text)
- Reference links (dynamic list — add/remove URL fields, supports YouTube, Vimeo, Drive, any URL)
- Google Drive links (dynamic list for folders/files)
- Music (select: "I'll provide it" / "No music" / description of what I want)
- Subtitles (toggle + language select)
- Watermark (toggle: BMP / Client logo / None)
- Notes / special requests (textarea)

**Behavior:**
- Auto-saves draft to localStorage every 5s
- "Save" button exports `brief-input.json` as a download
- User places the JSON in `CLIENTS/<Client>/00_BRIEF/brief-input.json`
  or `00_INBOX/<project>/brief-input.json` — the system checks both
- Format of the JSON matches the brief.md structure for direct parsing
- If the client folder doesn't exist yet, putting it in `00_INBOX/` is fine
  — Phase 1 will create the client folder and move it

**Design:** Clean, dark theme matching BMP brand (primary #0A0A0A,
accent #C6A35D, font Inter). Responsive. No dependencies.

---

## 5. New tools to install

### 5.1 Python packages (in `_SYSTEM/.venv/`)

```bash
source _SYSTEM/.venv/bin/activate
pip install ffmpeg-quality-metrics color-matcher stable-ts demucs \
            typed-ffmpeg auto-subs
```

| Package | Version | Purpose |
|---------|---------|---------|
| `ffmpeg-quality-metrics` | latest | VMAF/SSIM/PSNR scoring per export vs master |
| `color-matcher` | 0.6+ | Auto color-match clips from different sources |
| `stable-ts` | latest | Word-level timestamps + ASS subtitle styling |
| `demucs` | 4.x | Stem separation (vocals/instruments/drums/bass) |
| `typed-ffmpeg` | 3.x | Typed Python ffmpeg filter graph builder |
| `auto-subs` | latest | Upgraded subtitle burn with ASS style presets |

### 5.2 npm packages (in `_SYSTEM/motion/bmp-motion/`)

```bash
cd _SYSTEM/motion/bmp-motion
npm install remotion-animated @remotion/transitions
```

| Package | Purpose |
|---------|---------|
| `remotion-animated` | Declarative `<Animated>` component for cleaner animation code |
| `@remotion/transitions` | Native TransitionSeries between Remotion scenes |

### 5.3 New scripts

| Script | Purpose |
|--------|---------|
| `_SYSTEM/scripts/qa-check.sh` | Automated QA: loudness, resolution, duration, silence detection, frame sampling |
| `_SYSTEM/scripts/color-match.sh` | Wrapper for color-matcher: normalize clips against a reference frame |
| `_SYSTEM/scripts/stem-split.sh` | Wrapper for demucs: split music into stems for clean mixing |
| `_SYSTEM/scripts/subtitle-pro.sh` | stable-ts + ASS format with style presets (editorial, social, luxury) |

---

## 6. Remotion compositions (15 new)

All compositions live in `_SYSTEM/motion/bmp-motion/src/compositions/`.
Each is a standalone `.tsx` file registered in `Root.tsx`.
All accept `primaryColor`, `accentColor` as base props for brand consistency.
All support both vertical (1080x1920) and horizontal (1920x1080) via
width/height props.

### 6.1 SaaS / Product Ads

| ID | Props | Duration | Description |
|----|-------|----------|-------------|
| `MetricCounter` | `{value, label, prefix, suffix, accentColor}` | 2-3s | Number counts up with spring easing. Use for KPIs, user counts, stats. |
| `FeatureCallout` | `{text, icon, position, accentColor}` | 2-3s | Line extends from anchor point, badge pops in with text. |
| `ScreenReveal` | `{screenshot, direction, maskColor}` | 3-4s | Mask slides to reveal a browser/app screenshot underneath. |
| `PricingCard` | `{plans[], highlightIndex, accentColor}` | 3-4s | Card slides in, highlighted plan pulses with glow. |
| `NotificationToast` | `{message, icon, accentColor}` | 2s | Toast notification slides from top-right, holds, fades. |
| `BeforeAfterSplit` | `{labelBefore, labelAfter, splitPosition}` | 3-4s | Vertical wipe with labels on each side. Overlay — composited on video. |
| `HookText` | `{lines[], accentColor, style}` | 2-3s | Large impact text, line by line, spring animation. For first 3 seconds. |

### 6.2 Fashion / Lifestyle

| ID | Props | Duration | Description |
|----|-------|----------|-------------|
| `TitleReveal` | `{words[], font, accentColor, stagger}` | 2-4s | Words appear one by one with clip-mask or fade-up. Serif by default. |
| `LogoSting` | `{logoSrc, accentColor, style}` | 2-3s | Logo scales from 0 with spring overshoot, optional accent line underneath. |
| `ColorWash` | `{color, opacity, blendMode}` | 1-2s | Full-frame color overlay that dissolves in/out. Overlay — composited on video. |
| `SplitDiptych` | `{dividerColor, dividerWidth, labels[]}` | 3-5s | Two panels with thin divider. Overlay that defines the layout. |

### 6.3 Brand Film

| ID | Props | Duration | Description |
|----|-------|----------|-------------|
| `CinematicTitle` | `{text, subtitle, font, accentColor}` | 3-5s | Large display type with slow opacity fade + subtle vertical drift. |
| `ChapterMarker` | `{number, title, accentColor}` | 2-3s | "01 — CHAPTER TITLE" with ruled line extending right. |
| `AtmosphericOverlay` | `{type, opacity}` | loop | Film grain, light leak, or dust particle loop at 8-12% opacity. Overlay. |
| `CreditRoll` | `{credits[], speed, font}` | variable | Slow upward scroll, thin weight font, customizable entries. |

### 6.4 Rendering compositions

All compositions render via:
```bash
_SYSTEM/scripts/remotion-render.sh <CompositionId> output.mp4 \
  --props '{"key":"value"}'
```

Compositions marked "Overlay" render with alpha channel (ProRes 4444 or
WebM VP8/VP9) and are composited onto the main video via ffmpeg overlay
filter during `render-edit.py` execution.

---

## 7. Timeline templates

### 7.1 Base templates (6)

Location: `_SYSTEM/presets/timelines/`

Each template is a `timeline.json` with:
- `"_meta"` header: type, target_duration, style, description
- Placeholder clips: `"src": "PLACEHOLDER:hero-shot"` with semantic labels
- Pre-configured transitions, text overlays, music settings
- Comments explaining each section's purpose

| File | Type | Duration | Structure |
|------|------|----------|-----------|
| `saas-product-30s.json` | SaaS Ad | 30s | Hook(3s) → Problem(5s) → Demo(14s) → Proof(5s) → CTA(3s) |
| `saas-product-60s.json` | SaaS Ad | 60s | Hook(3s) → Problem(9s) → Feature x3(28s) → Testimonial(12s) → CTA(8s) |
| `fashion-music-30s.json` | Fashion | 30s | Cold open(2s) → Brand(4s) → Editorial(18s) → Campaign line(4s) → Logo(2s) |
| `fashion-music-60s.json` | Fashion | 60s | Cold open(2s) → Brand(4s) → Editorial(24s) → Details(15s) → Line(10s) → Logo(5s) |
| `brand-film-60s.json` | Brand | 60s | Atmos(5s) → Ch1(20s) → Music(5s) → Ch2(20s) → Statement(7s) → End(3s) |
| `brand-film-90s.json` | Brand | 90s | Atmos(5s) → Ch1 title(10s) → Act1(20s) → Music(5s) → Ch2(20s) → Peak(15s) → Statement(10s) → End(5s) |

### 7.2 Template evolution

After each successful delivery (phase 9), the system asks:

> "This video turned out well. Want to save it as a template for similar
> future projects?"

If yes:
1. Strip file paths, replace with semantic placeholders
2. Preserve structure, timing, transitions, overlay positions
3. Add `_meta` with: source_client, source_project, date, tags
4. Save to `_SYSTEM/presets/timelines/<type>-<style>-<duration>.json`

Over time this builds a library of battle-tested templates.

---

## 8. Subtitle style presets

Replace the single Helvetica-on-black-box style with 3 presets rendered
via ASS format (using stable-ts for word-level timestamps):

| Preset | Font | Style | Use case |
|--------|------|-------|----------|
| `editorial` | DM Serif Display, 22pt | White text, no box, subtle drop shadow, centered bottom, margin 100px | Brand films, luxury |
| `social` | Inter Bold, 28pt | White text, black rounded box, centered, margin 80px, word-by-word highlight | Reels, TikTok, Stories |
| `luxury` | Playfair Display, 20pt | Warm white (#F2F0EB), no box, letter-spacing 2px, bottom-left, thin | Fashion, high-end |

---

## 9. Repos to study / adapt (not install, just reference)

| Repo | Why | URL |
|------|-----|-----|
| OpenMontage | Architecture reference — 49 tools, 400+ agent skills for video | github.com/calesthio/OpenMontage |
| remocn | shadcn-style Remotion components to copy | github.com/kapishdima/remocn |
| editly | JSON-driven editing reference | github.com/mifi/editly |
| remotion-animated examples | Animation pattern reference | github.com/stefanwittwer/remotion-animated |

---

## 10. What this does NOT include (explicit scope boundaries)

- **No cloud services / APIs** — everything runs locally.
- **No AI video generation** (Open-Sora, fal.ai) — out of scope for v2.
- **No TTS / AI voiceover** — out of scope for v2, user provides VO.
- **No MCP servers for ffmpeg** — the existing scripts are better integrated
  than any generic MCP. May revisit later.
- **No Premiere/DaVinci/FCP integration** — the studio stays headless.
- **No breaking changes to existing scripts** — v2 builds on top, doesn't
  replace working tools.

---

## 11. Implementation order (high level)

This is indicative — the detailed plan will be created via the writing-plans
skill after this spec is approved.

1. Install Python + npm packages
2. Build the HTML briefing form
3. Create the 6 timeline templates
4. Build the 15 Remotion compositions
5. Write the new scripts (qa-check, color-match, stem-split, subtitle-pro)
6. Extend render-edit.py to support overlay compositions and color-matching
7. Create the unified workflow skill (the flow orchestrator)
8. Create subtitle style presets
9. Test end-to-end with a real project
10. Document everything in CLAUDE.md updates
