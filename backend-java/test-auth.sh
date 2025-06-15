#!/bin/bash

echo "🧪 Testing Java Backend Authentication Endpoints"
echo "================================================"

BASE_URL="http://localhost:4072/api"

echo ""
echo "1. Testing Health Check..."
curl -s "${BASE_URL}/questions/math/health" | jq '.' || echo "Health check failed"

echo ""
echo "2. Testing Login with demo/demo123..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' \
  -c cookies.txt)

echo "$LOGIN_RESPONSE" | jq '.' || echo "Login failed"

echo ""
echo "3. Testing Authentication Status..."
curl -s "${BASE_URL}/auth/status" -b cookies.txt | jq '.' || echo "Status check failed"

echo ""
echo "4. Testing User Profile..."
curl -s "${BASE_URL}/auth/profile" -b cookies.txt | jq '.' || echo "Profile fetch failed"

echo ""
echo "5. Testing Logout..."
curl -s -X POST "${BASE_URL}/auth/logout" -b cookies.txt | jq '.' || echo "Logout failed"

echo ""
echo "6. Testing Available Math Levels..."
curl -s "${BASE_URL}/questions/math" | jq '.' || echo "Levels fetch failed"

echo ""
echo "7. Testing Level 1 Questions..."
curl -s "${BASE_URL}/questions/math/level/1" | jq '.count' || echo "Level 1 questions fetch failed"

# Clean up
rm -f cookies.txt

echo ""
echo "✅ Authentication test completed!"
echo ""
echo "To test manually:"
echo "  1. Start Java backend: ./run.sh"
echo "  2. Start frontend: cd ../website && npm start"
echo "  3. Login with demo/demo123 at http://localhost:3000/login.html" 