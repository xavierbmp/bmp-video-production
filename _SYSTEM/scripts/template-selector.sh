#!/usr/bin/env bash
# BMP Video Production — Template selector
#
# Reads a brief (JSON or keywords) and suggests the best timeline template.
# Optionally copies and pre-fills the template for the project.
#
# Usage:
#   template-selector.sh                           # interactive
#   template-selector.sh --brief path/to/brief.json
#   template-selector.sh --keywords "talking head vertical 30s interior"
#   template-selector.sh --keywords "fashion music 60s" --copy ClientName
#
# The script scans _SYSTEM/presets/timelines/ for available templates and
# matches by keywords in the _meta.type, _meta.description, and _meta.style.

source "$(dirname "$0")/lib/common.sh"

TEMPLATES_DIR="$SYSTEM_DIR/presets/timelines"

# ── Parse args ──
BRIEF=""
KEYWORDS=""
COPY_TO=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --brief)   BRIEF="$2"; shift 2 ;;
    --keywords) KEYWORDS="$2"; shift 2 ;;
    --copy)    COPY_TO="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: template-selector.sh [--brief file.json] [--keywords '...'] [--copy ClientName]"
      echo ""
      echo "Scans available timeline templates and suggests the best match."
      echo ""
      echo "Options:"
      echo "  --brief FILE      Read keywords from brief-input.json"
      echo "  --keywords TEXT   Match against these keywords"
      echo "  --copy CLIENT     Copy best match to CLIENTS/CLIENT/03_EDIT/timelines/"
      exit 0
      ;;
    *) die "Unknown option: $1" ;;
  esac
done

# ── Extract keywords from brief if provided ──
if [[ -n "$BRIEF" ]]; then
  require_cmd jq
  if [[ ! -f "$BRIEF" ]]; then
    die "Brief file not found: $BRIEF"
  fi
  # Extract relevant fields from brief
  KEYWORDS=$(jq -r '
    [.type // "", .aspect // "", .duration // "", .mood // "", .platforms // ""] |
    map(select(. != "")) | join(" ")
  ' "$BRIEF" 2>/dev/null || echo "")
  log "Keywords from brief: $KEYWORDS"
fi

# ── Interactive mode if no keywords ──
if [[ -z "$KEYWORDS" ]]; then
  echo ""
  echo "Available templates:"
  echo "─────────────────────────────────────────"
  for tmpl in "$TEMPLATES_DIR"/*.json; do
    name=$(basename "$tmpl" .json)
    desc=$(python3 -c "import json; d=json.load(open('$tmpl')); print(d.get('_meta',{}).get('description','')[:80])" 2>/dev/null || echo "")
    printf "  %-40s %s\n" "$name" "$desc"
  done
  echo "─────────────────────────────────────────"
  echo ""
  read -p "Enter keywords to match (e.g. 'talking head vertical 30s'): " KEYWORDS
fi

if [[ -z "$KEYWORDS" ]]; then
  die "No keywords provided."
fi

# ── Score each template ──
log "Matching templates for: $KEYWORDS"
echo ""

BEST_SCORE=0
BEST_TEMPLATE=""

KEYWORDS_LOWER=$(echo "$KEYWORDS" | tr '[:upper:]' '[:lower:]')

for tmpl in "$TEMPLATES_DIR"/*.json; do
  name=$(basename "$tmpl" .json)

  # Extract searchable text from template metadata
  search_text=$(python3 -c "
import json
d = json.load(open('$tmpl'))
m = d.get('_meta', {})
parts = [
    m.get('type', ''),
    m.get('description', ''),
    m.get('style', ''),
    m.get('aspect', ''),
    str(m.get('target_duration', '')),
]
sections = m.get('sections', [])
for s in sections:
    parts.append(s.get('name', ''))
    parts.append(s.get('notes', ''))
print(' '.join(parts).lower())
" 2>/dev/null || echo "$name")

  # Count keyword matches
  score=0
  for word in $KEYWORDS_LOWER; do
    if echo "$search_text" | grep -qi "$word"; then
      score=$((score + 1))
    fi
  done

  if [[ $score -gt 0 ]]; then
    dur=$(python3 -c "import json; print(json.load(open('$tmpl')).get('_meta',{}).get('target_duration','?'))" 2>/dev/null || echo "?")
    style=$(python3 -c "import json; print(json.load(open('$tmpl')).get('_meta',{}).get('style','?'))" 2>/dev/null || echo "?")
    aspect=$(python3 -c "import json; print(json.load(open('$tmpl')).get('_meta',{}).get('aspect','?'))" 2>/dev/null || echo "?")

    if [[ $score -gt $BEST_SCORE ]]; then
      BEST_SCORE=$score
      BEST_TEMPLATE="$tmpl"
    fi

    printf "  [%d matches] %-40s %ss %s %s\n" "$score" "$name" "$dur" "$aspect" "$style"
  fi
done

echo ""

if [[ -z "$BEST_TEMPLATE" ]]; then
  warn "No matching template found. Available templates:"
  ls "$TEMPLATES_DIR"/*.json | xargs -I{} basename {} .json | sed 's/^/  /'
  exit 1
fi

BEST_NAME=$(basename "$BEST_TEMPLATE" .json)
ok "Best match: $BEST_NAME (score: $BEST_SCORE)"

# ── Copy to project if requested ──
if [[ -n "$COPY_TO" ]]; then
  TARGET_DIR="$CLIENTS_DIR/$COPY_TO"
  mkdir -p "$TARGET_DIR"
  DEST="$TARGET_DIR/timeline.json"
  cp "$BEST_TEMPLATE" "$DEST"
  ok "Copied to: $DEST"
  echo "  → Edit this file to replace PLACEHOLDER values with real clip paths."
fi
