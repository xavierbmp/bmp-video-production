# Block 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the bmp-studio repository from scratch with working CLI, timeline schema validation, style profiles, brand profiles, and project management. After this block, `bmp new Client`, `bmp probe file.mp4`, and `bmp render timeline.json --preview` (stub) all work.

**Architecture:** Python package (`core/`) with Click CLI (`bmp`). Pydantic models for timeline schema validation. YAML style profiles loaded at parse time. JSON brand profiles. Git-initialized repo with proper .gitignore.

**Tech Stack:** Python 3.11+, Click (CLI), Pydantic v2 (schema validation), PyYAML, pytest

**Spec:** `docs/superpowers/specs/2026-04-10-bmp-studio-v2-design.md`

---

## File Structure

```
bmp-studio/
├── bmp                           ← CLI entry point (executable bash shim)
├── pyproject.toml                ← Python project config
├── install.sh                    ← placeholder installer
├── .gitignore
├── .python-version               ← 3.11
│
├── core/
│   ├── __init__.py
│   ├── cli.py                    ← Click CLI commands
│   ├── timeline.py               ← Pydantic models for timeline.json
│   ├── defaults.py               ← merge style profile defaults into timeline
│   ├── registry.py               ← detect activated features in a timeline
│   ├── engine.py                 ← render orchestrator (stub in this block)
│   │
│   ├── project/
│   │   ├── __init__.py
│   │   ├── client.py             ← create/manage client folders
│   │   ├── ingest.py             ← import footage with SHA256
│   │   ├── naming.py             ← naming conventions
│   │   └── state.py              ← project.json read/write
│   │
│   ├── analysis/
│   │   ├── __init__.py
│   │   └── probe.py              ← ffprobe wrapper
│   │
│   ├── learning/
│   │   ├── __init__.py
│   │   ├── defect_log.py         ← log defects to JSONL
│   │   └── knowledge_base.py     ← read/search knowledge files
│   │
│   └── lib/
│       ├── __init__.py
│       ├── brand.py              ← brand profile loader
│       └── style.py              ← style profile loader
│
├── presets/
│   ├── styles/
│   │   ├── editorial.yaml
│   │   ├── social.yaml
│   │   └── luxury.yaml
│   ├── timelines/                ← empty dir (templates added later)
│   └── export-presets.json
│
├── brands/
│   └── _template.json
│
├── knowledge/
│   ├── defects.jsonl
│   ├── rules.yaml
│   ├── decisions.jsonl
│   └── client_preferences/
│
├── assets/
│   ├── logos/   fonts/   music/   sfx/   stock/
│
├── clients/
│   └── _TEMPLATE/
│       ├── project.json
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
└── tests/
    ├── __init__.py
    ├── conftest.py               ← shared fixtures (tmp dirs, sample files)
    ├── test_timeline.py          ← schema validation tests
    ├── test_defaults.py          ← style profile merge tests
    ├── test_client.py            ← project scaffolding tests
    ├── test_ingest.py            ← footage import tests
    ├── test_naming.py            ← naming convention tests
    ├── test_state.py             ← project state tests
    ├── test_brand.py             ← brand profile tests
    ├── test_style.py             ← style profile tests
    ├── test_probe.py             ← ffprobe wrapper tests
    ├── test_defect_log.py        ← defect logging tests
    ├── test_registry.py          ← feature detection tests
    └── test_cli.py               ← CLI integration tests
```

---

### Task 1: Repository scaffold + pyproject.toml

**Files:**
- Create: `pyproject.toml`
- Create: `.gitignore`
- Create: `.python-version`
- Create: `bmp` (executable shim)
- Create: `core/__init__.py`

- [ ] **Step 1: Initialize git repo and create pyproject.toml**

```bash
cd "/Users/xaviermotjellinas/Documents/00_BMP"
mkdir bmp-studio && cd bmp-studio
git init
```

```toml
# pyproject.toml
[project]
name = "bmp-studio"
version = "0.1.0"
description = "Headless video production toolkit for Claude Code"
requires-python = ">=3.11"
dependencies = [
    "click>=8.1",
    "pydantic>=2.0",
    "pyyaml>=6.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-tmp-files>=0.0.2",
]

[project.scripts]
bmp = "core.cli:main"

[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.backends._legacy:_Backend"

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Create .gitignore**

```gitignore
# .gitignore
__pycache__/
*.pyc
.venv/
*.egg-info/
dist/
build/
.pytest_cache/
.mypy_cache/

# Large AI model weights (lazy downloaded)
*.pt
*.pth
*.onnx
*.bin
!brands/**
!presets/**

# Client footage (large files)
clients/*/footage/raw/*
clients/*/footage/proxies/*
clients/*/renders/*
clients/*/exports/*
!clients/_TEMPLATE/**

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Create .python-version and core/__init__.py**

```
# .python-version
3.11
```

```python
# core/__init__.py
"""BMP Studio — headless video production toolkit."""
```

- [ ] **Step 4: Create executable bmp shim**

```bash
#!/usr/bin/env bash
# bmp — CLI entry point
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec python3 -m core.cli "$@"
```

```bash
chmod +x bmp
```

- [ ] **Step 5: Create venv and install deps**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

- [ ] **Step 6: Verify**

```bash
python -c "import core; print('ok')"
```

Expected: `ok`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold bmp-studio repo with pyproject.toml"
```

---

### Task 2: Directory structure — all folders

**Files:**
- Create: all empty directories and placeholder files per spec

- [ ] **Step 1: Create all directories**

```bash
# Presets
mkdir -p presets/{styles,timelines,luts,subtitle-styles,gl-transitions}

# Brands
mkdir -p brands

# Knowledge
mkdir -p knowledge/client_preferences

# Assets
mkdir -p assets/{logos,fonts,music,sfx,stock}

# Client template
mkdir -p clients/_TEMPLATE/{brief,footage/{raw,proxies,audio},assets,edit/{timelines,versions},renders,exports/{master,instagram-reel,instagram-story,instagram-feed,tiktok,youtube,youtube-shorts,linkedin},review,archive}

# Core subpackages
mkdir -p core/{project,analysis,audio,vision,generation,motion_ext,qa,learning,lib,ffmpeg}

# Tests
mkdir -p tests

# Docs
mkdir -p docs
```

- [ ] **Step 2: Create __init__.py for all packages**

```bash
for dir in core/project core/analysis core/audio core/vision core/generation core/motion_ext core/qa core/learning core/lib core/ffmpeg tests; do
  touch "$dir/__init__.py"
done
```

- [ ] **Step 3: Create knowledge seed files**

```bash
# knowledge/defects.jsonl — empty file (JSONL, one JSON object per line)
touch knowledge/defects.jsonl

# knowledge/decisions.jsonl — empty file
touch knowledge/decisions.jsonl
```

```yaml
# knowledge/rules.yaml
rules: []
```

- [ ] **Step 4: Create .gitkeep for empty dirs**

```bash
for dir in presets/timelines presets/luts presets/subtitle-styles presets/gl-transitions assets/logos assets/fonts assets/music assets/sfx assets/stock knowledge/client_preferences; do
  touch "$dir/.gitkeep"
done
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: create full directory structure per spec"
```

---

### Task 3: Timeline schema — Pydantic models

**Files:**
- Create: `core/timeline.py`
- Create: `tests/test_timeline.py`

- [ ] **Step 1: Write failing tests for timeline schema**

```python
# tests/test_timeline.py
import pytest
from core.timeline import Timeline, ValidationError


class TestTimelineMinimal:
    """A minimal timeline with just clips and output should be valid."""

    def test_minimal_valid(self):
        data = {
            "meta": {"client": "TestClient", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {"src": "clip1.mp4", "in": 0, "out": 3.0}
                ]
            }
        }
        t = Timeline.model_validate(data)
        assert t.meta.client == "TestClient"
        assert t.meta.style == "editorial"
        assert t.output.width == 1080
        assert t.output.height == 1920
        assert t.output.fps == 30  # default
        assert len(t.tracks.video) == 1
        assert t.tracks.video[0].src == "clip1.mp4"

    def test_missing_video_tracks_fails(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {}
        }
        with pytest.raises(ValidationError):
            Timeline.model_validate(data)

    def test_missing_output_fails(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "tracks": {"video": [{"src": "a.mp4", "in": 0, "out": 1}]}
        }
        with pytest.raises(ValidationError):
            Timeline.model_validate(data)


class TestClipSchema:
    """Clip validation rules."""

    def test_clip_defaults(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {"src": "clip.mp4", "in": 0, "out": 5}
                ]
            }
        }
        t = Timeline.model_validate(data)
        clip = t.tracks.video[0]
        assert clip.speed == 1.0
        assert clip.audio is True
        assert clip.reframe is None
        assert clip.enhance is None
        assert clip.color is None

    def test_clip_with_enhance(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {
                        "src": "clip.mp4", "in": 0, "out": 5,
                        "enhance": {"upscale": True, "slowmo": 2.0}
                    }
                ]
            }
        }
        t = Timeline.model_validate(data)
        assert t.tracks.video[0].enhance.upscale is True
        assert t.tracks.video[0].enhance.slowmo == 2.0

    def test_clip_with_reframe(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {
                        "src": "clip.mp4", "in": 0, "out": 5,
                        "reframe": {"mode": "face-aware", "headroom": 0.15}
                    }
                ]
            }
        }
        t = Timeline.model_validate(data)
        assert t.tracks.video[0].reframe.mode == "face-aware"
        assert t.tracks.video[0].reframe.headroom == 0.15

    def test_in_must_be_less_than_out(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {"src": "clip.mp4", "in": 5.0, "out": 2.0}
                ]
            }
        }
        with pytest.raises(ValidationError):
            Timeline.model_validate(data)


class TestTransitionSchema:

    def test_cut_transition(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {"src": "a.mp4", "in": 0, "out": 3},
                    {"src": "b.mp4", "in": 0, "out": 3}
                ],
                "transitions": [{"type": "cut"}]
            }
        }
        t = Timeline.model_validate(data)
        assert t.tracks.transitions[0].type == "cut"

    def test_gl_transition(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {"src": "a.mp4", "in": 0, "out": 3},
                    {"src": "b.mp4", "in": 0, "out": 3}
                ],
                "transitions": [
                    {"type": "gl", "name": "directionalwipe", "duration": 0.4}
                ]
            }
        }
        t = Timeline.model_validate(data)
        assert t.tracks.transitions[0].type == "gl"
        assert t.tracks.transitions[0].name == "directionalwipe"


class TestMusicSchema:

    def test_music_with_duck(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "a.mp4", "in": 0, "out": 3}],
                "music": {
                    "src": "track.mp3",
                    "gain_db": -18,
                    "duck": {"against": "video", "ratio": 8}
                }
            }
        }
        t = Timeline.model_validate(data)
        assert t.tracks.music.gain_db == -18
        assert t.tracks.music.duck.ratio == 8


class TestOverlaySchema:

    def test_overlay(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "a.mp4", "in": 0, "out": 10}]
            },
            "overlays": [
                {
                    "composition": "HookText",
                    "start": 0.0,
                    "duration": 2.5,
                    "props": {"lines": ["Hello", "World"]}
                }
            ]
        }
        t = Timeline.model_validate(data)
        assert t.overlays[0].composition == "HookText"
        assert t.overlays[0].start == 0.0


class TestSubtitleSchema:

    def test_auto_subtitles(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "a.mp4", "in": 0, "out": 10}]
            },
            "subtitles": {"mode": "auto", "lang": "es", "style": "social", "burn": True}
        }
        t = Timeline.model_validate(data)
        assert t.subtitles.mode == "auto"
        assert t.subtitles.lang == "es"


class TestPostSchema:

    def test_post_defaults(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "a.mp4", "in": 0, "out": 3}]
            }
        }
        t = Timeline.model_validate(data)
        assert t.post.loudness_lufs == -14  # default
        assert t.post.grain == 0.0  # default (style profile overrides this)
        assert t.post.watermark is None


class TestTimelineSerialization:

    def test_roundtrip_json(self, tmp_path):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}],
                "music": {"src": "track.mp3"}
            }
        }
        t = Timeline.model_validate(data)
        json_path = tmp_path / "timeline.json"
        json_path.write_text(t.model_dump_json(indent=2))
        t2 = Timeline.model_validate_json(json_path.read_text())
        assert t2.meta.client == "X"
        assert len(t2.tracks.video) == 1
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/xaviermotjellinas/Documents/00_BMP/bmp-studio
source .venv/bin/activate
pytest tests/test_timeline.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'core.timeline'`

- [ ] **Step 3: Implement timeline.py with Pydantic models**

```python
# core/timeline.py
"""Timeline schema v2 — Pydantic models for timeline.json validation."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ValidationError, model_validator


# Re-export for test imports
__all__ = ["Timeline", "ValidationError"]


# --- Sub-models ---

class Meta(BaseModel):
    client: str
    project: str | None = None
    type: Literal["ad", "fashion", "brand-film", "music-video", "reel"] | None = None
    style: str = "editorial"
    version: int = 1


class Output(BaseModel):
    width: int
    height: int
    fps: int = 30
    duration_target: float | None = None


class Reframe(BaseModel):
    mode: Literal["face-aware", "center", "rule-of-thirds", "custom"] = "center"
    subject_size: float = 0.7
    headroom: float = 0.15


class Enhance(BaseModel):
    upscale: bool = False
    slowmo: float | None = None
    stabilize: bool = False
    matting: bool = False
    depth_parallax: bool = False
    denoise_video: bool = False
    restore: bool = False
    deface: bool = False
    segment: dict[str, Any] | None = None
    inpaint: dict[str, Any] | None = None
    track: dict[str, Any] | None = None
    lip_sync: dict[str, Any] | None = None
    speech_enhance: bool = False


class Generate(BaseModel):
    type: str | None = None
    prompt: str | None = None
    image: str | None = None
    audio: str | None = None


class Clip(BaseModel):
    src: str | None = None
    in_: float | None = None
    out: float | None = None
    reframe: Reframe | None = None
    color: str | None = None
    speed: float = 1.0
    audio: bool = True
    enhance: Enhance | None = None
    generate: Generate | None = None

    class Config:
        populate_by_name = True

    @model_validator(mode="before")
    @classmethod
    def rename_in_field(cls, data: Any) -> Any:
        """Allow 'in' as a key (reserved word in Python) by mapping to 'in_'."""
        if isinstance(data, dict) and "in" in data:
            data["in_"] = data.pop("in")
        return data

    @model_validator(mode="after")
    def check_in_less_than_out(self) -> Clip:
        if self.in_ is not None and self.out is not None:
            if self.in_ >= self.out:
                raise ValueError(f"'in' ({self.in_}) must be less than 'out' ({self.out})")
        return self


class Duck(BaseModel):
    against: str = "video"
    ratio: float = 8
    attack_ms: float = 5
    release_ms: float = 300


class Music(BaseModel):
    src: str | None = None
    generate: str | None = None
    gain_db: float = -18
    duck: Duck | None = None
    fade_in: float = 0.5
    fade_out: float = 1.5
    beat_sync: bool = False


class AudioExtra(BaseModel):
    src: str | None = None
    generate: str | None = None
    start: float = 0.0
    gain_db: float = 0
    denoise: bool = False


class Transition(BaseModel):
    type: Literal["cut", "crossfade", "gl"] = "cut"
    duration: float | None = None
    name: str | None = None
    easing: str | None = None
    params: dict[str, Any] | None = None


class Tracks(BaseModel):
    video: list[Clip]
    transitions: list[Transition] | None = None
    music: Music | None = None
    audio_extra: list[AudioExtra] | None = None

    @model_validator(mode="after")
    def video_must_not_be_empty(self) -> Tracks:
        if not self.video:
            raise ValueError("tracks.video must contain at least one clip")
        return self


class Overlay(BaseModel):
    composition: str
    start: float
    duration: float
    props: dict[str, Any] = {}
    type: Literal["remotion", "lottie", "html5", "gsap"] = "remotion"


class Subtitles(BaseModel):
    mode: Literal["auto", "file", "none"] = "none"
    lang: str = "es"
    style: str = "editorial"
    burn: bool = True
    file: str | None = None


class Post(BaseModel):
    loudness_lufs: float = -14
    grain: float = 0.0
    watermark: str | None = None


# --- Main model ---

class Timeline(BaseModel):
    meta: Meta
    output: Output
    tracks: Tracks
    overlays: list[Overlay] | None = None
    subtitles: Subtitles | None = None
    post: Post = Post()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_timeline.py -v
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add core/timeline.py tests/test_timeline.py
git commit -m "feat: timeline schema v2 with Pydantic models"
```

---

### Task 4: Style profile loader

**Files:**
- Create: `core/lib/style.py`
- Create: `presets/styles/editorial.yaml`
- Create: `presets/styles/social.yaml`
- Create: `presets/styles/luxury.yaml`
- Create: `tests/test_style.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_style.py
import pytest
from core.lib.style import load_style, StyleProfile, StyleNotFoundError


class TestLoadStyle:

    def test_load_editorial(self):
        style = load_style("editorial")
        assert style.name == "editorial"
        assert style.pacing.shot_duration_range == [2.0, 4.0]
        assert style.audio.target_lufs == -14
        assert style.reframe.mode == "face-aware"

    def test_load_social(self):
        style = load_style("social")
        assert style.name == "social"
        assert style.pacing.shot_duration_range[1] <= 3.0  # faster cuts

    def test_load_luxury(self):
        style = load_style("luxury")
        assert style.name == "luxury"

    def test_unknown_style_raises(self):
        with pytest.raises(StyleNotFoundError):
            load_style("nonexistent_style")


class TestStyleProfile:

    def test_has_all_sections(self):
        style = load_style("editorial")
        assert style.pacing is not None
        assert style.reframe is not None
        assert style.color is not None
        assert style.typography is not None
        assert style.audio is not None
        assert style.transitions is not None
        assert style.subtitles is not None
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_style.py -v
```

Expected: FAIL

- [ ] **Step 3: Create editorial.yaml**

```yaml
# presets/styles/editorial.yaml
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

- [ ] **Step 4: Create social.yaml**

```yaml
# presets/styles/social.yaml
name: social
description: Fast-paced, attention-grabbing. Short cuts, bold text, high energy.

pacing:
  shot_duration_range: [1.0, 2.5]
  first_shot_min: 1.0
  last_shot_hold: 0.5
  transition_default: cut
  crossfade_max: 0.2

reframe:
  mode: face-aware
  headroom: 0.12
  subject_size: 0.75

color:
  preset: social
  grain: 0.0
  black_lift: 0.0

typography:
  heading_font: "Inter"
  body_font: "Inter"
  min_heading_size: 42
  min_body_size: 28
  max_words_per_overlay: 4
  text_color: "#FFFFFF"
  shadow: "0 2px 8px rgba(0,0,0,0.8)"

audio:
  music_gain_db: -16
  duck_ratio: 6
  duck_attack_ms: 3
  duck_release_ms: 200
  target_lufs: -14

transitions:
  allowed: [cut, crossfade, gl]
  forbidden: [slide, wipe, spin]

subtitles:
  style: social
  font: "Inter"
  size: 24
  position: center
  margin_bottom: 100
```

- [ ] **Step 5: Create luxury.yaml**

```yaml
# presets/styles/luxury.yaml
name: luxury
description: Slow, cinematic, aspirational. Minimal text, rich color, breathing room.

pacing:
  shot_duration_range: [3.0, 6.0]
  first_shot_min: 2.0
  last_shot_hold: 1.5
  transition_default: crossfade
  crossfade_max: 0.4

reframe:
  mode: face-aware
  headroom: 0.18
  subject_size: 0.65

color:
  preset: luxury
  grain: 0.04
  black_lift: 0.03

typography:
  heading_font: "Playfair Display"
  body_font: "Inter"
  min_heading_size: 32
  min_body_size: 20
  max_words_per_overlay: 5
  text_color: "#F5F0E8"
  shadow: "0 3px 16px rgba(0,0,0,0.5)"

audio:
  music_gain_db: -20
  duck_ratio: 10
  duck_attack_ms: 8
  duck_release_ms: 400
  target_lufs: -16

transitions:
  allowed: [cut, crossfade]
  forbidden: [slide, wipe, zoom, spin, gl]

subtitles:
  style: luxury
  font: "Playfair Display"
  size: 18
  position: bottom
  margin_bottom: 90
```

- [ ] **Step 6: Implement style.py**

```python
# core/lib/style.py
"""Load and validate style profiles from YAML files."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel


PRESETS_DIR = Path(__file__).resolve().parent.parent.parent / "presets" / "styles"


class StyleNotFoundError(Exception):
    pass


class PacingProfile(BaseModel):
    shot_duration_range: list[float] = [2.0, 4.0]
    first_shot_min: float = 1.5
    last_shot_hold: float = 1.0
    transition_default: str = "cut"
    crossfade_max: float = 0.25


class ReframeProfile(BaseModel):
    mode: str = "face-aware"
    headroom: float = 0.15
    subject_size: float = 0.7


class ColorProfile(BaseModel):
    preset: str = "editorial"
    grain: float = 0.03
    black_lift: float = 0.02


class TypographyProfile(BaseModel):
    heading_font: str = "DM Serif Display"
    body_font: str = "Inter"
    min_heading_size: int = 36
    min_body_size: int = 24
    max_words_per_overlay: int = 6
    text_color: str = "#FFFFFF"
    shadow: str = "0 2px 12px rgba(0,0,0,0.6)"


class AudioProfile(BaseModel):
    music_gain_db: float = -18
    duck_ratio: float = 8
    duck_attack_ms: float = 5
    duck_release_ms: float = 300
    target_lufs: float = -14


class TransitionsProfile(BaseModel):
    allowed: list[str] = ["cut", "crossfade"]
    forbidden: list[str] = []


class SubtitlesProfile(BaseModel):
    style: str = "editorial"
    font: str = "DM Serif Display"
    size: int = 20
    position: str = "bottom"
    margin_bottom: int = 80


class StyleProfile(BaseModel):
    name: str
    description: str = ""
    pacing: PacingProfile = PacingProfile()
    reframe: ReframeProfile = ReframeProfile()
    color: ColorProfile = ColorProfile()
    typography: TypographyProfile = TypographyProfile()
    audio: AudioProfile = AudioProfile()
    transitions: TransitionsProfile = TransitionsProfile()
    subtitles: SubtitlesProfile = SubtitlesProfile()


def load_style(name: str, presets_dir: Path | None = None) -> StyleProfile:
    """Load a style profile by name from the presets directory."""
    base = presets_dir or PRESETS_DIR
    path = base / f"{name}.yaml"
    if not path.exists():
        raise StyleNotFoundError(f"Style '{name}' not found at {path}")
    with open(path) as f:
        data = yaml.safe_load(f)
    return StyleProfile.model_validate(data)
```

- [ ] **Step 7: Run tests**

```bash
pytest tests/test_style.py -v
```

Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add core/lib/style.py presets/styles/ tests/test_style.py
git commit -m "feat: style profile system with editorial/social/luxury presets"
```

---

### Task 5: Brand profile loader

**Files:**
- Create: `core/lib/brand.py`
- Create: `brands/_template.json`
- Create: `tests/test_brand.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_brand.py
import json
import pytest
from core.lib.brand import load_brand, BrandProfile, BrandNotFoundError


class TestLoadBrand:

    def test_load_from_file(self, tmp_path):
        brand_data = {
            "name": "TestBrand",
            "colors": {"primary": "#000", "accent": "#F00"},
            "fonts": {"heading": "Inter", "body": "Inter"},
            "logo": "logo.png"
        }
        brand_file = tmp_path / "testbrand.json"
        brand_file.write_text(json.dumps(brand_data))
        brand = load_brand("testbrand", brands_dir=tmp_path)
        assert brand.name == "TestBrand"
        assert brand.colors.primary == "#000"
        assert brand.colors.accent == "#F00"

    def test_unknown_brand_raises(self, tmp_path):
        with pytest.raises(BrandNotFoundError):
            load_brand("nonexistent", brands_dir=tmp_path)

    def test_brand_defaults(self, tmp_path):
        brand_data = {"name": "Minimal"}
        brand_file = tmp_path / "minimal.json"
        brand_file.write_text(json.dumps(brand_data))
        brand = load_brand("minimal", brands_dir=tmp_path)
        assert brand.name == "Minimal"
        assert brand.colors.primary == "#000000"
        assert brand.fonts.heading == "Inter"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_brand.py -v
```

Expected: FAIL

- [ ] **Step 3: Create _template.json**

```json
{
  "name": "ClientName",
  "colors": {
    "primary": "#000000",
    "accent": "#FFFFFF",
    "background": "#FFFFFF",
    "text": "#1A1A1A"
  },
  "fonts": {
    "heading": "DM Serif Display",
    "body": "Inter"
  },
  "logo": null,
  "logo_dark": null,
  "watermark": null,
  "tagline": "",
  "website": "",
  "social": {},
  "voice": {
    "tone": "professional",
    "language": "es"
  }
}
```

- [ ] **Step 4: Implement brand.py**

```python
# core/lib/brand.py
"""Load and validate brand profiles from JSON files."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel


BRANDS_DIR = Path(__file__).resolve().parent.parent.parent / "brands"


class BrandNotFoundError(Exception):
    pass


class BrandColors(BaseModel):
    primary: str = "#000000"
    accent: str = "#FFFFFF"
    background: str = "#FFFFFF"
    text: str = "#1A1A1A"


class BrandFonts(BaseModel):
    heading: str = "Inter"
    body: str = "Inter"


class BrandVoice(BaseModel):
    tone: str = "professional"
    language: str = "es"


class BrandProfile(BaseModel):
    name: str
    colors: BrandColors = BrandColors()
    fonts: BrandFonts = BrandFonts()
    logo: str | None = None
    logo_dark: str | None = None
    watermark: str | None = None
    tagline: str = ""
    website: str = ""
    social: dict[str, str] = {}
    voice: BrandVoice = BrandVoice()


def load_brand(name: str, brands_dir: Path | None = None) -> BrandProfile:
    """Load a brand profile by name (case-insensitive filename match)."""
    base = brands_dir or BRANDS_DIR
    # Try exact match first, then lowercase
    path = base / f"{name}.json"
    if not path.exists():
        path = base / f"{name.lower()}.json"
    if not path.exists():
        raise BrandNotFoundError(f"Brand '{name}' not found in {base}")
    with open(path) as f:
        data = json.load(f)
    return BrandProfile.model_validate(data)
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_brand.py -v
```

Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add core/lib/brand.py brands/_template.json tests/test_brand.py
git commit -m "feat: brand profile system with JSON loader"
```

---

### Task 6: Project management — client scaffolding + ingest + state

**Files:**
- Create: `core/project/client.py`
- Create: `core/project/ingest.py`
- Create: `core/project/naming.py`
- Create: `core/project/state.py`
- Create: `clients/_TEMPLATE/project.json`
- Create: `tests/test_client.py`
- Create: `tests/test_naming.py`
- Create: `tests/test_state.py`

- [ ] **Step 1: Write failing tests for client scaffolding**

```python
# tests/test_client.py
import pytest
from pathlib import Path
from core.project.client import create_client


class TestCreateClient:

    def test_creates_folder_structure(self, tmp_path):
        create_client("Vulcano", clients_dir=tmp_path)
        client_dir = tmp_path / "Vulcano"
        assert client_dir.exists()
        assert (client_dir / "project.json").exists()
        assert (client_dir / "footage" / "raw").exists()
        assert (client_dir / "footage" / "proxies").exists()
        assert (client_dir / "exports" / "master").exists()
        assert (client_dir / "exports" / "instagram-reel").exists()
        assert (client_dir / "review").exists()

    def test_project_json_has_client_name(self, tmp_path):
        create_client("Vulcano", clients_dir=tmp_path)
        import json
        pj = json.loads((tmp_path / "Vulcano" / "project.json").read_text())
        assert pj["client"] == "Vulcano"
        assert pj["phase"] == "new"

    def test_duplicate_raises(self, tmp_path):
        create_client("Vulcano", clients_dir=tmp_path)
        with pytest.raises(FileExistsError):
            create_client("Vulcano", clients_dir=tmp_path)
```

- [ ] **Step 2: Write failing tests for naming**

```python
# tests/test_naming.py
from core.project.naming import format_filename, parse_filename


class TestFormatFilename:

    def test_basic(self):
        assert format_filename("Livitum", "SS26", "IGReel", 3) == "Livitum_SS26_IGReel_v03.mp4"

    def test_master(self):
        assert format_filename("Vulcano", "BrandFilm", "Master", 1) == "Vulcano_BrandFilm_Master_v01.mp4"


class TestParseFilename:

    def test_parse(self):
        parts = parse_filename("Livitum_SS26_IGReel_v03.mp4")
        assert parts["client"] == "Livitum"
        assert parts["project"] == "SS26"
        assert parts["format"] == "IGReel"
        assert parts["version"] == 3

    def test_invalid_returns_none(self):
        assert parse_filename("random_file.mp4") is None
```

- [ ] **Step 3: Write failing tests for state**

```python
# tests/test_state.py
import json
import pytest
from core.project.state import load_state, save_state, ProjectState


class TestProjectState:

    def test_load_state(self, tmp_path):
        pj = {"client": "X", "project": "Y", "phase": "editing"}
        (tmp_path / "project.json").write_text(json.dumps(pj))
        state = load_state(tmp_path)
        assert state.client == "X"
        assert state.phase == "editing"

    def test_save_state(self, tmp_path):
        state = ProjectState(client="X", project="Y", phase="briefing")
        save_state(state, tmp_path)
        loaded = json.loads((tmp_path / "project.json").read_text())
        assert loaded["client"] == "X"
        assert loaded["phase"] == "briefing"

    def test_add_render(self, tmp_path):
        state = ProjectState(client="X", project="Y", phase="editing")
        state.add_render(version=1, path="renders/v01.mp4", qa_passed=False, notes="loudness off")
        assert len(state.renders) == 1
        assert state.renders[0]["version"] == 1
        assert state.renders[0]["qa_passed"] is False
```

- [ ] **Step 4: Run all tests to verify they fail**

```bash
pytest tests/test_client.py tests/test_naming.py tests/test_state.py -v
```

Expected: FAIL

- [ ] **Step 5: Create _TEMPLATE/project.json**

```json
{
  "client": "",
  "project": "",
  "created": "",
  "phase": "new",
  "phases_completed": [],
  "timeline_version": 0,
  "renders": [],
  "exports": [],
  "feedback_count": 0,
  "templates_saved": 0
}
```

- [ ] **Step 6: Implement client.py**

```python
# core/project/client.py
"""Create and manage client project folders."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path


CLIENTS_DIR = Path(__file__).resolve().parent.parent.parent / "clients"
TEMPLATE_DIR = CLIENTS_DIR / "_TEMPLATE"

SUBDIRS = [
    "brief",
    "footage/raw",
    "footage/proxies",
    "footage/audio",
    "assets",
    "edit/timelines",
    "edit/versions",
    "renders",
    "exports/master",
    "exports/instagram-reel",
    "exports/instagram-story",
    "exports/instagram-feed",
    "exports/tiktok",
    "exports/youtube",
    "exports/youtube-shorts",
    "exports/linkedin",
    "review",
    "archive",
]


def create_client(name: str, clients_dir: Path | None = None) -> Path:
    """Scaffold a new client folder from template."""
    base = clients_dir or CLIENTS_DIR
    client_dir = base / name
    if client_dir.exists():
        raise FileExistsError(f"Client '{name}' already exists at {client_dir}")

    # Create all subdirectories
    for subdir in SUBDIRS:
        (client_dir / subdir).mkdir(parents=True, exist_ok=True)

    # Write project.json
    project = {
        "client": name,
        "project": "",
        "created": datetime.now(timezone.utc).isoformat(),
        "phase": "new",
        "phases_completed": [],
        "timeline_version": 0,
        "renders": [],
        "exports": [],
        "feedback_count": 0,
        "templates_saved": 0,
    }
    (client_dir / "project.json").write_text(json.dumps(project, indent=2))

    return client_dir
```

- [ ] **Step 7: Implement naming.py**

```python
# core/project/naming.py
"""Naming conventions for BMP Studio output files."""

from __future__ import annotations

import re

VALID_FORMATS = {
    "Master", "IGReel", "IGStory", "IGFeed",
    "TikTok", "YT16x9", "YTShort", "LinkedIn",
}

_PATTERN = re.compile(
    r"^(?P<client>[A-Za-z0-9]+)_(?P<project>[A-Za-z0-9]+)_(?P<format>[A-Za-z0-9]+)_v(?P<version>\d{2})\.mp4$"
)


def format_filename(client: str, project: str, fmt: str, version: int) -> str:
    """Generate a filename following BMP naming convention."""
    return f"{client}_{project}_{fmt}_v{version:02d}.mp4"


def parse_filename(filename: str) -> dict | None:
    """Parse a BMP-convention filename into its components. Returns None if invalid."""
    m = _PATTERN.match(filename)
    if not m:
        return None
    return {
        "client": m.group("client"),
        "project": m.group("project"),
        "format": m.group("format"),
        "version": int(m.group("version")),
    }
```

- [ ] **Step 8: Implement state.py**

```python
# core/project/state.py
"""Project state tracking — persists across Claude Code sessions."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel


class ProjectState(BaseModel):
    client: str
    project: str = ""
    created: str = ""
    phase: str = "new"
    phases_completed: list[str] = []
    timeline_version: int = 0
    renders: list[dict[str, Any]] = []
    exports: list[dict[str, Any]] = []
    feedback_count: int = 0
    templates_saved: int = 0

    def add_render(self, version: int, path: str, qa_passed: bool, notes: str = "") -> None:
        self.renders.append({
            "version": version,
            "path": path,
            "qa_passed": qa_passed,
            "notes": notes,
        })

    def advance_phase(self, phase: str) -> None:
        if self.phase not in self.phases_completed:
            self.phases_completed.append(self.phase)
        self.phase = phase


def load_state(project_dir: Path) -> ProjectState:
    """Load project state from project.json."""
    path = project_dir / "project.json"
    data = json.loads(path.read_text())
    return ProjectState.model_validate(data)


def save_state(state: ProjectState, project_dir: Path) -> None:
    """Save project state to project.json."""
    path = project_dir / "project.json"
    path.write_text(state.model_dump_json(indent=2))
```

- [ ] **Step 9: Run all tests**

```bash
pytest tests/test_client.py tests/test_naming.py tests/test_state.py -v
```

Expected: ALL PASS

- [ ] **Step 10: Commit**

```bash
git add core/project/ clients/_TEMPLATE/ tests/test_client.py tests/test_naming.py tests/test_state.py
git commit -m "feat: project management — client scaffold, naming, state tracking"
```

---

### Task 7: Defaults resolver — merge style profile into timeline

**Files:**
- Create: `core/defaults.py`
- Create: `tests/test_defaults.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_defaults.py
from core.defaults import resolve_defaults
from core.timeline import Timeline


class TestResolveDefaults:

    def test_minimal_timeline_gets_style_defaults(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}]
            }
        }
        timeline = Timeline.model_validate(data)
        resolved = resolve_defaults(timeline)

        # Should inherit editorial.yaml defaults
        assert resolved.post.grain == 0.03
        assert resolved.post.loudness_lufs == -14

    def test_explicit_values_override_style(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}]
            },
            "post": {"grain": 0.0, "loudness_lufs": -16}
        }
        timeline = Timeline.model_validate(data)
        resolved = resolve_defaults(timeline)

        # Explicit values win over style
        assert resolved.post.grain == 0.0
        assert resolved.post.loudness_lufs == -16

    def test_clips_get_reframe_default(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}]
            }
        }
        timeline = Timeline.model_validate(data)
        resolved = resolve_defaults(timeline)

        # Clip without explicit reframe gets style default
        clip = resolved.tracks.video[0]
        assert clip.reframe is not None
        assert clip.reframe.mode == "face-aware"
        assert clip.reframe.headroom == 0.15

    def test_explicit_reframe_not_overridden(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {"src": "clip.mp4", "in": 0, "out": 5,
                     "reframe": {"mode": "center"}}
                ]
            }
        }
        timeline = Timeline.model_validate(data)
        resolved = resolve_defaults(timeline)
        assert resolved.tracks.video[0].reframe.mode == "center"

    def test_music_gets_duck_defaults(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}],
                "music": {"src": "track.mp3"}
            }
        }
        timeline = Timeline.model_validate(data)
        resolved = resolve_defaults(timeline)

        assert resolved.tracks.music.gain_db == -18
        assert resolved.tracks.music.duck is not None
        assert resolved.tracks.music.duck.ratio == 8
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_defaults.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement defaults.py**

```python
# core/defaults.py
"""Resolve style profile defaults into a timeline."""

from __future__ import annotations

import copy

from core.timeline import Timeline, Reframe, Duck, Post
from core.lib.style import load_style


def resolve_defaults(timeline: Timeline) -> Timeline:
    """Apply style profile defaults to a timeline.

    Explicit values in the timeline always win. Only fill in what's missing.
    Returns a new Timeline with defaults applied (does not mutate input).
    """
    t = timeline.model_copy(deep=True)
    style = load_style(t.meta.style)

    # --- Post defaults ---
    # Only override if the timeline used the Pydantic default (0.0 for grain)
    # We detect "user didn't specify" by checking if the original data had the field
    # For simplicity: grain default from style if timeline grain == 0.0 (Pydantic default)
    if t.post.grain == 0.0 and style.color.grain != 0.0:
        t.post.grain = style.color.grain
    if t.post.loudness_lufs == -14 and style.audio.target_lufs != -14:
        t.post.loudness_lufs = style.audio.target_lufs

    # --- Clip defaults ---
    for clip in t.tracks.video:
        # Apply default reframe if not specified
        if clip.reframe is None:
            clip.reframe = Reframe(
                mode=style.reframe.mode,
                headroom=style.reframe.headroom,
                subject_size=style.reframe.subject_size,
            )
        # Apply default color if not specified
        if clip.color is None:
            clip.color = style.color.preset

    # --- Music defaults ---
    if t.tracks.music is not None:
        if t.tracks.music.gain_db == -18 and style.audio.music_gain_db != -18:
            t.tracks.music.gain_db = style.audio.music_gain_db
        if t.tracks.music.duck is None:
            t.tracks.music.duck = Duck(
                ratio=style.audio.duck_ratio,
                attack_ms=style.audio.duck_attack_ms,
                release_ms=style.audio.duck_release_ms,
            )

    # --- Transition defaults ---
    # If no transitions specified, fill with style default
    if t.tracks.transitions is None and len(t.tracks.video) > 1:
        from core.timeline import Transition
        t.tracks.transitions = [
            Transition(type=style.pacing.transition_default)
            for _ in range(len(t.tracks.video) - 1)
        ]

    return t
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_defaults.py -v
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add core/defaults.py tests/test_defaults.py
git commit -m "feat: defaults resolver — merge style profile into timeline"
```

---

### Task 8: Registry — detect activated features

**Files:**
- Create: `core/registry.py`
- Create: `tests/test_registry.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_registry.py
from core.registry import get_activated_features
from core.timeline import Timeline


class TestGetActivatedFeatures:

    def test_minimal_timeline(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}]
            }
        }
        t = Timeline.model_validate(data)
        features = get_activated_features(t)
        assert "ffmpeg" in features
        assert "upscale" not in features
        assert "slowmo" not in features

    def test_with_enhancements(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {"src": "clip.mp4", "in": 0, "out": 5,
                     "enhance": {"upscale": True, "slowmo": 2.0, "stabilize": True}}
                ]
            }
        }
        t = Timeline.model_validate(data)
        features = get_activated_features(t)
        assert "upscale" in features
        assert "slowmo" in features
        assert "stabilize" in features

    def test_with_overlays(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}]
            },
            "overlays": [
                {"composition": "HookText", "start": 0, "duration": 2, "props": {}}
            ]
        }
        t = Timeline.model_validate(data)
        features = get_activated_features(t)
        assert "remotion" in features

    def test_with_subtitles(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}]
            },
            "subtitles": {"mode": "auto", "lang": "es"}
        }
        t = Timeline.model_validate(data)
        features = get_activated_features(t)
        assert "whisperx" in features

    def test_with_gl_transition(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [
                    {"src": "a.mp4", "in": 0, "out": 3},
                    {"src": "b.mp4", "in": 0, "out": 3}
                ],
                "transitions": [{"type": "gl", "name": "directionalwipe"}]
            }
        }
        t = Timeline.model_validate(data)
        features = get_activated_features(t)
        assert "gl_transitions" in features

    def test_with_audio_denoise(self):
        data = {
            "meta": {"client": "X", "style": "editorial"},
            "output": {"width": 1080, "height": 1920},
            "tracks": {
                "video": [{"src": "clip.mp4", "in": 0, "out": 5}],
                "audio_extra": [{"src": "vo.wav", "denoise": True}]
            }
        }
        t = Timeline.model_validate(data)
        features = get_activated_features(t)
        assert "deepfilternet" in features
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_registry.py -v
```

- [ ] **Step 3: Implement registry.py**

```python
# core/registry.py
"""Detect which features/tools are activated in a given timeline."""

from __future__ import annotations

from core.timeline import Timeline


def get_activated_features(timeline: Timeline) -> set[str]:
    """Scan a timeline and return the set of tool/feature names that will be needed."""
    features: set[str] = {"ffmpeg"}  # always needed

    # Scan clips for enhancements
    for clip in timeline.tracks.video:
        if clip.enhance:
            if clip.enhance.upscale:
                features.add("upscale")
            if clip.enhance.slowmo and clip.enhance.slowmo > 1.0:
                features.add("slowmo")
            if clip.enhance.stabilize:
                features.add("stabilize")
            if clip.enhance.matting:
                features.add("matting")
            if clip.enhance.depth_parallax:
                features.add("depth")
            if clip.enhance.denoise_video:
                features.add("denoise_video")
            if clip.enhance.restore:
                features.add("restore")
            if clip.enhance.deface:
                features.add("deface")
            if clip.enhance.segment:
                features.add("sam2")
            if clip.enhance.inpaint:
                features.add("propainter")
            if clip.enhance.track:
                features.add("track_anything")
            if clip.enhance.lip_sync:
                features.add("lip_sync")
            if clip.enhance.speech_enhance:
                features.add("speech_enhance")
        if clip.generate:
            features.add("generation")
        if clip.reframe and clip.reframe.mode == "face-aware":
            features.add("face_detect")

    # Scan transitions
    if timeline.tracks.transitions:
        for t in timeline.tracks.transitions:
            if t.type == "gl":
                features.add("gl_transitions")
            if t.easing:
                features.add("xfade_easing")

    # Music
    if timeline.tracks.music:
        if timeline.tracks.music.generate:
            features.add("musicgen")
        if timeline.tracks.music.beat_sync:
            features.add("librosa")

    # Audio extra
    if timeline.tracks.audio_extra:
        for ae in timeline.tracks.audio_extra:
            if ae.denoise:
                features.add("deepfilternet")
            if ae.generate:
                features.add("tts")

    # Overlays
    if timeline.overlays:
        for ov in timeline.overlays:
            if ov.type == "remotion":
                features.add("remotion")
            elif ov.type == "lottie":
                features.add("lottie")
            elif ov.type == "html5":
                features.add("html5_renderer")
            elif ov.type == "gsap":
                features.add("gsap")

    # Subtitles
    if timeline.subtitles:
        if timeline.subtitles.mode == "auto":
            features.add("whisperx")
        if timeline.subtitles.style.startswith("remotion:"):
            features.add("remotion_subtitles")

    # Color matching
    for clip in timeline.tracks.video:
        if clip.color and clip.color.startswith("match:"):
            features.add("color_matcher")

    return features
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_registry.py -v
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add core/registry.py tests/test_registry.py
git commit -m "feat: registry — detect activated features in timeline"
```

---

### Task 9: Probe wrapper

**Files:**
- Create: `core/analysis/probe.py`
- Create: `tests/test_probe.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_probe.py
import pytest
from core.analysis.probe import probe_file, ProbeResult


class TestProbe:

    def test_probe_returns_result(self, sample_video):
        """sample_video is a pytest fixture that creates a tiny test video."""
        result = probe_file(sample_video)
        assert isinstance(result, ProbeResult)
        assert result.width > 0
        assert result.height > 0
        assert result.duration > 0
        assert result.codec_video is not None

    def test_probe_nonexistent_raises(self):
        with pytest.raises(FileNotFoundError):
            probe_file("/nonexistent/file.mp4")
```

- [ ] **Step 2: Create conftest.py with sample video fixture**

```python
# tests/conftest.py
import subprocess
import pytest
from pathlib import Path


@pytest.fixture
def sample_video(tmp_path) -> Path:
    """Create a tiny 1-second test video with ffmpeg."""
    out = tmp_path / "test.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        "color=c=blue:s=320x240:d=1",
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
        "-t", "1", "-c:v", "libx264", "-c:a", "aac",
        "-shortest", str(out)
    ], capture_output=True, check=True)
    return out


@pytest.fixture
def sample_audio(tmp_path) -> Path:
    """Create a tiny 1-second test audio file."""
    out = tmp_path / "test.wav"
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        "anullsrc=r=44100:cl=mono",
        "-t", "1", str(out)
    ], capture_output=True, check=True)
    return out
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pytest tests/test_probe.py -v
```

- [ ] **Step 4: Implement probe.py**

```python
# core/analysis/probe.py
"""FFprobe wrapper for media file inspection."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from pydantic import BaseModel


class ProbeResult(BaseModel):
    path: str
    duration: float = 0.0
    width: int = 0
    height: int = 0
    fps: float = 0.0
    codec_video: str | None = None
    codec_audio: str | None = None
    sample_rate: int | None = None
    channels: int | None = None
    bitrate: int | None = None
    format_name: str = ""
    has_audio: bool = False
    has_video: bool = False
    raw: dict[str, Any] = {}


def probe_file(path: str | Path) -> ProbeResult:
    """Probe a media file and return structured metadata."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format", "-show_streams",
        str(path)
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(r.stdout)

    result = ProbeResult(path=str(path), raw=data)

    # Parse format
    fmt = data.get("format", {})
    result.duration = float(fmt.get("duration", 0))
    result.bitrate = int(fmt.get("bit_rate", 0)) if fmt.get("bit_rate") else None
    result.format_name = fmt.get("format_name", "")

    # Parse streams
    for stream in data.get("streams", []):
        codec_type = stream.get("codec_type")
        if codec_type == "video" and not result.has_video:
            result.has_video = True
            result.width = int(stream.get("width", 0))
            result.height = int(stream.get("height", 0))
            result.codec_video = stream.get("codec_name")
            # Parse fps from r_frame_rate (e.g., "30/1")
            rfr = stream.get("r_frame_rate", "0/1")
            if "/" in rfr:
                num, den = rfr.split("/")
                result.fps = float(num) / float(den) if float(den) else 0
        elif codec_type == "audio" and not result.has_audio:
            result.has_audio = True
            result.codec_audio = stream.get("codec_name")
            result.sample_rate = int(stream.get("sample_rate", 0)) if stream.get("sample_rate") else None
            result.channels = int(stream.get("channels", 0)) if stream.get("channels") else None

    return result
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_probe.py -v
```

Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add core/analysis/probe.py tests/test_probe.py tests/conftest.py
git commit -m "feat: probe wrapper for media file inspection"
```

---

### Task 10: Defect logging system

**Files:**
- Create: `core/learning/defect_log.py`
- Create: `tests/test_defect_log.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_defect_log.py
import json
import pytest
from pathlib import Path
from core.learning.defect_log import log_defect, get_recent_defects, get_defect_pattern_count


class TestLogDefect:

    def test_log_appends_to_jsonl(self, tmp_path):
        log_path = tmp_path / "defects.jsonl"
        log_path.touch()
        log_defect(
            defect_type="framing",
            description="Head cropped in clip 3",
            cause="headroom too low",
            fix_applied="increased headroom to 0.18",
            source="user_feedback",
            severity="major",
            client="Livitum",
            project="SS26",
            style="editorial",
            knowledge_dir=tmp_path,
        )
        lines = log_path.read_text().strip().split("\n")
        assert len(lines) == 1
        entry = json.loads(lines[0])
        assert entry["defect_type"] == "framing"
        assert entry["severity"] == "major"
        assert "timestamp" in entry

    def test_multiple_logs_append(self, tmp_path):
        log_path = tmp_path / "defects.jsonl"
        log_path.touch()
        for i in range(3):
            log_defect(
                defect_type="audio",
                description=f"Issue {i}",
                knowledge_dir=tmp_path,
            )
        lines = log_path.read_text().strip().split("\n")
        assert len(lines) == 3


class TestGetRecentDefects:

    def test_returns_last_n(self, tmp_path):
        log_path = tmp_path / "defects.jsonl"
        log_path.touch()
        for i in range(5):
            log_defect(defect_type="pacing", description=f"d{i}", knowledge_dir=tmp_path)
        recent = get_recent_defects(n=3, knowledge_dir=tmp_path)
        assert len(recent) == 3


class TestPatternCount:

    def test_counts_by_type(self, tmp_path):
        log_path = tmp_path / "defects.jsonl"
        log_path.touch()
        for _ in range(3):
            log_defect(defect_type="framing", description="head crop", knowledge_dir=tmp_path)
        log_defect(defect_type="audio", description="loud", knowledge_dir=tmp_path)

        count = get_defect_pattern_count("framing", knowledge_dir=tmp_path)
        assert count == 3
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_defect_log.py -v
```

- [ ] **Step 3: Implement defect_log.py**

```python
# core/learning/defect_log.py
"""Log defects and corrections for the learning system."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent.parent / "knowledge"


def log_defect(
    defect_type: str,
    description: str,
    cause: str = "",
    fix_applied: str = "",
    source: str = "user_feedback",
    severity: str = "minor",
    client: str = "",
    project: str = "",
    style: str = "",
    video_type: str = "",
    rule_generated: str = "",
    knowledge_dir: Path | None = None,
) -> dict[str, Any]:
    """Append a defect entry to defects.jsonl."""
    base = knowledge_dir or KNOWLEDGE_DIR
    log_path = base / "defects.jsonl"

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "defect_type": defect_type,
        "description": description,
        "cause": cause,
        "fix_applied": fix_applied,
        "source": source,
        "severity": severity,
        "client": client,
        "project": project,
        "style": style,
        "video_type": video_type,
        "rule_generated": rule_generated,
    }

    with open(log_path, "a") as f:
        f.write(json.dumps(entry) + "\n")

    return entry


def get_recent_defects(n: int = 10, knowledge_dir: Path | None = None) -> list[dict[str, Any]]:
    """Return the last N defects."""
    base = knowledge_dir or KNOWLEDGE_DIR
    log_path = base / "defects.jsonl"
    if not log_path.exists():
        return []
    lines = log_path.read_text().strip().split("\n")
    lines = [l for l in lines if l.strip()]
    return [json.loads(l) for l in lines[-n:]]


def get_defect_pattern_count(
    defect_type: str,
    knowledge_dir: Path | None = None,
) -> int:
    """Count how many defects of a given type exist."""
    base = knowledge_dir or KNOWLEDGE_DIR
    log_path = base / "defects.jsonl"
    if not log_path.exists():
        return 0
    count = 0
    for line in log_path.read_text().strip().split("\n"):
        if not line.strip():
            continue
        entry = json.loads(line)
        if entry.get("defect_type") == defect_type:
            count += 1
    return count
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_defect_log.py -v
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add core/learning/defect_log.py tests/test_defect_log.py
git commit -m "feat: defect logging system for learning feedback loop"
```

---

### Task 11: CLI with Click

**Files:**
- Create: `core/cli.py`
- Create: `tests/test_cli.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_cli.py
from click.testing import CliRunner
from core.cli import main


class TestCLI:

    def test_help(self):
        runner = CliRunner()
        result = runner.invoke(main, ["--help"])
        assert result.exit_code == 0
        assert "BMP Studio" in result.output

    def test_new_client(self, tmp_path, monkeypatch):
        monkeypatch.setattr("core.project.client.CLIENTS_DIR", tmp_path)
        runner = CliRunner()
        result = runner.invoke(main, ["new", "TestClient"])
        assert result.exit_code == 0
        assert (tmp_path / "TestClient").exists()
        assert (tmp_path / "TestClient" / "project.json").exists()

    def test_new_duplicate_fails(self, tmp_path, monkeypatch):
        monkeypatch.setattr("core.project.client.CLIENTS_DIR", tmp_path)
        runner = CliRunner()
        runner.invoke(main, ["new", "TestClient"])
        result = runner.invoke(main, ["new", "TestClient"])
        assert result.exit_code != 0

    def test_probe(self, sample_video):
        runner = CliRunner()
        result = runner.invoke(main, ["probe", str(sample_video)])
        assert result.exit_code == 0
        assert "duration" in result.output.lower() or "width" in result.output.lower()

    def test_tools(self):
        runner = CliRunner()
        result = runner.invoke(main, ["tools"])
        assert result.exit_code == 0
        assert "ffmpeg" in result.output.lower()

    def test_render_missing_file(self):
        runner = CliRunner()
        result = runner.invoke(main, ["render", "/nonexistent/timeline.json"])
        assert result.exit_code != 0
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_cli.py -v
```

- [ ] **Step 3: Implement cli.py**

```python
# core/cli.py
"""BMP Studio CLI — Click-based command interface."""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import click

from core.project.client import create_client
from core.analysis.probe import probe_file


@click.group()
@click.version_option(version="0.1.0", prog_name="BMP Studio")
def main():
    """BMP Studio — headless video production toolkit for Claude Code."""
    pass


@main.command()
@click.argument("name")
def new(name: str):
    """Create a new client project folder."""
    try:
        path = create_client(name)
        click.echo(f"Created client: {path}")
    except FileExistsError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@main.command()
@click.argument("file", type=click.Path(exists=True))
def probe(file: str):
    """Inspect a media file's metadata."""
    result = probe_file(file)
    click.echo(f"File:     {result.path}")
    click.echo(f"Duration: {result.duration:.2f}s")
    click.echo(f"Size:     {result.width}x{result.height}")
    click.echo(f"FPS:      {result.fps:.1f}")
    click.echo(f"Video:    {result.codec_video}")
    click.echo(f"Audio:    {result.codec_audio}")
    if result.has_audio:
        click.echo(f"Channels: {result.channels}")
        click.echo(f"Sample:   {result.sample_rate} Hz")


@main.command()
@click.argument("timeline", type=click.Path(exists=True))
@click.option("--preview", is_flag=True, help="Fast 720p preview render")
@click.option("--draft", is_flag=True, help="Draft with overlays, no AI enhance")
def render(timeline: str, preview: bool, draft: bool):
    """Render a video from a timeline.json file."""
    from core.timeline import Timeline

    path = Path(timeline)
    try:
        data = json.loads(path.read_text())
        tl = Timeline.model_validate(data)
    except Exception as e:
        click.echo(f"Error parsing timeline: {e}", err=True)
        sys.exit(1)

    mode = "preview" if preview else "draft" if draft else "full"
    click.echo(f"Rendering {tl.meta.client}/{tl.meta.project or 'untitled'} [{mode}]")
    click.echo("Engine not yet implemented — this is a foundation stub.")
    click.echo(f"Timeline valid: {len(tl.tracks.video)} clips, "
               f"{len(tl.overlays or [])} overlays")


@main.command()
def tools():
    """List all installed tools and their status."""
    checks = {
        "ffmpeg": "ffmpeg",
        "ffprobe": "ffprobe",
        "mediainfo": "mediainfo",
        "tesseract": "tesseract",
        "sox": "sox",
        "node": "node",
    }
    for name, cmd in checks.items():
        found = shutil.which(cmd) is not None
        status = click.style("OK", fg="green") if found else click.style("MISSING", fg="red")
        click.echo(f"  {name:20s} {status}")

    # Python packages
    py_packages = [
        "pydantic", "yaml", "cv2", "whisperx", "librosa",
        "deepfilternet", "moviepy", "scenedetect",
    ]
    click.echo()
    for pkg in py_packages:
        try:
            __import__(pkg)
            status = click.style("OK", fg="green")
        except ImportError:
            status = click.style("NOT INSTALLED", fg="yellow")
        click.echo(f"  {pkg:20s} {status}")


@main.command()
@click.argument("message")
def learn(message: str):
    """Manually log a defect or learning for the knowledge base."""
    from core.learning.defect_log import log_defect
    entry = log_defect(
        defect_type="manual",
        description=message,
        source="user_manual",
    )
    click.echo(f"Logged: {message}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Add __main__.py for `python -m core.cli`**

```python
# core/__main__.py
from core.cli import main

main()
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_cli.py -v
```

Expected: ALL PASS

- [ ] **Step 6: Verify CLI works manually**

```bash
./bmp --help
./bmp tools
```

Expected: Help text shows, tools command lists installed tools.

- [ ] **Step 7: Commit**

```bash
git add core/cli.py core/__main__.py tests/test_cli.py
git commit -m "feat: CLI with new, probe, render (stub), tools, learn commands"
```

---

### Task 12: Export presets + client template finalization

**Files:**
- Create: `presets/export-presets.json`

- [ ] **Step 1: Create export-presets.json**

```json
{
  "master": {
    "codec": "libx264",
    "crf": 18,
    "preset": "medium",
    "audio_codec": "aac",
    "audio_bitrate": "192k",
    "pix_fmt": "yuv420p",
    "movflags": "+faststart"
  },
  "instagram-reel": {
    "width": 1080, "height": 1920, "fps": 30,
    "codec": "libx264", "crf": 23, "preset": "medium",
    "audio_codec": "aac", "audio_bitrate": "128k",
    "max_duration": 90, "max_size_mb": 250
  },
  "instagram-story": {
    "width": 1080, "height": 1920, "fps": 30,
    "codec": "libx264", "crf": 23, "preset": "medium",
    "audio_codec": "aac", "audio_bitrate": "128k",
    "max_duration": 60
  },
  "instagram-feed": {
    "width": 1080, "height": 1080, "fps": 30,
    "codec": "libx264", "crf": 23, "preset": "medium",
    "audio_codec": "aac", "audio_bitrate": "128k",
    "max_duration": 60
  },
  "tiktok": {
    "width": 1080, "height": 1920, "fps": 30,
    "codec": "libx264", "crf": 23, "preset": "medium",
    "audio_codec": "aac", "audio_bitrate": "128k",
    "max_duration": 180, "max_size_mb": 287
  },
  "youtube": {
    "width": 1920, "height": 1080, "fps": 30,
    "codec": "libx264", "crf": 18, "preset": "slow",
    "audio_codec": "aac", "audio_bitrate": "256k"
  },
  "youtube-shorts": {
    "width": 1080, "height": 1920, "fps": 30,
    "codec": "libx264", "crf": 20, "preset": "medium",
    "audio_codec": "aac", "audio_bitrate": "128k",
    "max_duration": 60
  },
  "linkedin": {
    "width": 1920, "height": 1080, "fps": 30,
    "codec": "libx264", "crf": 23, "preset": "medium",
    "audio_codec": "aac", "audio_bitrate": "128k",
    "max_duration": 600, "max_size_mb": 5120
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add presets/export-presets.json
git commit -m "feat: export presets for all social platforms"
```

---

### Task 13: Run full test suite + final verification

- [ ] **Step 1: Run all tests**

```bash
cd /Users/xaviermotjellinas/Documents/00_BMP/bmp-studio
source .venv/bin/activate
pytest tests/ -v --tb=short
```

Expected: ALL PASS (should be ~30+ tests)

- [ ] **Step 2: Verify CLI end-to-end**

```bash
./bmp --help
./bmp new TestClient
./bmp probe tests/fixtures/test.mp4  # or create one
./bmp tools
./bmp learn "Test learning entry"
```

- [ ] **Step 3: Final commit with tag**

```bash
git add -A
git commit -m "feat: Block 1 complete — foundation with CLI, schema, styles, brands, learning"
git tag v0.1.0-foundation
```

---

## Block Summary

After completing this block, we have:

| Component | Status |
|-----------|--------|
| Repository scaffold | Working |
| Timeline schema v2 (Pydantic) | Working + tested |
| Style profiles (editorial/social/luxury) | Working + tested |
| Brand profiles | Working + tested |
| Client scaffolding | Working + tested |
| Project state tracking | Working + tested |
| Naming conventions | Working + tested |
| Probe (ffprobe wrapper) | Working + tested |
| Defect logging | Working + tested |
| Feature registry | Working + tested |
| Defaults resolver | Working + tested |
| CLI (bmp) | Working + tested |
| Export presets | Defined |
| Render engine | Stub (prints "not implemented") |

**Next block:** Block 2 — Core FFmpeg Engine (cut, reframe, transitions, audio, color, compose)
