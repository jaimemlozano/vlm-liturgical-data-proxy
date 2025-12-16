#!/bin/bash

# Redeploy script for Vercel
# This triggers a redeploy without requiring code changes

echo "Redeploying to Vercel production..."

# Deploy to production
vercel --prod

echo "Redeploy complete!"


