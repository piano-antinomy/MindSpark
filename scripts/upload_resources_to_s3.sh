#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/upload_resources_to_s3.sh [bucket-name]
# Default bucket: mindspark-questions-prod
BUCKET="${1:-mindspark-questions-prod}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$REPO_ROOT/backend-java/resources"

if [ ! -d "$SRC_DIR" ]; then
  echo "Source directory not found: $SRC_DIR" >&2
  exit 1
fi

aws s3 sync "$SRC_DIR" "s3://$BUCKET" \
  --exclude ".DS_Store" \
  --delete 