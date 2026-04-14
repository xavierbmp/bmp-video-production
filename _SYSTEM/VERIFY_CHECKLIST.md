# ⛔ PER-CHANGE VERIFICATION CHECKLIST

> **Read this after EVERY ffmpeg/Remotion/Python command.**
> **You MUST complete ALL applicable checks before moving to the next step.**
> **Skip = broken output = user sees garbage = hours wasted.**

## BEFORE any operation — did you use existing resources?

```
□ Checked RESOURCE_GUIDE.md for an existing script/tool?
□ If a script exists for this task → used it instead of raw ffmpeg?
□ If a Remotion composition exists → used remotion-render.sh?
□ If a preset exists (subtitle style, export format) → used it?
□ If a timeline template exists → started from it?
```

**If you wrote a raw ffmpeg command for something that has a script, GO BACK
and use the script. The scripts exist for a reason.**

## After ANY video operation:

```bash
# 1. Does the file exist and have the right duration?
ffprobe -v quiet -show_entries stream=duration,width,height,sample_aspect_ratio -of csv=p=0 OUTPUT.mp4

# 2. Is SAR correct? (MUST be 1:1 for all BMP output)
# If SAR ≠ 1:1 → STOP. Add setsar=1 and redo.

# 3. Extract a frame at the KEY MOMENT of this change:
ffmpeg -y -ss [KEY_TIMESTAMP] -i OUTPUT.mp4 -vframes 1 /tmp/verify.jpg

# 4. READ the frame:
# Use the Read tool on /tmp/verify.jpg
# DESCRIBE what you see. Compare to what the user asked for.
```

## Specific checks by operation type:

### Changed a clip:
- [ ] Extract frame → is it the RIGHT clip? (not the old one, not a different one)
- [ ] Did ANY other clip change? (extract frames at OTHER positions too)

### Changed a crop/scale:
- [ ] SAR=1:1 in ffprobe?
- [ ] Content looks correct? (not squished, not just ceiling/floor)
- [ ] Same aspect ratio as source? (not stretched)

### Applied an overlay (LowerThird, wipe, image):
- [ ] Extract frame at overlay START → is it visible?
- [ ] Extract frame at overlay PEAK → positioned correctly?
- [ ] Extract frame at overlay END → did it disappear cleanly?
- [ ] Is the overlay ON TOP of what it should be on top of?

### Concatenated clips:
- [ ] Total duration = sum of parts? (ffprobe)
- [ ] Extract frame at EACH join boundary → no black frame, no glitch?
- [ ] First frame = correct first clip?
- [ ] Last frame = correct last clip?

### Audio operation (-shortest, mix, fade, normalize):
- [ ] Output duration matches expected? (not truncated)
- [ ] Audio at t=1s: present? (ffmpeg volumedetect)
- [ ] Audio at t=middle: present?
- [ ] Audio at t=end-1s: present? (not killed by afade)

### Burned subtitles:
- [ ] Extract frame where subtitle should show → subtitle visible?
- [ ] Text readable at phone size?
- [ ] Not overlapping with other elements?
- [ ] Not covering endcard?

### Delivered to user:
- [ ] SAR=1:1, DAR=9:16 (ffprobe)
- [ ] Duration matches expectation
- [ ] Audio present throughout
- [ ] NO changes to elements user already approved
- [ ] Extract frames at 5+ key moments, Read ALL of them
- [ ] Compare to user's LATEST request, not an older one

## The Golden Rule:

**If you did not Read a frame of the output, you did not verify it.**
**If you did not verify it, do NOT move to the next step.**
**If the output is wrong, fix it and verify AGAIN.**
**Repeat until correct. No limit.**
