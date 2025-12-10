# Quick Test Guide - Travel Agency Website

## Prerequisites

Navigate to the source directory:
```bash
cd /Volumes/workplace/AWSDeployAgentScripts/repos/travel-agency-website/src
```

## Option 1: Run with Quickstart (Recommended for Testing)

### Step 1: Build and Start Application
```bash
npm run quickstart
```

This will:
- Initialize SQLite database
- Seed test data
- Start the server on `http://localhost:3000`
- First page visit may take a few minutes for data seeding

**Note**: For subsequent runs, use `npm run quickstart:run` to avoid recreating the database.

### Step 2: Run Tests (in a new terminal)
```bash
cd /Volumes/workplace/AWSDeployAgentScripts/repos/travel-agency-website/src

# Run all e2e tests
npm run test:e2e

# Or run all tests (includes e2e and other tests)
npm test
```

## Option 2: Run Individual Test Suites

```bash
# Authentication flow tests (5 tests)
npm run apptests -- -t "e2e: Authentication Flow"

# Flight booking tests (5 tests)
npm run apptests -- -t "e2e: Flight Search and Booking"

# Stay booking tests (6 tests)
npm run apptests -- -t "e2e: Stay Search and Booking"

# User account tests (7 tests)
npm run apptests -- -t "e2e: User Account Management"

# Theme and i18n tests (8 tests)
npm run apptests -- -t "e2e: Theme Switching and Internationalization"

# Existing auth tests
npm run apptests -- -t "e2e: auth"

# Existing cache tests
npm run apptests -- -t "e2e: page cache"
```

## Test Files Overview

### New Test Files (31 tests total):
1. **auth-flows.e2e.spec.ts** - Signup, login, logout, password recovery
2. **flight-booking.e2e.spec.ts** - Flight search, filters, details, booking
3. **stay-booking.e2e.spec.ts** - Hotel search, filters, reviews, booking
4. **user-account.e2e.spec.ts** - Profile, history, favorites, settings
5. **theme-i18n.e2e.spec.ts** - Dark/light theme, multi-language support

### Existing Test Files:
- **auth.e2e.spec.ts** - Comprehensive auth with locale handling
- **og-screenshots.spec.ts** - OpenGraph image generation
- **page-cache-cleaner.e2e.spec.ts** - Cache management

## Expected Test Behavior

### Successful Test Run Indicators:
- ✅ Browser launches in headless mode
- ✅ Each test navigates through pages
- ✅ Screenshots are saved for verification
- ✅ Tests complete without timeout errors

### Common Issues and Solutions:

#### Issue: "ECONNREFUSED" or connection errors
**Solution**: Ensure application is running on port 3000
```bash
# Check if server is running
curl http://localhost:3000
```

#### Issue: Database not found errors
**Solution**: Run quickstart to initialize database
```bash
npm run quickstart
```

#### Issue: Tests timeout
**Solution**: First page visit needs time for data seeding
- Wait for application to fully initialize
- Try `npm run quickstart:run` if database already exists

#### Issue: Port 3000 already in use
**Solution**: Kill existing process or use different port
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Viewing Test Results

### Screenshots
Tests generate screenshots in the screenshot directory for:
- Visual verification
- Debugging failures
- Documentation

Screenshots are named descriptively:
- `auth-flow-*.png`
- `flight-*.png`
- `stay-*.png`
- `account-*.png`
- `theme-*.png`
- `i18n-*.png`

### Logs
Tests include comprehensive logging:
- Test execution progress
- Page navigation
- Form interactions
- Element visibility checks

## Development Mode (Advanced)

For full features including real databases and external services:

### Setup Requirements:
1. MariaDB database (v10.6.18)
2. SMTP server for emails
3. OAuth provider credentials (GitHub, Google)
4. reCAPTCHA v3 keys
5. Maps API key (Yandex Maps)

### Run in Development Mode:
```bash
# One-time setup
npm run prisma:generate-migration-scripts --workspace=@golobe-demo/backend
npm run prisma:migrate-reset --workspace=@golobe-demo/backend
npm run prisma:generate-client --workspace=@golobe-demo/backend

# Start dev server
npm run dev
```

See main README.md for detailed development setup instructions.

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example CI configuration
- name: Install dependencies
  run: cd src && npm install

- name: Build application
  run: cd src && npm run quickstart:build

- name: Start application
  run: cd src && npm run quickstart:run &

- name: Wait for server
  run: sleep 30

- name: Run tests
  run: cd src && npm run test:e2e

- name: Archive screenshots
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-screenshots
    path: src/screenshots/
```

## Test Configuration

All tests use:
- **Browser**: Chromium (headless)
- **Viewport**: 1280x720px
- **Timeout**: 120 seconds per test
- **Execution**: Sequential (not parallel)
- **Retry**: 0 (no automatic retries)

## Quick Verification

After running tests, verify success by checking:

1. **Exit code**: Should be 0
```bash
echo $?  # Should output 0
```

2. **Test summary**: Look for passing tests
```
✓ Complete Signup Flow - New User Registration
✓ Login Flow - Credentials Provider
✓ Flight Search Page - Load and Display
...
```

3. **Screenshots**: Check for generated PNG files

## Troubleshooting

### Enable verbose logging:
```bash
DEBUG=* npm run test:e2e
```

### Run single test for debugging:
```bash
npm run apptests -- -t "Login Flow - Credentials Provider"
```

### Keep browser open (disable headless):
Edit test file and change:
```typescript
headless: false  // in browser launch options
```

### Increase timeout:
Tests already have 120s timeout, but can be increased:
```typescript
const TestTimeout = 180000; // 3 minutes
```

## Performance Notes

- First test run: ~2-5 minutes (includes server startup and seeding)
- Subsequent test runs: ~1-2 minutes (if server already running)
- Individual test: ~10-30 seconds each
- Total suite: ~15-30 minutes for all tests

## Support

For issues with:
- **Test failures**: Check application logs and screenshots
- **Setup problems**: See main README.md in project root
- **Feature questions**: Review test code for implementation details

---

**Quick Start Command Summary:**
```bash
# Terminal 1: Start app
cd /Volumes/workplace/AWSDeployAgentScripts/repos/travel-agency-website/src
npm run quickstart

# Terminal 2: Run tests (wait for app to start)
cd /Volumes/workplace/AWSDeployAgentScripts/repos/travel-agency-website/src
npm run test:e2e
```

That's it! The tests will run and provide comprehensive coverage of the application.
