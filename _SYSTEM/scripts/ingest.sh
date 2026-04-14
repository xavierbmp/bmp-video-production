#!/usr/bin/env bash
# ingest.sh - Copy raw footage from a source folder/SD card into a client's
#             01_FOOTAGE/raw directory, generating SHA256 checksums and a
#             manifest. Idempotent: skips files that already exist with same hash.
#
# Usage: ingest.sh <source-folder> <client-name>
# Example: ingest.sh /Volumes/SD_CARD/DCIM Livitum

source "$(dirname "$0")/lib/common.sh"

[[ $# -eq 2 ]] || die "Usage: $(basename "$0") <source-folder> <client-name>"

SRC="$1"
CLIENT="$2"
[[ -d "$SRC" ]] || die "Source not found: $SRC"

DEST="$(client_dir "$CLIENT")/01_FOOTAGE/raw"
MANIFEST="$DEST/_manifest.tsv"
mkdir -p "$DEST"
[[ -f "$MANIFEST" ]] || printf "timestamp\tfilename\tsize_bytes\tsha256\n" > "$MANIFEST"

log "Ingesting from: $SRC"
log "Destination:   $DEST"

shopt -s nullglob nocaseglob
COUNT=0
SKIPPED=0
while IFS= read -r -d '' file; do
  base="$(basename "$file")"
  target="$DEST/$base"
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")

  if [[ -f "$target" ]]; then
    existing_hash=$(shasum -a 256 "$target" | awk '{print $1}')
    new_hash=$(shasum -a 256 "$file" | awk '{print $1}')
    if [[ "$existing_hash" == "$new_hash" ]]; then
      warn "Skip (already ingested, hash matches): $base"
      SKIPPED=$((SKIPPED+1))
      continue
    else
      ts=$(timestamp)
      target="$DEST/${base%.*}_$ts.${base##*.}"
      warn "Conflict: $base exists with different hash. Renaming to $(basename "$target")"
    fi
  fi

  cp -p "$file" "$target"
  hash=$(shasum -a 256 "$target" | awk '{print $1}')
  printf "%s\t%s\t%s\t%s\n" "$(date -u +%FT%TZ)" "$(basename "$target")" "$size" "$hash" >> "$MANIFEST"
  ok "Copied: $(basename "$target")"
  COUNT=$((COUNT+1))
done < <(find "$SRC" -type f \( -iname "*.mp4" -o -iname "*.mov" -o -iname "*.mxf" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.m4v" -o -iname "*.wav" -o -iname "*.aif" -o -iname "*.aiff" -o -iname "*.flac" -o -iname "*.mp3" \) -print0)

log "Done. Copied: $COUNT  Skipped: $SKIPPED"
log "Manifest: $MANIFEST"
