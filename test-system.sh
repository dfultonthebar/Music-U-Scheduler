
#!/bin/bash

# Music-U-Scheduler System Test Script
# This script tests the current installation to ensure everything works

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_header() {
    echo -e "${YELLOW}"
    echo "=================================================="
    echo "     🧪 Music-U-Scheduler System Test"
    echo "=================================================="
    echo -e "${NC}"
}

# Test 1: Check if Next.js app builds successfully
test_build() {
    print_status "Testing Next.js build..."
    cd /home/ubuntu/music-u-scheduler-frontend/app
    
    if yarn build > /tmp/build.log 2>&1; then
        print_success "Next.js build successful"
    else
        print_error "Next.js build failed"
        echo "Build log:"
        cat /tmp/build.log
        return 1
    fi
}

# Test 2: Check if the app starts without errors
test_start() {
    print_status "Testing application startup..."
    cd /home/ubuntu/music-u-scheduler-frontend/app
    
    # Start the app in the background
    yarn dev > /tmp/start.log 2>&1 &
    APP_PID=$!
    
    # Wait for startup
    sleep 10
    
    # Check if app is responding
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Application starts successfully"
        kill $APP_PID 2>/dev/null || true
    else
        print_error "Application failed to start"
        echo "Start log:"
        cat /tmp/start.log
        kill $APP_PID 2>/dev/null || true
        return 1
    fi
}

# Test 3: Check authentication endpoints
test_auth() {
    print_status "Testing authentication endpoints..."
    cd /home/ubuntu/music-u-scheduler-frontend/app
    
    # Start the app
    yarn dev > /tmp/auth_test.log 2>&1 &
    APP_PID=$!
    sleep 10
    
    # Test login endpoint
    if curl -s -X POST http://localhost:3000/api/auth/login \
       -F "email=admin@musicu.com" \
       -F "password=MusicU2025" > /dev/null; then
        print_success "Authentication endpoints working"
    else
        print_error "Authentication endpoints failed"
    fi
    
    # Test session endpoint
    if curl -s http://localhost:3000/api/auth/session > /dev/null; then
        print_success "Session endpoint working"
    else
        print_error "Session endpoint failed"
    fi
    
    kill $APP_PID 2>/dev/null || true
}

# Test 4: Check admin dashboard access
test_admin() {
    print_status "Testing admin dashboard..."
    cd /home/ubuntu/music-u-scheduler-frontend/app
    
    # Start the app
    yarn dev > /tmp/admin_test.log 2>&1 &
    APP_PID=$!
    sleep 10
    
    # Check admin page loads
    if curl -s http://localhost:3000/admin > /dev/null; then
        print_success "Admin dashboard accessible"
    else
        print_error "Admin dashboard not accessible"
    fi
    
    kill $APP_PID 2>/dev/null || true
}

# Test 5: Check if all required files exist
test_files() {
    print_status "Testing required files..."
    
    REQUIRED_FILES=(
        "/home/ubuntu/music-u-scheduler-frontend/app/package.json"
        "/home/ubuntu/music-u-scheduler-frontend/app/next.config.js"
        "/home/ubuntu/music-u-scheduler-frontend/app/app/layout.tsx"
        "/home/ubuntu/music-u-scheduler-frontend/app/app/page.tsx"
        "/home/ubuntu/music-u-scheduler-frontend/app/app/login/page.tsx"
        "/home/ubuntu/music-u-scheduler-frontend/app/app/admin/page.tsx"
        "/home/ubuntu/music-u-scheduler-frontend/app/hooks/useAuth.ts"
        "/home/ubuntu/music-u-scheduler-frontend/FRESH_INSTALL_GUIDE.md"
        "/home/ubuntu/music-u-scheduler-frontend/quick-install.sh"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            print_success "Found: $(basename $file)"
        else
            print_error "Missing: $file"
            return 1
        fi
    done
}

# Test 6: Check TypeScript compilation
test_typescript() {
    print_status "Testing TypeScript compilation..."
    cd /home/ubuntu/music-u-scheduler-frontend/app
    
    if yarn tsc --noEmit > /tmp/tsc.log 2>&1; then
        print_success "TypeScript compilation successful"
    else
        print_error "TypeScript compilation failed"
        echo "TypeScript errors:"
        cat /tmp/tsc.log
        return 1
    fi
}

# Main test runner
main() {
    print_header
    
    TEST_COUNT=0
    PASS_COUNT=0
    
    # Run all tests
    TESTS=(
        "test_files"
        "test_typescript"
        "test_build"
        "test_start"
        "test_auth"
        "test_admin"
    )
    
    for test in "${TESTS[@]}"; do
        TEST_COUNT=$((TEST_COUNT + 1))
        if $test; then
            PASS_COUNT=$((PASS_COUNT + 1))
        fi
        echo
    done
    
    # Summary
    echo -e "${YELLOW}=================================================="
    echo "                Test Summary"
    echo -e "==================================================${NC}"
    echo -e "Total Tests: ${TEST_COUNT}"
    echo -e "Passed: ${GREEN}${PASS_COUNT}${NC}"
    echo -e "Failed: ${RED}$((TEST_COUNT - PASS_COUNT))${NC}"
    
    if [ $PASS_COUNT -eq $TEST_COUNT ]; then
        echo -e "\n${GREEN}🎉 All tests passed! System is ready for deployment.${NC}"
        echo -e "\n${BLUE}Next steps:${NC}"
        echo "1. Follow GITHUB_CLEANUP_INSTRUCTIONS.md to update repository"
        echo "2. Test the quick-install.sh script on a fresh system"
        echo "3. Create GitHub release with the new installer"
        return 0
    else
        echo -e "\n${RED}❌ Some tests failed. Please fix issues before proceeding.${NC}"
        return 1
    fi
}

# Cleanup function
cleanup() {
    # Kill any remaining processes
    pkill -f "yarn dev" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    
    # Remove temp files
    rm -f /tmp/{build,start,auth_test,admin_test,tsc}.log
}

trap cleanup EXIT

# Run tests
main "$@"
