#!/usr/bin/env bash
# BMP Video Production - shared shell helpers
# Source from any script: source "$(dirname "$0")/lib/common.sh"

set -euo pipefail

# ---------- colors ----------
if [[ -t 1 ]]; then
  C_RESET='\033[0m'; C_BOLD='\033[1m'
  C_RED='\033[31m'; C_GREEN='\033[32m'; C_YELLOW='\033[33m'; C_BLUE='\033[34m'; C_CYAN='\033[36m'
else
  C_RESET=''; C_BOLD=''; C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''; C_CYAN=''
fi

log()    { printf "${C_CYAN}[BMP]${C_RESET} %s\n" "$*"; }
ok()     { printf "${C_GREEN}[OK]${C_RESET}  %s\n" "$*"; }
warn()   { printf "${C_YELLOW}[WARN]${C_RESET} %s\n" "$*" >&2; }
err()    { printf "${C_RED}[ERR]${C_RESET}  %s\n" "$*" >&2; }
die()    { err "$*"; exit 1; }

# ---------- paths ----------
# VIDEO_ROOT is the 02_VIDEO EDITS directory
SCRIPT_DIR_REAL="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_ROOT="$(cd "$SCRIPT_DIR_REAL/../../.." && pwd)"
SYSTEM_DIR="$VIDEO_ROOT/_SYSTEM"
CLIENTS_DIR="$VIDEO_ROOT/CLIENTS"
ASSETS_DIR="$VIDEO_ROOT/_ASSETS"

export VIDEO_ROOT SYSTEM_DIR CLIENTS_DIR ASSETS_DIR

# ---------- dependency checks ----------
require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing dependency: $1. Install with: brew install $1"
}

require_ffmpeg() {
  require_cmd ffmpeg
  require_cmd ffprobe
}

# ---------- helpers ----------
client_dir() {
  local name="$1"
  local dir="$CLIENTS_DIR/$name"
  [[ -d "$dir" ]] || die "Client not found: $name (looked in $dir)"
  echo "$dir"
}

# Probe video duration in seconds
probe_duration() {
  ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$1"
}

# Probe video resolution as WxH
probe_resolution() {
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$1"
}

timestamp() { date +"%Y%m%d_%H%M%S"; }

# Safe filename: replace spaces and special chars
slug() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
}
