# Block 2: Core FFmpeg Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the render engine that converts a timeline.json into a finished video. After this block, `bmp render timeline.json --preview` produces a real video with cuts, reframe, transitions, audio mix, color grading, and loudness normalization.

**Architecture:** `core/engine.py` orchestrates the 14-step render flow. Each step delegates to a module in `core/ffmpeg/`. All FFmpeg calls go through a shared `run_ffmpeg()` helper. Render modes (preview/draft/full) skip steps appropriately.

**Tech Stack:** Python 3.11+, FFmpeg 7+, subprocess, existing Pydantic models from Block 1

**Depends on:** Block 1 (timeline.py, defaults.py, registry.py, probe.py, style profiles)

---

## Task Overview

1. **FFmpeg helpers** — `core/ffmpeg/helpers.py` (run_ffmpeg, tmp file management)
2. **Cut module** — `core/ffmpeg/cut.py` (trim, concat)
3. **Reframe module** — `core/ffmpeg/reframe.py` (center crop, pad, blur-bg; face-aware stub)
4. **Color module** — `core/ffmpeg/color.py` (presets, LUT, match)
5. **Transitions module** — `core/ffmpeg/transitions.py` (xfade crossfade, cut)
6. **Audio module** — `core/ffmpeg/audio.py` (mix, ducking, normalize)
7. **Speed module** — `core/ffmpeg/speed.py` (speed change with pitch correction)
8. **Compose module** — `core/ffmpeg/compose.py` (merge base + transparent overlays)
9. **Filters module** — `core/ffmpeg/filters.py` (grain, stabilize, ken-burns)
10. **Engine orchestrator** — `core/engine.py` (the 14-step pipeline)
11. **Integration test** — end-to-end: timeline.json → rendered video

---
