#!/bin/bash
# StoryForge Auto-Sync Script
# Commits and pushes all changes to the remote repository
# Run this periodically or via Hermes cron

cd /c/Users/tiger/hermes-workspace/storyforge

# Check if there are any changes
if git diff --quiet && git diff --cached --quiet; then
    echo "$(date): No changes to sync."
    exit 0
fi

# Stage all changes
git add -A

# Commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "auto-sync: ${TIMESTAMP}" --no-verify

# Push to remote (if configured)
if git remote get-url origin &>/dev/null; then
    git push origin main 2>&1
    echo "$(date): Synced successfully."
else
    echo "$(date): No remote configured. Run: git remote add origin <your-repo-url>"
fi
