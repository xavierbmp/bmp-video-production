# BMP Studio v2 — Design Spec

> Complete rebuild of the BMP headless video production toolkit.
> Claude Code is the editor. Everything is installed. Nothing is optional to install — only optional to activate per project.
> The system learns from every project and gets better over time.

---

## 1. Vision

A single repository that gives Claude Code the power to produce professional videos from raw footage, music, and a brief. The system contains every open-source video tool worth having — all pre-installed, all accessible through a unified timeline.json format. Claude writes the timeline, the engine renders the video.

**Core principle:** The timeline.json is the single source of truth. Claude never chains shell scripts or calls tools manually. It writes a declarative JSON, the engine does the rest.

**Quality bar:** Output must be indistinguishable from work done by a human editor at a mid-tier production agency. Not amateur, not experimental — professional.

**Learning principle:** Every project makes the system smarter. Feedback loops, approved templates, tuned style profiles, and defect patterns accumulate automatically. The first video takes the most effort; by the tenth, the system knows the client's style.

---

## 2. Architecture Overview

```
bmp-studio/
├── CLAUDE.md                      ← how Claude uses the system (written LAST)
├── install.sh                     ← installs everything (lazy model downloads)
├── bmp                            ← CLI entry point
│
├── core/                          ← Python engine (the brain)
│   ├── engine.py                  ← orchestrator: timeline.json → finished video
│   ├── timeline.py                ← schema parser + validator + defaults resolver
│   ├── registry.py                ← detects what's activated per timeline
│   │
│   ├── ffmpeg/                    ← FFmpeg operations (always available)
│   │   ├── cut.py                 ← trim, concat, split
│   │   ├── reframe.py             ← aspect ratio + face-aware crop
│   │   ├── transitions.py         ← xfade + GL transitions + easing
│   │   ├── audio.py               ← mix, ducking, normalize
│   │   ├── color.py               ← grade, match, LUT
│   │   ├── compose.py             ← merge base + transparent overlays
│   │   ├── stabilize.py           ← vidstab two-pass
│   │   ├── speed.py               ← speed change + pitch correction
│   │   └── filters.py             ← ken-burns, blur-bg, grain, deinterlace
│   │
│   ├── analysis/                  ← understanding the material
│   │   ├── probe.py               ← ffprobe wrapper
│   │   ├── thumbnail.py           ← stills + contact sheets
│   │   ├── scene_detect.py        ← PySceneDetect + TransNetV2
│   │   ├── face_detect.py         ← mediapipe (smart crop, tracking)
│   │   ├── transcribe.py          ← WhisperX (word-level + diarization)
│   │   └── ocr.py                 ← tesseract (on-screen text)
│   │
│   ├── audio/                     ← audio pipeline
│   │   ├── normalize.py           ← EBU R128 (-14 LUFS)
│   │   ├── denoise.py             ← DeepFilterNet
│   │   ├── mix.py                 ← sidechain ducking, multi-track
│   │   ├── stem_split.py          ← demucs (vocals/instrumental)
│   │   ├── enhance.py             ← ClearerVoice-Studio
│   │   └── silence.py             ← auto-editor (silence removal)
│   │
│   ├── vision/                    ← computer vision & AI enhancement
│   │   ├── upscale.py             ← video2x (Real-ESRGAN + RIFE backends)
│   │   ├── slowmo.py              ← RIFE frame interpolation
│   │   ├── depth.py               ← Depth-Anything-V2 (parallax maps)
│   │   ├── matting.py             ← RobustVideoMatting (bg removal 4K)
│   │   ├── segment.py             ← SAM2 (segment anything in video)
│   │   ├── inpaint.py             ← ProPainter (remove objects/watermarks)
│   │   ├── track.py               ← Track-Anything (click→track→segment)
│   │   ├── restore.py             ← Real-ESRGAN (image/video restoration)
│   │   ├── deface.py              ← auto face anonymization
│   │   └── color_match.py         ← color-matcher (match between clips)
│   │
│   ├── generation/                ← AI content generation
│   │   ├── music_gen.py           ← AudioCraft/MusicGen
│   │   ├── tts.py                 ← Bark TTS
│   │   ├── speech_enhance.py      ← resemble-enhance
│   │   ├── img2video.py           ← CogVideo
│   │   ├── talking_head.py        ← SadTalker
│   │   ├── lip_sync.py            ← video-retalking
│   │   └── interpolate.py         ← Google FILM
│   │
│   ├── motion_ext/                ← extra render engines (only what Remotion can't do)
│   │   ├── lottie.py              ← puppeteer-lottie (Lottie→MP4)
│   │   └── movis.py               ← Python compositing (Photoshop-level)
│   │
│   ├── qa/                        ← quality assurance (quantifiable, not interpretive)
│   │   ├── technical.py           ← loudness, resolution, black frames, silence
│   │   ├── framing.py             ← face position, headroom, safe zones (mediapipe+opencv)
│   │   ├── text.py                ← text readability, contrast ratio, size check
│   │   ├── pacing.py              ← shot durations vs style profile limits
│   │   └── checklist.py           ← brief compliance (duration, format, brand)
│   │
│   ├── project/                   ← project management
│   │   ├── client.py              ← create/manage client folders
│   │   ├── ingest.py              ← import footage with SHA256
│   │   ├── proxy.py               ← generate editing proxies
│   │   ├── naming.py              ← naming conventions
│   │   ├── export.py              ← multi-platform fan-out
│   │   └── state.py               ← project.json state tracking across sessions
│   │
│   ├── learning/                  ← THE FEEDBACK SYSTEM (new)
│   │   ├── defect_log.py          ← log every QA failure + user correction
│   │   ├── template_saver.py      ← save approved timelines as reusable templates
│   │   ├── style_tuner.py         ← update style profiles from feedback
│   │   ├── rules_engine.py        ← auto-generate QA rules from defect patterns
│   │   └── knowledge_base.py      ← searchable index of past decisions + rationale
│   │
│   └── lib/                       ← utilities
│       ├── gl_transitions/        ← GL Transitions (50+ GLSL shaders)
│       ├── xfade_easing/          ← xfade-easing (80+ CSS easings)
│       └── brand.py               ← brand profile loader
│
├── motion/                        ← Remotion overlay layer
│   ├── package.json
│   ├── remotion.config.ts
│   ├── src/
│   │   ├── Root.tsx
│   │   ├── compositions/
│   │   │   ├── titles/
│   │   │   │   ├── HookText.tsx
│   │   │   │   ├── TitleReveal.tsx
│   │   │   │   ├── CinematicTitle.tsx
│   │   │   │   └── SectionMarker.tsx
│   │   │   ├── lower-thirds/
│   │   │   │   ├── LowerThird.tsx
│   │   │   │   └── FeatureCallout.tsx
│   │   │   ├── counters/
│   │   │   │   ├── MetricCounter.tsx
│   │   │   │   └── PricingCard.tsx
│   │   │   ├── intros-outros/
│   │   │   │   ├── BrandIntro.tsx
│   │   │   │   ├── EndCard.tsx
│   │   │   │   ├── LogoSting.tsx
│   │   │   │   └── CreditRoll.tsx
│   │   │   ├── captions/
│   │   │   │   └── AnimatedCaptions.tsx  ← 17 styles via remotion-subtitles
│   │   │   ├── social/
│   │   │   │   ├── CTAOverlay.tsx
│   │   │   │   ├── NotificationToast.tsx
│   │   │   │   └── SwipeUp.tsx
│   │   │   ├── comparison/
│   │   │   │   ├── BeforeAfter.tsx
│   │   │   │   └── SplitDiptych.tsx
│   │   │   ├── effects/
│   │   │   │   ├── FilmGrain.tsx
│   │   │   │   ├── Vignette.tsx
│   │   │   │   ├── ColorWash.tsx
│   │   │   │   └── LightLeak.tsx
│   │   │   └── data/
│   │   │       ├── BarChart.tsx
│   │   │       ├── StatCard.tsx
│   │   │       └── ProgressRing.tsx
│   │   └── lib/
│   │       ├── theme.ts
│   │       ├── easing.ts
│   │       ├── layout.ts
│   │       └── transitions/
│   │           ├── glitch.ts
│   │           ├── rgbSplit.ts
│   │           ├── zoomBlur.ts
│   │           └── lightLeak.ts
│   └── render.sh
│
├── presets/
│   ├── timelines/                    ← timeline templates (grow over time)
│   │   ├── ad-talking-head-30s.json
│   │   ├── ad-talking-head-60s.json
│   │   ├── ad-product-showcase-30s.json
│   │   ├── fashion-music-30s.json
│   │   ├── fashion-music-60s.json
│   │   ├── brand-film-60s.json
│   │   ├── brand-film-90s.json
│   │   ├── reel-quick-15s.json
│   │   └── tutorial-screen-60s.json
│   ├── styles/                       ← style profiles YAML (tune over time)
│   │   ├── editorial.yaml
│   │   ├── social.yaml
│   │   ├── luxury.yaml
│   │   ├── minimal.yaml
│   │   └── energetic.yaml
│   ├── luts/
│   ├── subtitle-styles/
│   ├── gl-transitions/
│   └── export-presets.json
│
├── brands/                           ← brand profiles (one per client)
│   └── _template.json
│
├── knowledge/                        ← THE LEARNING DATABASE (new)
│   ├── defects.jsonl                 ← append-only log of every defect + fix
│   ├── rules.yaml                    ← auto-generated QA rules from defect patterns
│   ├── decisions.jsonl               ← log of creative decisions + rationale
│   └── client_preferences/           ← per-client learned preferences
│       └── {client}.yaml
│
├── assets/
│   ├── logos/  fonts/  music/  sfx/  stock/
│
├── clients/
│   └── _TEMPLATE/
│       ├── project.json
│       ├── brand.json
│       ├── brief/
│       ├── footage/
│       │   ├── raw/
│       │   ├── proxies/
│       │   └── audio/
│       ├── assets/
│       ├── edit/
│       │   ├── timelines/
│       │   └── versions/
│       ├── renders/
│       ├── exports/
│       │   ├── master/
│       │   ├── instagram-reel/
│       │   ├── instagram-story/
│       │   ├── instagram-feed/
│       │   ├── tiktok/
│       │   ├── youtube/
│       │   ├── youtube-shorts/
│       │   └── linkedin/
│       ├── review/
│       └── archive/
│
└── docs/
    ├── timeline-schema.md
    ├── tools-reference.md
    └── editorial-rules.md            ← researched from industry (written FIRST)
```

---

## 3. The Feedback & Learning System

This is the core innovation that makes BMP Studio improve over time. Every interaction feeds back into the system.

### 3.1 Defect Log (`knowledge/defects.jsonl`)

Every time something goes wrong — QA failure, user correction, rejected render — it gets logged:

```jsonc
{
  "timestamp": "2026-04-15T10:30:00Z",
  "client": "Livitum",
  "project": "SS26Launch",
  "phase": "render_v01",
  "defect_type": "framing",           // framing | audio | pacing | color | text | transition | narrative
  "description": "Subject head cropped at top of frame in clip 3",
  "cause": "reframe face-aware headroom too low (0.10)",
  "fix_applied": "increased headroom to 0.18",
  "source": "user_feedback",          // user_feedback | qa_auto | qa_visual
  "severity": "major",                // minor | major | critical
  "style": "editorial",
  "video_type": "ad",
  "rule_generated": "framing_headroom_minimum_015"
}
```

**Append-only** — never delete entries. This is the raw data the system learns from.

### 3.2 Auto-Generated Rules (`knowledge/rules.yaml`)

The `rules_engine.py` analyzes `defects.jsonl` and generates/updates rules:

```yaml
rules:
  # Auto-generated from defect: 2026-04-15 "Subject head cropped"
  # Seen 3 times across 2 projects. Promoted to rule after 2nd occurrence.
  - id: framing_headroom_minimum_015
    type: framing
    check: "face_detect.headroom >= 0.15"
    severity: major
    message: "Subject headroom too low ({value}). Minimum 0.15 for safe framing."
    created: "2026-04-15"
    occurrences: 3
    auto_fix: "increase reframe.headroom to 0.18"

  # Auto-generated from defect: 2026-04-16 "Music too loud during VO"
  - id: audio_music_duck_minimum
    type: audio
    check: "music_level_during_speech <= -18dB"
    severity: major
    message: "Music too loud during speech ({value}dB). Must be <= -18dB."
    created: "2026-04-16"
    occurrences: 5
    auto_fix: "set music.gain_db to -20"
```

**How rules are born:**
1. First occurrence → logged in `defects.jsonl`
2. Second occurrence of same pattern → promoted to candidate rule
3. Third occurrence OR user says "always do this" → promoted to active rule in `rules.yaml`
4. QA now checks against this rule automatically on every render

**Rules can also be demoted:** If a rule causes false positives (user overrides it 3+ times), it gets flagged for review.

### 3.3 Client Preferences (`knowledge/client_preferences/{client}.yaml`)

Per-client learned preferences that override style profile defaults:

```yaml
# Auto-learned from feedback on Livitum projects
client: Livitum
learned:
  - preference: "shorter cuts on b-roll (max 2.5s, not 4s)"
    source: "user feedback on SS26Launch v02"
    date: "2026-04-15"
    applies_to: "pacing.shot_duration_range for broll clips"

  - preference: "accent color #C6A35D on ALL text overlays"
    source: "user correction on SS26Launch v01"
    date: "2026-04-14"
    applies_to: "overlays.props.accentColor default"

  - preference: "no film grain on product shots"
    source: "user feedback on ProductShowcase v01"
    date: "2026-04-20"
    applies_to: "post.grain = 0 when video_type contains 'product'"
```

Claude reads this file before starting any project for this client. Preferences accumulate and override style profile defaults.

### 3.4 Decision Log (`knowledge/decisions.jsonl`)

Records WHY Claude made creative choices, so future sessions can learn from past reasoning:

```jsonc
{
  "timestamp": "2026-04-15T09:00:00Z",
  "client": "Livitum",
  "project": "SS26Launch",
  "decision": "Used 2.5s crossfade between hero shot and CTA instead of hard cut",
  "rationale": "The hero shot has slow motion which needs a soft transition to the static end card. Hard cut felt abrupt in v01.",
  "outcome": "approved",              // approved | rejected | modified
  "tags": ["transition", "pacing", "ad"]
}
```

When Claude faces a similar decision in the future, it can search this log for precedents.

### 3.5 Template Saver

When a video is approved by the user:

1. Claude asks: "Save as template for future {video_type} projects?"
2. If yes:
   - Copy timeline.json
   - Replace all file paths with semantic placeholders: `PLACEHOLDER:talking-head-hook`, `PLACEHOLDER:broll-product-01`, etc.
   - Preserve timing, transitions, overlay placement, style settings
   - Add `_meta` block with tags, description, client (anonymized)
   - Save to `presets/timelines/{type}-{description}.json`
3. Next time a similar brief comes in, Claude starts from this template instead of blank

### 3.6 Style Profile Tuning

When the user gives feedback that affects style (not a one-time fix):

- "Los cortes son demasiado largos" → update `editorial.yaml: pacing.shot_duration_range`
- "La musica siempre esta muy alta" → update `editorial.yaml: audio.music_gain_db`
- "Me gusta mas este tipo de subtitulo" → update `editorial.yaml: subtitles.style`

Claude proposes the change, user confirms, the YAML is updated. All future projects with that style inherit the improvement.

### 3.7 The Learning Loop (how it all connects)

```
USER FEEDBACK on render
  ↓
[1] Log defect in defects.jsonl (always)
  ↓
[2] Is this the 2nd+ time? → Generate/update rule in rules.yaml
  ↓
[3] Is this client-specific? → Update client_preferences/{client}.yaml
  ↓
[4] Is this a style-wide issue? → Propose style profile YAML update
  ↓
[5] Log the creative decision + rationale in decisions.jsonl
  ↓
[6] Fix the timeline, re-render
  ↓
[7] If approved → offer to save as template

NEXT PROJECT for same client:
  → Load client_preferences → Load updated rules → Load tuned styles
  → Start from best matching template
  → System is smarter than last time
```

---

## 4. Render Modes (solving the iteration bottleneck)

Three render modes to enable fast iteration:

```bash
bmp render timeline.json --preview    # FAST: 720p, no AI enhancements, no overlays
                                      # Purpose: verify cuts, pacing, audio mix
                                      # Time: ~30 seconds for a 30s video

bmp render timeline.json --draft      # MEDIUM: 1080p, with overlays, no AI enhance
                                      # Purpose: verify full composition
                                      # Time: 2-5 minutes for a 30s video

bmp render timeline.json              # FULL: final quality, all enhancements
                                      # Purpose: delivery-ready render
                                      # Time: 10-30 minutes for a 30s video
```

**Expected workflow:**
1. Claude writes timeline → `--preview` → checks cuts/pacing (30s)
2. Adjusts if needed → `--preview` again (30s)
3. Happy with structure → `--draft` → checks overlays/text/composition (3min)
4. User reviews draft → feedback → adjusts → `--draft` again (3min)
5. Approved → full render → QA → export

This means most iteration happens at 30-second cycles, not 20-minute cycles.

---

## 5. Timeline Schema v2

### 5.1 Design principle: minimal by default

A basic video should be 10-15 lines of JSON. Everything else is inherited from the style profile. Claude only specifies what differs from the default.

### 5.2 Minimal example (basic montage)

```json
{
  "meta": { "client": "Livitum", "style": "editorial" },
  "output": { "width": 1080, "height": 1920 },
  "tracks": {
    "video": [
      { "src": "clip1.mp4", "in": 1.2, "out": 4.5 },
      { "src": "clip2.mp4", "in": 0, "out": 3.0 },
      { "src": "clip3.mp4", "in": 2.0, "out": 5.5 }
    ],
    "music": { "src": "track.mp3" }
  }
}
```

**What the engine does automatically (from `editorial.yaml` defaults):**
- `reframe.mode: "face-aware"` with headroom 0.15
- `color: "editorial"` preset
- `transitions: "cut"` between all clips
- `audio.duck: true` with ratio 8
- `audio.normalize: -14 LUFS`
- `subtitles: none` (unless specified)
- `post.grain: 0.03`

### 5.3 Full example (ad with everything)

```jsonc
{
  "meta": {
    "client": "Livitum",
    "project": "SS26Launch",
    "type": "ad",
    "style": "editorial",
    "version": 1
  },

  "output": {
    "width": 1080, "height": 1920, "fps": 30,
    "duration_target": 30
  },

  "tracks": {
    "video": [
      {
        "src": "clients/Livitum/footage/raw/talking-head-01.mp4",
        "in": 1.2, "out": 4.5,
        "reframe": {
          "mode": "face-aware",
          "subject_size": 0.7,
          "headroom": 0.15
        },
        "color": "editorial",
        "speed": 1.0,
        "audio": true
      },
      {
        "src": "clients/Livitum/footage/raw/broll-product.mp4",
        "in": 0, "out": 3.0,
        "reframe": { "mode": "center" },
        "audio": false,
        "enhance": {
          "upscale": true,
          "slowmo": 2.0,
          "stabilize": true
        }
      }
    ],

    "transitions": [
      { "type": "cut" },
      { "type": "crossfade", "duration": 0.25 },
      { "type": "gl", "name": "directionalwipe", "duration": 0.4, "easing": "easeOutCubic" }
    ],

    "music": {
      "src": "clients/Livitum/assets/track.mp3",
      "gain_db": -18,
      "duck": { "against": "video", "ratio": 8, "attack_ms": 5, "release_ms": 300 },
      "fade_in": 0.5,
      "fade_out": 1.5,
      "beat_sync": false
    },

    "audio_extra": [
      {
        "src": "clients/Livitum/assets/vo-maria.wav",
        "start": 0.5,
        "gain_db": 0,
        "denoise": true
      }
    ]
  },

  "overlays": [
    {
      "composition": "HookText",
      "start": 0.0, "duration": 2.5,
      "props": { "lines": ["Tu negocio", "merece más"], "style": "bold", "accentColor": "#C6A35D" }
    },
    {
      "composition": "LowerThird",
      "start": 3.0, "duration": 3.0,
      "props": { "name": "María López", "role": "CEO, Livitum" }
    },
    {
      "composition": "EndCard",
      "start": 27.0, "duration": 3.0,
      "props": { "brand": "LIVITUM", "cta": "Reserva tu demo", "url": "livitum.com" }
    }
  ],

  "subtitles": {
    "mode": "auto",
    "lang": "es",
    "style": "social",
    "burn": true
  },

  "post": {
    "loudness_lufs": -14,
    "grain": 0.03,
    "watermark": null
  }
}
```

---

## 6. Engine Render Flow

```
 1. PARSE       Read timeline.json, validate schema, resolve paths
                Load style profile defaults, merge with explicit values
                Load client preferences from knowledge/client_preferences/
                Load active QA rules from knowledge/rules.yaml

 2. ANALYZE     Probe every source file (dimensions, duration, codec, audio)

 3. FACES       Run face detection on clips with reframe.mode=face-aware

 4. PREPARE     Per-clip enhancements (only those activated in timeline):
                - denoise audio (DeepFilterNet)
                - upscale (video2x) — lazy model download on first use
                - slowmo (RIFE) — lazy model download on first use
                - stabilize (vidstab)
                - matting (RobustVideoMatting) — lazy model download
                - depth map (Depth-Anything) — lazy model download

 5. CUT         Trim each clip to in/out points

 6. REFRAME     Apply reframe (face-aware, center, rule-of-thirds, custom)

 7. COLOR       Apply color grade/match/LUT per clip, then consistency pass

 8. ASSEMBLE    Concatenate clips with transitions (cut/crossfade/GL)

 9. AUDIO       Mix all audio tracks:
                - Clip audio (kept or muted per clip)
                - Music with sidechain ducking
                - Extra audio tracks (VO, SFX) at specified offsets
                - Beat-sync alignment if music.beat_sync=true

10. OVERLAYS    Render each Remotion overlay → transparent clip → composite

11. SUBTITLES   Generate (WhisperX) or load, burn if requested

12. POST        Apply grain, watermark, final loudness normalization

13. QA          Automated checks against:
                - Technical rules (loudness, resolution, black frames, silence)
                - Framing rules (face position, headroom, safe zones) — QUANTIFIED
                - Text rules (readability, contrast, size) — QUANTIFIED
                - Pacing rules (shot durations vs style profile)
                - Learned rules from knowledge/rules.yaml
                - Brief compliance (duration, format, brand)

14. OUTPUT      Write to correct folder with naming convention.
                Log all QA results + decisions to knowledge/ for learning.
```

**Render modes skip steps:**
- `--preview`: Steps 1-2, 5-6, 8-9, skip 3-4 (no AI), 10-11 (no overlays/subs), simplified 12-13
- `--draft`: Steps 1-3, 5-12, skip 4 (no AI enhance), full 13
- Full: All steps

**Error handling:** If QA fails, engine outputs `REVISION_NOTES.md` with specific failures + suggested fixes. Logs the defect. Claude adjusts timeline, re-renders. Max 3 auto-loops.

---

## 7. Integrated Tools — Complete Inventory

Everything is installed by `install.sh`. AI model weights use lazy download (first use).

### Always active (no activation needed)

| Tool | Purpose |
|------|---------|
| FFmpeg 7+ | All encoding, cutting, filtering |
| mediapipe | Face detection for smart crop |
| vidstab | Video stabilization |
| rubberband | Pitch-correct speed changes |
| PySceneDetect | Scene boundary detection |
| librosa | BPM + beat analysis |
| tesseract | OCR |
| sox | Audio analysis |
| color-matcher | Match colors between clips |
| ffmpeg-quality-metrics | VMAF/SSIM/PSNR |

### Activated per-timeline (always installed, used when specified)

| Tool | Activated by | Lazy model |
|------|-------------|------------|
| WhisperX | `subtitles.mode: "auto"` | No (small) |
| DeepFilterNet | `audio_extra[].denoise: true` | No (small) |
| demucs | `bmp stem-split` | No (medium) |
| auto-editor | `bmp auto-cut` | No |
| TransNetV2 | Scene detect (preferred over PySceneDetect) | Yes (~50MB) |
| xfade-easing | `transitions[].easing` | No |
| GL Transitions | `transitions[].type: "gl"` | No |
| ClearerVoice-Studio | `enhance.speech_enhance` | Yes (~200MB) |
| video2x / Real-ESRGAN | `enhance.upscale` | Yes (~100MB) |
| RIFE | `enhance.slowmo` | Yes (~100MB) |
| Depth-Anything-V2 | `enhance.depth_parallax` | Yes (~400MB) |
| RobustVideoMatting | `enhance.matting` | Yes (~150MB) |
| SAM2 | `enhance.segment` | Yes (~2GB) |
| ProPainter | `enhance.inpaint` | Yes (~400MB) |
| Track-Anything | `enhance.track` | Yes (~2GB) |
| deface | `enhance.deface` | Yes (~50MB) |
| AudioCraft/MusicGen | `music.generate` | Yes (~3GB) |
| Bark | `audio_extra[].generate: "tts"` | Yes (~5GB) |
| resemble-enhance | `enhance.speech_enhance` | Yes (~200MB) |
| CogVideo | `video[].generate` | Yes (~10GB) |
| SadTalker | `video[].generate: {type: "talking_head"}` | Yes (~1GB) |
| video-retalking | `enhance.lip_sync` | Yes (~500MB) |
| Google FILM | Alt slow-mo backend | Yes (~200MB) |
| Remotion + remotion-subtitles | `overlays[]` / `subtitles.style: "remotion:*"` | No |
| puppeteer-lottie | `overlays[].type: "lottie"` | No |
| movis | Available as Python API | No |

---

## 8. Style Profiles

YAML files in `presets/styles/`. Claude sets `meta.style` and all defaults cascade. These profiles are TUNED OVER TIME via the learning system.

Example `editorial.yaml`:
```yaml
name: editorial
description: Clean, confident, luxury-adjacent. Long cuts, minimal transitions.

pacing:
  shot_duration_range: [2.0, 4.0]
  first_shot_min: 1.5
  last_shot_hold: 1.0
  transition_default: cut
  crossfade_max: 0.25

reframe:
  mode: face-aware
  headroom: 0.15
  subject_size: 0.7

color:
  preset: editorial
  grain: 0.03
  black_lift: 0.02

typography:
  heading_font: "DM Serif Display"
  body_font: "Inter"
  min_heading_size: 36
  min_body_size: 24
  max_words_per_overlay: 6
  text_color: "#FFFFFF"
  shadow: "0 2px 12px rgba(0,0,0,0.6)"

audio:
  music_gain_db: -18
  duck_ratio: 8
  duck_attack_ms: 5
  duck_release_ms: 300
  target_lufs: -14

transitions:
  allowed: [cut, crossfade]
  forbidden: [slide, wipe, zoom, spin]

subtitles:
  style: editorial
  font: "DM Serif Display"
  size: 20
  position: bottom
  margin_bottom: 80
```

---

## 9. Brand Profiles

JSON files in `brands/`. Created once per client, reused forever.

```json
{
  "name": "Livitum",
  "colors": {
    "primary": "#0A0A0A",
    "accent": "#C6A35D",
    "background": "#FFFFFF",
    "text": "#1A1A1A"
  },
  "fonts": {
    "heading": "DM Serif Display",
    "body": "Inter"
  },
  "logo": "brands/livitum/logo.png",
  "logo_dark": "brands/livitum/logo-dark.png",
  "watermark": "brands/livitum/watermark.png",
  "tagline": "Tu negocio merece mas",
  "website": "livitum.com",
  "social": { "instagram": "@livitum", "linkedin": "livitum" },
  "voice": { "tone": "professional, warm, confident", "language": "es" }
}
```

The user provides these 4 things once: colors, font, logo, tone. Claude fills in the rest from the client's website/brief. No web scraping rabbit holes.

---

## 10. Project State Tracking

```json
{
  "client": "Livitum",
  "project": "SS26Launch",
  "created": "2026-04-10T14:30:00Z",
  "phase": "editing",
  "phases_completed": ["briefing", "analysis", "creative_direction"],
  "timeline_version": 3,
  "renders": [
    {"version": 1, "path": "renders/v01.mp4", "qa_passed": false, "notes": "loudness -16.2", "defects_logged": 2},
    {"version": 2, "path": "renders/v02.mp4", "qa_passed": true, "defects_logged": 0}
  ],
  "exports": [],
  "feedback_count": 3,
  "templates_saved": 0
}
```

---

## 11. CLI Interface

```bash
# Project management
bmp new "ClientName"               # scaffold client folder + brand template
bmp ingest /path/to/media Client   # import footage with SHA256 manifest
bmp proxy Client                   # generate editing proxies
bmp status Client                  # show project state
bmp brand Client                   # show/edit brand profile

# Analysis
bmp probe file.mp4                 # inspect file metadata
bmp thumbnail file.mp4             # stills / contact sheet
bmp scene-detect file.mp4          # auto-detect scenes
bmp transcribe file.mp4 --lang es  # WhisperX transcription
bmp bpm music.mp3                  # BPM + beat timestamps
bmp stem-split music.mp3           # separate vocals/instrumental
bmp auto-cut file.mp4              # remove silences
bmp ocr file.mp4                   # extract on-screen text

# Render
bmp render timeline.json --preview # fast preview (720p, 30s)
bmp render timeline.json --draft   # draft with overlays (3min)
bmp render timeline.json           # full quality render
bmp qa render.mp4                  # run QA checks

# Export
bmp export master.mp4 Client all            # all platforms
bmp export master.mp4 Client instagram-reel # single platform

# Learning system
bmp tools                          # list all tools + status
bmp defects                        # show recent defects
bmp rules                          # show active QA rules
bmp templates                      # list saved templates
bmp learn "description of issue"   # manually log a defect/learning
```

---

## 12. Installation

```bash
#!/bin/bash
# install.sh — installs everything, lazy model downloads for heavy AI

# 1. System deps (brew)
brew install ffmpeg jq mediainfo imagemagick tesseract sox rubberband pipx
brew install --cask font-playfair-display font-inter font-libre-baskerville font-dm-serif-display

# 2. Python venv + packages (no model downloads yet)
python3 -m venv .venv
source .venv/bin/activate
pip install \
  pyyaml pydantic jsonschema python-dotenv \
  "scenedetect[opencv]" librosa numpy Pillow soundfile \
  whisperx deepfilternet demucs spleeter \
  opencv-python-headless mediapipe \
  "rembg[cpu]" onnxruntime \
  ffmpeg-quality-metrics color-matcher auto-editor \
  moviepy movis

# 3. Node.js / Remotion
cd motion && npm install && cd ..

# 4. GL Transitions + xfade-easing
# (cloned/copied into core/lib/)

# 5. Create knowledge/ directory
mkdir -p knowledge/client_preferences
echo "[]" > knowledge/defects.jsonl
echo "rules: []" > knowledge/rules.yaml
echo "[]" > knowledge/decisions.jsonl

# 6. Verify
bmp tools
```

**Heavy AI models (SAM2, CogVideo, SadTalker, MusicGen, Bark, etc.) download on first use.** This keeps install fast (~8 GB) while having everything "installed" and ready.

---

## 13. Naming & Folder Rules

**Naming:** `{Client}_{Project}_{Format}_v{NN}.mp4`
Format tokens: `Master`, `IGReel`, `IGStory`, `IGFeed`, `TikTok`, `YT16x9`, `YTShort`, `LinkedIn`.

**Folder rules:**
1. `footage/raw/` — sacred, never modify
2. `proxies/` — disposable, re-generate anytime
3. `renders/` — intermediate, throwaway
4. `exports/<platform>/` — finals, always keep `exports/master/`
5. `review/` — versions sent to client, named `vNN`
6. `archive/` — closed projects

---

## 14. What Is Written FIRST (before any code)

1. **Editorial rules** (`docs/editorial-rules.md`) — Researched from industry standards, OpenMontage skills, FireRed-OpenStoryline patterns. Covers framing, pacing, audio, color, text, transitions. These become the QA validation criteria.

2. **Style profiles** (`presets/styles/*.yaml`) — Derived from the editorial rules. Each profile is a complete set of defaults that produces professional output without any manual tuning.

3. **Timeline schema** (`docs/timeline-schema.md`) — Full JSON schema with every field documented, defaults explained, examples for each video type.

These three documents ARE the system. The code implements them.

---

## 15. What Is NOT In This Spec

- **Specific editorial rules** — will be researched from industry sources during implementation
- **Remotion composition code** — each .tsx designed during implementation
- **Timeline template contents** — built from studying reference ads
- **Model weights and versions** — pinned during implementation
- **The CLAUDE.md** — written last, after everything works

---

## 16. Design Decisions Log

| Decision | Chosen | Why |
|----------|--------|-----|
| Build from scratch | Yes | No existing repo matches our use case |
| Render engine | FFmpeg + Remotion hybrid | Fast montage + unlimited motion graphics |
| Timeline format | JSON | Declarative, versionable, diffable |
| Everything pre-installed | Yes, with lazy model downloads | Zero friction, fast install |
| Style system | YAML profiles that tune over time | Readable, learnable, improvable |
| Feedback system | Defect log → auto rules → client prefs → style tuning | System gets smarter with every project |
| Render modes | preview/draft/full | Fast iteration (30s cycles, not 20min) |
| QA approach | Quantifiable checks (not interpretive) | Claude can verify objectively |
| motion_ext scope | Only puppeteer-lottie + movis | Remotion covers 99%, avoid bloat |
| Research approach | Brand profile once, no web scraping | Avoids rabbit holes |
| Editorial rules | Research first, code second | Rules ARE the system |
| Model downloads | Lazy (first use) | Fast install, no wasted space |
