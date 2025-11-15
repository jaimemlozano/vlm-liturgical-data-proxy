#!/bin/bash

# Test script for VLM Liturgical Data Proxy API
# Usage: API_KEY=your-key-here ./test-api.sh

API_URL="https://vlm-liturgical-data-proxy.vercel.app/api/data/version.json"
API_KEY="${API_KEY:-}"

echo "🧪 Testing VLM Liturgical Data Proxy API"
echo "=========================================="
echo ""
echo "Testing URL: $API_URL"
echo ""

if [ -z "$API_KEY" ]; then
  echo "❌ Error: API_KEY environment variable is required"
  echo "   Usage: API_KEY=your-key-here ./test-api.sh"
  exit 1
fi

# Test 1: Basic request with API key
echo "📤 Test 1: Basic GET request with X-Api-Key header"
echo "---------------------------------------------------"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "X-Api-Key: $API_KEY" \
  "$API_URL")
http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

# Test 2: Check headers
echo "📋 Test 2: Response headers"
echo "--------------------------"
curl -s -I -H "X-Api-Key: $API_KEY" "$API_URL" | grep -E "(HTTP|Cache-Control|Content-Type)"
echo ""

# Test 3: Test with verbose output
echo "🔍 Test 3: Verbose request details"
echo "----------------------------------"
curl -v -H "X-Api-Key: $API_KEY" "$API_URL" 2>&1 | grep -E "(< |> |HTTP|Cache-Control|Content-Type)"
echo ""

echo "✅ Testing complete!"
echo ""
echo "💡 Tip: Check Vercel logs for detailed [API] prefixed logs"

