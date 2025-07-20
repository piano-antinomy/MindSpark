#!/bin/bash

# git-sync-to-main.sh
# Syncs current branch to match origin/main exactly
# WARNING: This will overwrite local changes and force push!

set -e  # Exit on any error

echo "🚨 WARNING: This will:"
echo "   1. Fetch latest from origin"
echo "   2. HARD RESET current branch to origin/main (losing local changes)"
echo "   3. FORCE PUSH to remote (overwriting remote branch)"
echo ""

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Ask for confirmation
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "🔄 Fetching from origin..."
git fetch origin

echo "🔄 Hard resetting $CURRENT_BRANCH to origin/main..."
git reset --hard origin/main

echo "🔄 Force pushing $CURRENT_BRANCH..."
git push --force

echo "✅ Successfully synced $CURRENT_BRANCH to origin/main" 