#!/usr/bin/env python3
"""
render-edit.py - Declarative video edit renderer.

Reads a timeline.json describing clips, music, titles and output format, and
produces the final video by calling ffmpeg. This is the main tool I (Claude)
use for headless editing: I write the timeline, you review it, I render it.

Usage:
    render-edit.py <timeline.json> <output.mp4>

Timeline schema (all fields except "output" and "clips" are optional):

{
  "output": {
    "width": 1080, "height": 1920, "fps": 30
  },
  "clips": [
    {
      "src": "CLIENTS/X/01_FOOTAGE/raw/A.mp4",
      "in":  2.0,                     // start second in source
      "out": 5.5,                     // end second in source
      "fit": "crop" | "pad" | "blur-bg",
      "speed": 1.0,                   // >1 faster, <1 slower
      "mute": false
    }
  ],
  "transitions": {
    "type": "none" | "crossfade" | "fade",
    "duration": 0.3
  },
  "music": {
    "src": "path/to/music.mp3",
    "db": -12,                        // gain vs clip audio
    "duck": true,                     // sidechain-duck against clip audio
    "fade": 1.0                       // fade-in / fade-out seconds
  },
  "text_overlays": [
    {
      "text": "LIVITUM",
      "start": 0.5,
      "duration": 2.0,
      "pos": "top|middle|bottom|top-left|...",
      "size": 72,
      "color": "white",
      "box": true,
      "font": "/System/Library/Fonts/Helvetica.ttc"
    }
  ],
  "watermark": "path/to/logo.png" | null,
  "subtitles": "generate" | "path/to/file.srt" | null,
  "loudness_lufs": -14
}
"""

import json, os, sys, subprocess, tempfile, shlex, shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
VIDEO_ROOT = SCRIPT_DIR.parent.parent

def die(msg):
    print(f"\033[31m[ERR]\033[0m {msg}", file=sys.stderr); sys.exit(1)
def log(msg):
    print(f"\033[36m[BMP]\033[0m {msg}")
def ok(msg):
    print(f"\033[32m[OK]\033[0m  {msg}")

def run(cmd, check=True):
    log("$ " + " ".join(shlex.quote(c) for c in cmd))
    r = subprocess.run(cmd, capture_output=True, text=True)
    if check and r.returncode != 0:
        sys.stderr.write(r.stderr)
        die(f"command failed: {cmd[0]}")
    return r

def ffprobe_duration(path):
    r = run(["ffprobe","-v","error","-show_entries","format=duration",
             "-of","default=nw=1:nk=1", str(path)])
    return float(r.stdout.strip())

def trim_clip(src, in_s, out_s, speed, width, height, fit, fps, mute, tmpdir, idx):
    out = tmpdir / f"clip_{idx:03d}.mp4"
    dur = out_s - in_s
    # Build filter
    if fit == "crop":
        vf = (f"scale=if(gt(a\\,{width}/{height})\\,-2\\,{width}):"
              f"if(gt(a\\,{width}/{height})\\,{height}\\,-2),"
              f"crop={width}:{height}")
    elif fit == "pad":
        vf = (f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
              f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black")
    elif fit == "blur-bg":
        vf = (f"split=2[bg][fg];"
              f"[bg]scale={width}:{height}:force_original_aspect_ratio=increase,"
              f"crop={width}:{height},boxblur=40:2[bgblur];"
              f"[fg]scale={width}:{height}:force_original_aspect_ratio=decrease[fgs];"
              f"[bgblur][fgs]overlay=(W-w)/2:(H-h)/2")
    elif fit == "face-detect-crop":
        # Use face-detect-crop.py to get the crop filter string
        script_dir = Path(__file__).parent
        face_script = script_dir / "face-detect-crop.py"
        if not face_script.exists():
            die("face-detect-crop.py not found in scripts directory")
        r = subprocess.run(
            [sys.executable, str(face_script), str(src),
             "--target", f"{width}x{height}", "--filter-only"],
            capture_output=True, text=True
        )
        if r.returncode != 0:
            warn(f"Face detection failed for {src}, falling back to center crop")
            vf = (f"scale=if(gt(a\\,{width}/{height})\\,-2\\,{width}):"
                  f"if(gt(a\\,{width}/{height})\\,{height}\\,-2),"
                  f"crop={width}:{height}")
        else:
            vf = r.stdout.strip()
            log(f"Face-detect crop: {vf}")
    else:
        die(f"Invalid fit: {fit}")

    vf += f",setsar=1,fps={fps},format=yuv420p"

    # Speed adjustment
    filter_complex = f"[0:v]{vf},setpts=PTS/{speed}[v]"
    amap = []
    if not mute:
        atempo = build_atempo(speed)
        filter_complex += f";[0:a]aresample=48000,{atempo},aformat=sample_fmts=fltp:channel_layouts=stereo[a]"
        amap = ["-map","[a]"]
    else:
        # Create silent audio matching output duration
        filter_complex += (f";anullsrc=channel_layout=stereo:sample_rate=48000,"
                           f"atrim=duration={dur/speed}[a]")
        amap = ["-map","[a]"]

    cmd = ["ffmpeg","-hide_banner","-loglevel","error","-y",
           "-ss", str(in_s), "-i", str(src), "-t", str(dur),
           "-filter_complex", filter_complex,
           "-map", "[v]", *amap,
           "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",
           "-c:a","aac","-b:a","192k","-ar","48000",
           str(out)]
    run(cmd)
    return out

def build_atempo(speed):
    # atempo must be in [0.5, 2.0]; chain if outside
    import math
    chain = []
    s = speed
    if s > 2:
        while s > 2:
            chain.append("atempo=2.0"); s /= 2
        chain.append(f"atempo={s}")
    elif s < 0.5:
        while s < 0.5:
            chain.append("atempo=0.5"); s *= 2
        chain.append(f"atempo={s}")
    else:
        chain.append(f"atempo={s}")
    return ",".join(chain)

def concat_with_transitions(clips, trans, out, tmpdir):
    if len(clips) == 1:
        shutil.copy(clips[0], out); return
    ttype = trans.get("type","none")
    tdur  = float(trans.get("duration", 0.3))
    if ttype == "none":
        # Use concat demuxer (all clips already normalized)
        lst = tmpdir / "list.txt"
        with open(lst,"w") as f:
            for c in clips:
                f.write(f"file '{c.resolve()}'\n")
        run(["ffmpeg","-hide_banner","-loglevel","error","-y",
             "-f","concat","-safe","0","-i",str(lst),"-c","copy",str(out)])
        return
    # xfade chain
    cmd = ["ffmpeg","-hide_banner","-loglevel","error","-y"]
    for c in clips: cmd += ["-i", str(c)]
    durs = [ffprobe_duration(c) for c in clips]
    fc = ""
    prev_v, prev_a = "0:v","0:a"
    acc = durs[0]
    for i in range(1, len(clips)):
        offset = acc - tdur
        vout = f"vx{i}"; aout = f"ax{i}"
        xf_type = "fade" if ttype == "crossfade" else ttype
        fc += f"[{prev_v}][{i}:v]xfade=transition={xf_type}:duration={tdur}:offset={offset:.3f}[{vout}];"
        fc += f"[{prev_a}][{i}:a]acrossfade=d={tdur}[{aout}];"
        prev_v, prev_a = vout, aout
        acc += durs[i] - tdur
    cmd += ["-filter_complex", fc, "-map", f"[{prev_v}]", "-map", f"[{prev_a}]",
            "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",
            "-c:a","aac","-b:a","192k","-ar","48000", str(out)]
    run(cmd)

def apply_music(video, music, out):
    src  = music["src"]
    db   = music.get("db", -12)
    duck = music.get("duck", True)
    fade = float(music.get("fade", 1.0))
    vdur = ffprobe_duration(video)
    fout = max(0, vdur - fade)
    if duck:
        fc = (f"[1:a]volume={db}dB,afade=t=in:st=0:d={fade},"
              f"afade=t=out:st={fout}:d={fade}[music];"
              f"[0:a][music]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=300[mix]")
    else:
        fc = (f"[1:a]volume={db}dB,afade=t=in:st=0:d={fade},"
              f"afade=t=out:st={fout}:d={fade}[music];"
              f"[0:a][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix]")
    run(["ffmpeg","-hide_banner","-loglevel","error","-y",
         "-i",str(video),"-stream_loop","-1","-i",str(src),
         "-filter_complex",fc,
         "-map","0:v","-map","[mix]",
         "-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",
         "-shortest", str(out)])

def apply_text_overlays(video, overlays, out):
    if not overlays:
        shutil.copy(video, out); return
    filters = []
    for o in overlays:
        txt  = o["text"].replace("'", r"\'").replace(":", r"\:")
        pos  = o.get("pos","bottom")
        start= float(o.get("start",0))
        dur  = float(o.get("duration",3))
        fade = float(o.get("fade",0.3))
        size = o.get("size",64)
        col  = o.get("color","white")
        box  = o.get("box", True)
        font = o.get("font","/System/Library/Fonts/Helvetica.ttc")
        margin = o.get("margin",80)
        pos_map = {
            "top":          (f"(w-text_w)/2",   f"{margin}"),
            "bottom":       (f"(w-text_w)/2",   f"h-text_h-{margin}"),
            "middle":       (f"(w-text_w)/2",   f"(h-text_h)/2"),
            "top-left":     (f"{margin}",       f"{margin}"),
            "top-right":    (f"w-text_w-{margin}", f"{margin}"),
            "bottom-left":  (f"{margin}",       f"h-text_h-{margin}"),
            "bottom-right": (f"w-text_w-{margin}",f"h-text_h-{margin}"),
        }
        x,y = pos_map.get(pos, pos_map["bottom"])
        end = start+dur
        fo_start = end-fade
        alpha = (f"if(lt(t,{start}),0,if(lt(t,{start}+{fade}),(t-{start})/{fade},"
                 f"if(lt(t,{fo_start}),1,if(lt(t,{end}),({end}-t)/{fade},0))))")
        dt = (f"drawtext=text='{txt}':fontsize={size}:fontcolor={col}:"
              f"x={x}:y={y}:enable='between(t,{start},{end})':alpha='{alpha}'")
        if os.path.exists(font): dt += f":fontfile='{font}'"
        if box: dt += ":box=1:boxcolor=black@0.5:boxborderw=20"
        filters.append(dt)
    vf = ",".join(filters)
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(video),
         "-vf",vf,
         "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",
         "-c:a","copy", str(out)])

def apply_watermark(video, logo, out):
    fc = ("[1]format=rgba,colorchannelmixer=aa=0.85,scale=iw*0.12:-1[wm];"
          "[0][wm]overlay=W-w-40:H-h-40")
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(video),"-i",str(logo),
         "-filter_complex",fc,
         "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",
         "-c:a","copy", str(out)])

def generate_subs(video, lang, tmpdir):
    log("Generating subtitles with Whisper...")
    base = tmpdir / "subs"
    run(["whisper", str(video), "--model","small","--language",lang,
         "--output_format","srt","--output_dir",str(tmpdir),"--fp16","False"])
    srt = tmpdir / (Path(video).stem + ".srt")
    return srt if srt.exists() else None

def burn_subs(video, srt, out):
    vf = (f"subtitles='{srt}':force_style='FontName=Helvetica,FontSize=20,"
          f"PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,"
          f"Outline=1,Shadow=0,MarginV=80'")
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(video),
         "-vf",vf,"-c:v","libx264","-preset","medium","-crf","18",
         "-pix_fmt","yuv420p","-c:a","copy",str(out)])

def apply_loudnorm(video, lufs, out):
    af = f"loudnorm=I={lufs}:TP=-1.0:LRA=11"
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(video),
         "-af",af,"-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",
         str(out)])

def main():
    if len(sys.argv) != 3:
        die("Usage: render-edit.py <timeline.json> <output.mp4>")
    tl_path, out_path = Path(sys.argv[1]), Path(sys.argv[2])
    if not tl_path.exists(): die(f"Timeline not found: {tl_path}")
    tl = json.loads(tl_path.read_text())

    out_cfg = tl.get("output", {})
    W = out_cfg.get("width", 1080)
    H = out_cfg.get("height", 1920)
    FPS = out_cfg.get("fps", 30)

    with tempfile.TemporaryDirectory(prefix="bmp_edit_") as td:
        tmpdir = Path(td)
        log(f"Working dir: {tmpdir}")

        # 1. Trim/normalize each clip
        clip_files = []
        for i, c in enumerate(tl["clips"]):
            log(f"Processing clip {i+1}/{len(tl['clips'])}: {c['src']}")
            cf = trim_clip(
                src=c["src"],
                in_s=float(c.get("in", 0)),
                out_s=float(c["out"]) if "out" in c else ffprobe_duration(c["src"]),
                speed=float(c.get("speed", 1.0)),
                width=W, height=H, fit=c.get("fit","crop"),
                fps=FPS, mute=bool(c.get("mute", False)),
                tmpdir=tmpdir, idx=i
            )
            clip_files.append(cf)

        # 2. Concat with transitions
        stage1 = tmpdir / "stage1.mp4"
        concat_with_transitions(clip_files, tl.get("transitions",{"type":"none"}), stage1, tmpdir)
        log(f"Stage 1 (concat) done: {ffprobe_duration(stage1):.2f}s")

        # 3. Music
        stage2 = tmpdir / "stage2.mp4"
        if tl.get("music"):
            apply_music(stage1, tl["music"], stage2)
        else:
            shutil.copy(stage1, stage2)

        # 4. Text overlays
        stage3 = tmpdir / "stage3.mp4"
        apply_text_overlays(stage2, tl.get("text_overlays", []), stage3)

        # 5. Watermark
        stage4 = tmpdir / "stage4.mp4"
        if tl.get("watermark"):
            apply_watermark(stage3, tl["watermark"], stage4)
        else:
            shutil.copy(stage3, stage4)

        # 6. Subtitles
        stage5 = tmpdir / "stage5.mp4"
        subs_mode = tl.get("subtitles")
        if subs_mode == "generate":
            srt = generate_subs(stage4, tl.get("subtitle_lang","es"), tmpdir)
            if srt: burn_subs(stage4, srt, stage5)
            else: shutil.copy(stage4, stage5)
        elif subs_mode and os.path.exists(subs_mode):
            burn_subs(stage4, Path(subs_mode), stage5)
        else:
            shutil.copy(stage4, stage5)

        # 7. Loudness normalize
        lufs = tl.get("loudness_lufs", -14)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        apply_loudnorm(stage5, lufs, out_path)

        ok(f"Rendered: {out_path}  ({ffprobe_duration(out_path):.2f}s)")

if __name__ == "__main__":
    main()
