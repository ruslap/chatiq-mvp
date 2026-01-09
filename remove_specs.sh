#!/bin/bash

# Define the files to remove
FILES_TO_REMOVE=(
  "api-server/src/automation/automation-fallback.spec.ts"
  "api-server/src/automation/automation-delay.spec.ts"
)

echo "Starting cleanup of unwanted spec files..."

# Check if we are in the git repository
if [ ! -d ".git" ]; then
  echo "Error: Must be run from the root of the git repository."
  exit 1
fi

# Loop through and remove files
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "Removing $file from git and filesystem..."
    git rm "$file"
  else
    echo "File '$file' not found. Skipping."
  fi
done

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  echo "Committing changes..."
  git commit -m "chore: remove unwanted automation spec files"
  
  echo "Pushing to GitHub..."
  git push origin HEAD
  
  echo "Successfully removed files from GitHub and local system."
fi
