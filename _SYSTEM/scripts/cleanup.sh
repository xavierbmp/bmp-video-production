#!/usr/bin/env bash
# BMP Video Production — Project cleanup
#
# After a project is approved, moves intermediate files to 99_ARCHIVE/
# to free disk space. Keeps raw footage, final deliverables, and config.
#
# Usage:
#   cleanup.sh "ClientName"
#   cleanup.sh "Livitum Diseñadora" --dry-run   # preview what would be moved
#
# Keeps:
#   - IN/raw/ (sacred — never touch)
#   - IN/assets/ (logos, music, references)
#   - OUT/review/*_final.mp4 or latest version
#   - 03_EDIT/timelines/*.json
#   - 00_BRIEF/*
#   - PROJECT.md
#
# Moves to 99_ARCHIVE/:
#   - WORK/ (all intermediate segments, renders, debug images)
#   - 04_RENDERS/ (intermediate renders)

source "$(dirname "$0")/lib/common.sh"

if [[ $# -lt 1 ]]; then
  echo "Usage: cleanup.sh <ClientName> [--dry-run]"
  exit 1
fi

CLIENT_NAME="$1"
DRY_RUN=false
[[ "${2:-}" == "--dry-run" ]] && DRY_RUN=true

CLIENT_DIR="$CLIENTS_DIR/$CLIENT_NAME"

if [[ ! -d "$CLIENT_DIR" ]]; then
  die "Client folder not found: $CLIENT_DIR"
fi

ARCHIVE_DIR="$CLIENT_DIR/99_ARCHIVE"
mkdir -p "$ARCHIVE_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_SUBDIR="$ARCHIVE_DIR/cleanup_$TIMESTAMP"

# ── Calculate current space ──
TOTAL_BEFORE=$(du -sh "$CLIENT_DIR" 2>/dev/null | cut -f1)
log "Client: $CLIENT_NAME"
log "Current total size: $TOTAL_BEFORE"

# ── Identify files to archive ──
DIRS_TO_MOVE=()

if [[ -d "$CLIENT_DIR/WORK" ]]; then
  WORK_SIZE=$(du -sh "$CLIENT_DIR/WORK" 2>/dev/null | cut -f1)
  WORK_COUNT=$(find "$CLIENT_DIR/WORK" -type f 2>/dev/null | wc -l | tr -d ' ')
  log "WORK/: $WORK_COUNT files, $WORK_SIZE"
  DIRS_TO_MOVE+=("WORK")
fi

if [[ -d "$CLIENT_DIR/04_RENDERS" ]]; then
  RENDERS_SIZE=$(du -sh "$CLIENT_DIR/04_RENDERS" 2>/dev/null | cut -f1)
  RENDERS_COUNT=$(find "$CLIENT_DIR/04_RENDERS" -type f 2>/dev/null | wc -l | tr -d ' ')
  log "04_RENDERS/: $RENDERS_COUNT files, $RENDERS_SIZE"
  DIRS_TO_MOVE+=("04_RENDERS")
fi

if [[ ${#DIRS_TO_MOVE[@]} -eq 0 ]]; then
  ok "Nothing to clean up."
  exit 0
fi

echo ""
echo "Files that will be PRESERVED:"
echo "  ✓ IN/ (sacred — raw footage + assets)"
echo "  ✓ OUT/ (final deliverables)"
echo "  ✓ brief.json (project brief)"
echo "  ✓ timeline.json (edit decisions)"
echo "  ✓ README.md"
echo ""
echo "Files that will be ARCHIVED to 99_ARCHIVE/cleanup_$TIMESTAMP/:"
for dir in "${DIRS_TO_MOVE[@]}"; do
  echo "  → $dir/"
done
echo ""

if $DRY_RUN; then
  warn "DRY RUN — no files moved."
  exit 0
fi

# ── Move files ──
mkdir -p "$ARCHIVE_SUBDIR"

for dir in "${DIRS_TO_MOVE[@]}"; do
  if [[ -d "$CLIENT_DIR/$dir" ]]; then
    mv "$CLIENT_DIR/$dir" "$ARCHIVE_SUBDIR/$dir"
    ok "Moved $dir/ → 99_ARCHIVE/cleanup_$TIMESTAMP/$dir/"
  fi
done

# ── Report ──
TOTAL_AFTER=$(du -sh "$CLIENT_DIR" 2>/dev/null | cut -f1)
ARCHIVE_SIZE=$(du -sh "$ARCHIVE_SUBDIR" 2>/dev/null | cut -f1)

echo ""
ok "Cleanup complete!"
echo "  Before: $TOTAL_BEFORE"
echo "  After:  $TOTAL_AFTER"
echo "  Archived: $ARCHIVE_SIZE in 99_ARCHIVE/cleanup_$TIMESTAMP/"
echo ""
echo "  To undo: mv '$ARCHIVE_SUBDIR'/* '$CLIENT_DIR/'"
