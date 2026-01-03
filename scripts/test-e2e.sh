#!/bin/bash

# End-to-End Test Script for Lemmario Platform
# Tests the complete user flow from frontend to backend

set -e

API_URL="http://localhost:3000/api"
FRONTEND_URL="http://localhost:3001"

echo "========================================"
echo "   LEMMARIO E2E TEST SUITE"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_count=0
passed=0
failed=0

run_test() {
    test_count=$((test_count + 1))
    echo -n "[$test_count] $1 ... "
}

pass() {
    passed=$((passed + 1))
    echo -e "${GREEN}✓ PASS${NC}"
}

fail() {
    failed=$((failed + 1))
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Error: $1"
}

echo "=== Backend API Tests ==="
echo ""

# Test 1: Check API health
run_test "Backend API responds"
if curl -sf "$API_URL/lemmari" > /dev/null; then
    pass
else
    fail "API not responding"
fi

# Test 2: Get lemmari list
run_test "GET /api/lemmari returns data"
response=$(curl -s "$API_URL/lemmari")
if echo "$response" | jq -e '.docs' > /dev/null 2>&1; then
    pass
else
    fail "Invalid JSON response"
fi

# Test 3: Get specific lemmario
run_test "GET /api/lemmari/{id} returns lemmario"
response=$(curl -s "$API_URL/lemmari/2")
if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
    pass
else
    fail "Lemmario not found"
fi

# Test 4: Get lemmi list
run_test "GET /api/lemmi returns list"
response=$(curl -s "$API_URL/lemmi")
if echo "$response" | jq -e '.docs' > /dev/null 2>&1; then
    pass
else
    fail "Invalid response structure"
fi

# Test 5: Get fonti
run_test "GET /api/fonti returns list"
response=$(curl -s "$API_URL/fonti")
if echo "$response" | jq -e '.docs' > /dev/null 2>&1; then
    pass
else
    fail "Invalid response structure"
fi

echo ""
echo "=== Frontend Tests ==="
echo ""

# Test 6: Homepage loads
run_test "Frontend homepage loads"
if curl -sf "$FRONTEND_URL/" | grep -q "Lemmario"; then
    pass
else
    fail "Homepage not loading correctly"
fi

# Test 7: Homepage title
run_test "Homepage has correct title"
if curl -s "$FRONTEND_URL/" | grep -q "Dizionario Storico della Matematica Italiana"; then
    pass
else
    fail "Title not found"
fi

# Test 8: Lemmi page loads
run_test "Lemmi page accessible"
if curl -sf "$FRONTEND_URL/lemmi" > /dev/null; then
    pass
else
    fail "Lemmi page not accessible"
fi

# Test 9: Search page loads
run_test "Search page accessible"
if curl -sf "$FRONTEND_URL/ricerca" > /dev/null; then
    pass
else
    fail "Search page not accessible"
fi

# Test 10: Frontend connects to backend
run_test "Frontend fetches data from backend"
if curl -s "$FRONTEND_URL/" | grep -q "Dizionario di Test"; then
    pass
else
    fail "Frontend not displaying backend data"
fi

echo ""
echo "========================================"
echo "           TEST RESULTS"
echo "========================================"
echo "Total: $test_count"
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo "========================================"

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
