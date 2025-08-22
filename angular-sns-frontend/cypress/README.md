# E2E Testing Documentation

This directory contains comprehensive end-to-end (E2E) tests for the Angular SNS Frontend application using Cypress.

## Test Coverage

Our E2E test suite covers all requirements specified in task 13:

### 1. Complete Subscription Workflow Tests (`subscription-workflow.cy.ts`)
- ✅ Form display and initial state
- ✅ Successful email subscription flow
- ✅ Form validation (empty fields, invalid formats)
- ✅ Real-time validation feedback
- ✅ Loading states and user feedback
- ✅ Success message display and form reset
- ✅ Multiple subscription workflow

### 2. Form Validation and Error Scenarios (`subscription-workflow.cy.ts`)
- ✅ Empty email validation
- ✅ Invalid email format validation
- ✅ Real-time validation feedback
- ✅ Validation error messages and suggestions
- ✅ Form submission prevention with invalid data

### 3. Responsive Design Functionality (`responsive-design.cy.ts`)
- ✅ Mobile portrait and landscape layouts
- ✅ Tablet portrait and landscape layouts
- ✅ Desktop small and large screen layouts
- ✅ Touch target sizing for mobile devices
- ✅ Text scaling and readability
- ✅ Layout stability during state changes
- ✅ Orientation change handling

### 4. Cross-Browser Compatibility (`cross-browser-compatibility.cy.ts`)
- ✅ Core functionality across browsers
- ✅ HTML5 features compatibility
- ✅ CSS Grid and Flexbox support
- ✅ JavaScript API compatibility
- ✅ Network and HTTP handling
- ✅ Security features compliance
- ✅ Performance consistency
- ✅ Accessibility features

### 5. Backend API Integration (`backend-integration.cy.ts`)
- ✅ Subscription endpoint integration
- ✅ API authentication handling
- ✅ Rate limiting scenarios
- ✅ Duplicate subscription handling
- ✅ CORS configuration testing
- ✅ Network resilience testing
- ✅ Data validation integration
- ✅ Error recovery scenarios

### 6. Comprehensive Integration (`comprehensive-integration.cy.ts`)
- ✅ End-to-end user journeys
- ✅ Multi-device user experience
- ✅ Accessibility compliance
- ✅ Performance under load
- ✅ Security and data protection
- ✅ Real-world scenarios
- ✅ Edge cases and error boundaries

## Requirements Coverage

### Requirement 1.1: Application Loading and Display
- ✅ Tests verify application loads within 3 seconds
- ✅ Tests check responsive design on desktop, tablet, and mobile
- ✅ Tests validate subscription form display

### Requirement 2.2: Email Validation and Submission
- ✅ Tests verify real-time email validation
- ✅ Tests check form submission with valid/invalid emails
- ✅ Tests validate error prevention for invalid data

### Requirement 3.5: User Feedback and Error Handling
- ✅ Tests verify loading indicators during processing
- ✅ Tests check success/error message display
- ✅ Tests validate retry functionality for network errors

### Requirement 6.4: Error Handling and Recovery
- ✅ Tests verify graceful error handling
- ✅ Tests check network error recovery
- ✅ Tests validate user-friendly error messages

## Running the Tests

### Prerequisites
1. Node.js 18+ installed
2. Angular application built and running
3. Cypress installed (automatically installed with `npm install`)

### Quick Start
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the development server
npm start

# In another terminal, run E2E tests
npm run e2e:headless
```

### Available Test Commands

```bash
# Open Cypress Test Runner (interactive mode)
npm run e2e

# Run all tests headlessly
npm run e2e:headless

# Run tests in specific browsers
npm run e2e:chrome
npm run e2e:firefox
npm run e2e:edge

# Run specific test file
npx cypress run --spec "cypress/e2e/subscription-workflow.cy.ts"

# Run tests with custom configuration
npx cypress run --config baseUrl=http://localhost:4200
```

### Cross-Browser Testing

Run the comprehensive cross-browser test suite:

```bash
# Run cross-browser tests with custom script
node cypress/scripts/run-cross-browser-tests.js

# Run for specific browser only
node cypress/scripts/run-cross-browser-tests.js --browser chrome

# Run specific test spec
node cypress/scripts/run-cross-browser-tests.js --spec subscription-workflow.cy.ts
```

## Test Configuration

### Environment Variables
Set these environment variables for different testing scenarios:

```bash
# API Configuration
CYPRESS_apiUrl=http://localhost:3000/dev
CYPRESS_apiKey=dev-api-key

# Application URL
CYPRESS_baseUrl=http://localhost:4200

# Test Environment
CYPRESS_environment=development
```

### Cypress Configuration
The main configuration is in `cypress.config.ts`:

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    // ... other settings
  }
});
```

## Test Data and Fixtures

Test data is stored in `cypress/fixtures/test-data.json`:
- Valid and invalid email addresses
- API response mocks
- Viewport configurations
- Network condition simulations

## Custom Commands

We've created custom Cypress commands for common operations:

```typescript
// Submit subscription form
cy.submitSubscription('test@example.com', true);

// Check form validation
cy.checkFormValidation('invalid-email', false);

// Wait for application to load
cy.waitForApp();

// Test responsive behavior
cy.testResponsive({ width: 375, height: 667 });

// Simulate network conditions
cy.simulateNetworkCondition('slow');

// Check accessibility
cy.checkAccessibility();
```

## CI/CD Integration

### GitHub Actions
The `.github/workflows/e2e-tests.yml` file provides:
- Cross-browser testing on multiple Node.js versions
- Performance testing with Lighthouse
- Accessibility testing with axe-core
- Test result artifacts and reporting

### Running in CI
```bash
# Install dependencies
npm ci

# Build application
npm run build:prod

# Start application server
npm start &

# Wait for server to be ready
timeout 60 bash -c 'until curl -f http://localhost:4200; do sleep 2; done'

# Run E2E tests
npm run e2e:headless
```

## Test Reports and Artifacts

### Generated Artifacts
- **Screenshots**: Captured on test failures
- **Videos**: Full test execution recordings
- **Reports**: JSON and HTML test reports
- **Coverage**: Code coverage reports (if configured)

### Report Locations
- Screenshots: `cypress/screenshots/`
- Videos: `cypress/videos/`
- Reports: `cypress/reports/`
- Results: `cypress/results/`

## Debugging Tests

### Interactive Mode
```bash
# Open Cypress Test Runner for debugging
npm run e2e
```

### Debug Commands
```bash
# Run with debug output
DEBUG=cypress:* npm run e2e:headless

# Run specific test with browser console
npx cypress run --spec "cypress/e2e/subscription-workflow.cy.ts" --headed --no-exit
```

### Common Debugging Tips
1. Use `cy.pause()` to pause test execution
2. Use `cy.debug()` to debug specific elements
3. Check browser console for JavaScript errors
4. Verify network requests in browser dev tools
5. Use `cy.screenshot()` to capture specific moments

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent and isolated
- Use beforeEach for common setup

### Test Data Management
- Use fixtures for test data
- Avoid hardcoded values
- Use data-cy attributes for element selection
- Mock API responses consistently

### Assertions
- Use specific assertions (not just existence)
- Test user-visible behavior
- Verify error states and edge cases
- Check accessibility attributes

### Performance
- Use appropriate timeouts
- Avoid unnecessary waits
- Clean up after tests
- Use efficient selectors

## Troubleshooting

### Common Issues

1. **Application not loading**
   - Verify server is running on correct port
   - Check baseUrl configuration
   - Ensure build is successful

2. **Tests timing out**
   - Increase command timeout in config
   - Check for network issues
   - Verify API endpoints are accessible

3. **Element not found**
   - Check element selectors
   - Verify timing of element appearance
   - Use proper wait conditions

4. **Cross-browser failures**
   - Check browser-specific CSS/JS issues
   - Verify feature support
   - Update browser versions

### Getting Help
- Check Cypress documentation: https://docs.cypress.io
- Review test logs and screenshots
- Use browser developer tools
- Check GitHub issues for known problems

## Contributing

When adding new tests:
1. Follow existing test patterns
2. Add appropriate documentation
3. Update this README if needed
4. Ensure tests pass in all browsers
5. Add test data to fixtures if needed

## Test Maintenance

Regular maintenance tasks:
- Update Cypress version
- Review and update test data
- Check for deprecated APIs
- Optimize slow tests
- Update browser versions
- Review test coverage