#!/bin/bash

# Add all changes
git add .

# Prompt for commit message
read -p "Enter commit message: " commit_msg

# Check if commit message is empty
if [ -z "$commit_msg" ]; then
  echo "Commit message cannot be empty. Aborting."
  exit 1
fi

# Commit
git commit -m "$commit_msg"

# Push to develop, set upstream if not set
git push




