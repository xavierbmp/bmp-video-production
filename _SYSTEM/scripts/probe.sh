#!/usr/bin/env bash
# probe.sh - Pretty-print key media properties of a file.
#
# Usage: probe.sh <input>

source "$(dirname "$0")/lib/common.sh"
require_ffmpeg

[[ $# -eq 1 ]] || die "Usage: $(basename "$0") <input>"
IN="$1"
[[ -f "$IN" ]] || die "Not found: $IN"

ffprobe -v error -hide_banner \
  -show_entries format=duration,size,bit_rate,format_long_name \
  -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,bit_rate,pix_fmt,color_space,color_range \
  -of default=nw=0 "$IN"
