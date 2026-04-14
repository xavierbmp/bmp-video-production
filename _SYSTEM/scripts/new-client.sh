#!/usr/bin/env bash
# new-client.sh - Scaffold a new client folder from the _CLIENT_TEMPLATE.
#
# Usage: new-client.sh <client-name>
#
# Creates:
#   CLIENTS/<client-name>/
#   ├── brief.json       ← Fill this first
#   ├── README.md        ← Project overview
#   ├── IN/raw/          ← Drop footage here
#   ├── IN/assets/       ← Drop logos, music, refs here
#   ├── WORK/            ← Claude's workspace (auto-populated)
#   └── OUT/             ← Final deliverables

source "$(dirname "$0")/lib/common.sh"

[[ $# -eq 1 ]] || die "Usage: $(basename "$0") <client-name>"
NAME="$1"
DEST="$CLIENTS_DIR/$NAME"
TEMPLATE="$SYSTEM_DIR/templates/_CLIENT_TEMPLATE"

[[ -d "$TEMPLATE" ]] || die "Template not found: $TEMPLATE"
[[ -d "$DEST" ]] && die "Client already exists: $DEST"

log "Creating client: $NAME"
cp -R "$TEMPLATE" "$DEST"

# Stamp README with client name and date
README="$DEST/README.md"
if [[ -f "$README" ]]; then
  TODAY=$(date +%Y-%m-%d)
  sed -i.bak "s/\[CLIENT NAME\]/$NAME/g; s/\[DATE\]/$TODAY/g" "$README" && rm -f "${README}.bak"
fi

ok "Client ready: $DEST"
echo
echo "Structure:"
echo "  $DEST/"
echo "  ├── brief.json    ← Fill this with project details"
echo "  ├── IN/raw/       ← Drop footage here"
echo "  ├── IN/assets/    ← Drop logos, music, refs here"
echo "  ├── WORK/         ← Claude's workspace"
echo "  └── OUT/          ← Final deliverables"
echo
echo "Next steps:"
echo "  1. Fill brief.json"
echo "  2. Drop material into IN/"
echo "  3. Run: template-selector.sh --keywords '...' --copy '$NAME'"
