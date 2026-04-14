# Project: [CLIENT NAME]

## Structure

```
ClientName/
├── brief.json          ← Project brief (fill first)
├── timeline.json       ← Edit decisions (from template-selector.sh)
├── IN/                 ← User drops material here. NEVER modify.
│   ├── raw/            ← Video footage (MOV, MP4)
│   └── assets/         ← Logos, music, references, images
├── WORK/               ← Claude's workspace. Everything disposable.
│   └── (segments, renders, debug frames, remotion outputs...)
└── OUT/                ← Final deliverables
    ├── master/         ← High-quality archive (created by export-social.sh)
    ├── instagram-reel/ ← Platform exports (created by export-social.sh)
    └── ...
```

## Rules

- `IN/raw/` is **sacred**. Never modify, rename, or delete files inside.
- `WORK/` is **disposable**. Everything can be regenerated from IN + timeline.json.
- `OUT/` is for **final deliverables only**. Review cuts go here too.
- `brief.json` and `timeline.json` live at the project root (not inside folders).

## Quick start

```bash
# 1. Fill brief.json
# 2. Find best template:
_SYSTEM/scripts/template-selector.sh --keywords "talking head vertical 30s"
# 3. Copy template:
_SYSTEM/scripts/template-selector.sh --keywords "..." --copy "ClientName"
# 4. Probe material:
_SYSTEM/scripts/probe.sh IN/raw/*.mp4
# 5. Edit timeline.json (replace PLACEHOLDERs)
# 6. Render:
python3 _SYSTEM/scripts/render-edit.py timeline.json OUT/v01.mp4
# 7. QA:
_SYSTEM/scripts/qa-check.sh OUT/v01.mp4 --target-lufs -14
# 8. Export:
_SYSTEM/scripts/export-social.sh OUT/master.mp4 "ClientName" all
```
