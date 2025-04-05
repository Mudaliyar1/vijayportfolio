#!/bin/bash

# This script removes sensitive information from the Git repository history

# The token to remove
TOKEN="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"
REPLACEMENT="YOUR_HUGGING_FACE_TOKEN"

# Files to clean
FILES_TO_CLEAN=(
  "routes/ai-proxy.js"
  "views/images/index.ejs"
)

# Create a backup branch
git checkout -b backup-before-cleaning

# Switch back to main
git checkout main

# Use git filter-repo to remove the token from history
# First, install git-filter-repo if not already installed
# pip install git-filter-repo

# For each file, replace the token in the history
for file in "${FILES_TO_CLEAN[@]}"; do
  echo "Cleaning $file..."
  git filter-branch --force --index-filter \
    "git ls-files -z \"$file\" | xargs -0 sed -i 's/$TOKEN/$REPLACEMENT/g'" \
    --prune-empty --tag-name-filter cat -- --all
done

echo "Cleaning complete. You may need to force push with:"
echo "git push -f origin main"
