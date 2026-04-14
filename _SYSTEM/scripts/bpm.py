#!/usr/bin/env python3
"""
bpm.py - Detect BPM and beat timestamps of an audio file using librosa.

Usage:
    bpm.py <audio-file> [--json]

Prints tempo (BPM) and a list of beat onset timestamps (seconds). These are
the timestamps where cuts land well on the music — use them in a timeline.json
to build a beat-synced edit.

With --json, emits a JSON object ready to paste into a timeline.
"""
import sys, os, json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
VENV_PY = SCRIPT_DIR.parent.parent / "_SYSTEM" / ".venv" / "bin" / "python3"
# If we're not already running from the venv, re-exec ourselves under it
if os.environ.get("BMP_VENV") != "1":
    venv_py = SCRIPT_DIR.parent / ".venv" / "bin" / "python3"
    if venv_py.exists():
        os.environ["BMP_VENV"] = "1"
        os.execv(str(venv_py), [str(venv_py), *sys.argv])
    else:
        sys.exit("BMP venv not found. Run: _SYSTEM/.venv/bin/pip install librosa")

try:
    import librosa
    import numpy as np
except ImportError as e:
    sys.exit(f"Missing library: {e}. Run: _SYSTEM/.venv/bin/pip install librosa")

def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: bpm.py <audio-file> [--json]")
    path = sys.argv[1]
    as_json = "--json" in sys.argv

    print(f"[BMP] Loading {path}...", file=sys.stderr)
    y, sr = librosa.load(path, sr=None)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beats, sr=sr).tolist()
    tempo = float(tempo[0] if hasattr(tempo,'__len__') else tempo)

    if as_json:
        out = {
            "file": path,
            "bpm": round(tempo, 2),
            "duration": round(len(y)/sr, 3),
            "beat_count": len(beat_times),
            "beats": [round(t, 3) for t in beat_times],
            "downbeats_4_4": [round(t, 3) for i,t in enumerate(beat_times) if i%4==0],
            "phrase_ends_8bar_4_4": [round(t, 3) for i,t in enumerate(beat_times) if i%32==31],
        }
        print(json.dumps(out, indent=2))
    else:
        print(f"BPM: {tempo:.2f}")
        print(f"Duration: {len(y)/sr:.2f}s")
        print(f"Beats detected: {len(beat_times)}")
        print()
        print("First 16 beat timestamps:")
        for i, t in enumerate(beat_times[:16]):
            marker = " ◆" if i%4==0 else ""
            print(f"  beat {i+1:3d}  t={t:6.3f}s{marker}")
        print()
        print("Downbeats (every 4th beat) — good for editorial cuts:")
        for i, t in enumerate(beat_times[::4][:8]):
            print(f"  {t:6.3f}s")

if __name__ == "__main__":
    main()
