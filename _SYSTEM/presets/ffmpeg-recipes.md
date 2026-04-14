# FFmpeg cheat sheet — BMP video studio

Quick recipes for the editor's day-to-day. The wrapper scripts in
`_SYSTEM/scripts/` cover all of these and more — use them as the default. This
file is here for the moments when you need to drop into raw `ffmpeg`.

> **All commands assume `ffmpeg` ≥ 6 and `ffprobe`. Install with `brew install ffmpeg jq`.**

---

## 1. Inspect a file
```bash
ffprobe -v error -show_format -show_streams input.mp4
```

## 2. Lossless trim (cuts on nearest keyframe — instant)
```bash
ffmpeg -ss 00:00:10 -i in.mp4 -to 00:00:25 -c copy out.mp4
```

## 3. Frame-accurate trim (re-encode)
```bash
ffmpeg -ss 00:00:10 -i in.mp4 -to 00:00:25 \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k out.mp4
```

## 4. Concat clips with the same codec
```bash
printf "file 'a.mp4'\nfile 'b.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy out.mp4
```

## 5. Concat with different codecs/resolutions (re-encode)
```bash
ffmpeg -i a.mov -i b.mp4 -filter_complex \
  "[0:v]scale=1920:1080,setsar=1,fps=30[v0];\
   [1:v]scale=1920:1080,setsar=1,fps=30[v1];\
   [0:a]aresample=48000[a0];[1:a]aresample=48000[a1];\
   [v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 18 -c:a aac -b:a 192k out.mp4
```

## 6. Convert horizontal → vertical 9:16 (Reels/TikTok)
**Pad (letterbox, full content visible):**
```bash
ffmpeg -i in.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,\
pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:a copy out.mp4
```

**Center crop (zoomed, no bars):**
```bash
ffmpeg -i in.mp4 -vf "scale=-2:1920,crop=1080:1920" -c:a copy out.mp4
```

## 7. Loudness normalize to -14 LUFS (single-pass)
```bash
ffmpeg -i in.mp4 -af "loudnorm=I=-14:TP=-1.0:LRA=11" -c:v copy -c:a aac -b:a 192k out.mp4
```
> Two-pass is more accurate — use `_SYSTEM/scripts/normalize-audio.sh`.

## 8. Hard-burn subtitles
```bash
ffmpeg -i in.mp4 -vf "subtitles=in.srt:force_style='FontName=Helvetica,FontSize=22,BorderStyle=3'" \
  -c:v libx264 -crf 20 -c:a copy out.mp4
```

## 9. Watermark (logo bottom-right)
```bash
ffmpeg -i in.mp4 -i logo.png -filter_complex \
  "[1]format=rgba,colorchannelmixer=aa=0.85,scale=iw*0.12:-1[wm];\
   [0][wm]overlay=W-w-40:H-h-40" \
  -c:v libx264 -crf 18 -c:a copy out.mp4
```

## 10. Speed up / slow down (preserves audio pitch)
```bash
# 2× faster
ffmpeg -i in.mp4 -filter_complex "[0:v]setpts=PTS/2[v];[0:a]atempo=2.0[a]" \
  -map "[v]" -map "[a]" out.mp4
# 0.5× (slow-mo)
ffmpeg -i in.mp4 -filter_complex "[0:v]setpts=2.0*PTS[v];[0:a]atempo=0.5[a]" \
  -map "[v]" -map "[a]" out.mp4
```

## 11. Crossfade two clips (1s)
```bash
ffmpeg -i a.mp4 -i b.mp4 -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=1:offset=4[v];\
   [0:a][1:a]acrossfade=d=1[a]" \
  -map "[v]" -map "[a]" out.mp4
```
> Common transitions: `fade, fadeblack, fadewhite, slideleft, slideright, wiperight, circleopen, smoothleft, pixelize, hblur`.

## 12. Extract audio
```bash
ffmpeg -i in.mp4 -vn -c:a copy out.m4a       # original codec
ffmpeg -i in.mp4 -vn -c:a libmp3lame -q:a 2 out.mp3
```

## 13. Extract frames
```bash
ffmpeg -ss 00:00:05 -i in.mp4 -vframes 1 -q:v 2 frame.jpg
ffmpeg -i in.mp4 -vf fps=1 frames/%04d.jpg   # 1 fps
```

## 14. Generate animated GIF
```bash
ffmpeg -i in.mp4 -vf "fps=15,scale=720:-1:flags=lanczos,split[s0][s1];\
[s0]palettegen[p];[s1][p]paletteuse" out.gif
```

## 15. Mux/replace audio
```bash
ffmpeg -i video.mp4 -i music.wav -map 0:v -map 1:a -c:v copy -c:a aac -shortest out.mp4
```

## 16. Apply a 3D LUT
```bash
ffmpeg -i in.mp4 -vf "lut3d=path/to/lut.cube" -c:v libx264 -crf 18 -c:a copy out.mp4
```

## 17. ProRes intermediate (for color/edit handoff)
```bash
ffmpeg -i in.mp4 -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le \
  -c:a pcm_s16le out.mov
```
Profiles: 0=Proxy, 1=LT, 2=Standard, 3=HQ, 4=4444.

## 18. Stabilize a shaky shot (vidstab)
```bash
ffmpeg -i in.mp4 -vf vidstabdetect=shakiness=5:accuracy=15:result=transforms.trf -f null -
ffmpeg -i in.mp4 -vf "vidstabtransform=input=transforms.trf:zoom=1:smoothing=30,unsharp=5:5:0.8" \
  -c:v libx264 -crf 18 -c:a copy out.mp4
```

## 19. Clean export for YouTube 1080p (yt's recommended specs)
```bash
ffmpeg -i master.mov -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -profile:v high -level 4.2 -maxrate 12M -bufsize 24M \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart youtube.mp4
```

## 20. Hardware acceleration on Apple Silicon
```bash
# Decode + encode via VideoToolbox (much faster, slightly lower quality)
ffmpeg -hwaccel videotoolbox -i in.mp4 -c:v h264_videotoolbox -b:v 10M out.mp4
```
