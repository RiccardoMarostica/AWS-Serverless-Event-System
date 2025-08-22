#!/usr/bin/env node

/**
 * Cross-browser test runner for Angular SNS Frontend
 * Runs E2E tests across multiple browsers and generates reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const browsers = ['chrome', 'firefox', 'edge'];
const testSuites = [
  'subscription-workflow.cy.ts',
  'responsive-design.cy.ts',
  'cross-browser-compatibility.cy.ts',
  'backend-integration.cy.ts',
  'comprehensive-integration.cy.ts'
];

const resultsDir = path.join(__dirname, '..', 'results');
const reportsDir = path.join(__dirname, '..', 'reports');

// Ensure directories exist
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

async function runTestsForBrowser(browser) {
  console.log(`\n🚀 Running tests in ${browser.toUpperCase()}...`);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(reportsDir, `${browser}-${timestamp}.json`);
  
  try {
    const command = `npx cypress run --browser ${browser} --reporter json --reporter-options "reporterEnabled=json,reportDir=${reportsDir},reportFilename=${browser}-results"`;
    
    console.log(`Executing: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..')
    });
    
    console.log(`✅ ${browser} tests completed successfully`);
    return { browser, status: 'passed', reportFile };
    
  } catch (error) {
    console.error(`❌ ${browser} tests failed:`, error.message);
    return { browser, status: 'failed', error: error.message };
  }
}

async function runAllTests() {
  console.log('🧪 Starting cross-browser E2E tests...');
  console.log(`Testing browsers: ${browsers.join(', ')}`);
  console.log(`Test suites: ${testSuites.length} suites`);
  
  const results = [];
  
  for (const browser of browsers) {
    const result = await runTestsForBrowser(browser);
    results.push(result);
  }
  
  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    totalBrowsers: browsers.length,
    passedBrowsers: results.filter(r => r.status === 'passed').length,
    failedBrowsers: results.filter(r => r.status === 'failed').length,
    results: results
  };
  
  const summaryFile = path.join(reportsDir, `cross-browser-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Cross-browser test summary:');
  console.log(`✅ Passed: ${summary.passedBrowsers}/${summary.totalBrowsers} browsers`);
  console.log(`❌ Failed: ${summary.failedBrowsers}/${summary.totalBrowsers} browsers`);
  
  results.forEach(result => {
    const status = result.status === 'passed' ? '✅' : '❌';
    console.log(`${status} ${result.browser}: ${result.status}`);
  });
  
  console.log(`\n📄 Summary report: ${summaryFile}`);
  
  // Exit with error code if any tests failed
  if (summary.failedBrowsers > 0) {
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Cross-browser E2E Test Runner

Usage:
  node run-cross-browser-tests.js [options]

Options:
  --help, -h     Show this help message
  --browser, -b  Run tests for specific browser only (chrome, firefox, edge)
  --spec, -s     Run specific test spec only

Examples:
  node run-cross-browser-tests.js
  node run-cross-browser-tests.js --browser chrome
  node run-cross-browser-tests.js --spec subscription-workflow.cy.ts
  `);
  process.exit(0);
}

// Run specific browser if specified
const browserArg = args.find(arg => arg.startsWith('--browser=')) || args[args.indexOf('--browser') + 1] || args[args.indexOf('-b') + 1];
if (browserArg && browserArg !== '--browser' && browserArg !== '-b') {
  const browser = browserArg.replace('--browser=', '');
  if (browsers.includes(browser)) {
    runTestsForBrowser(browser).then(() => process.exit(0));
  } else {
    console.error(`❌ Unsupported browser: ${browser}`);
    console.error(`Supported browsers: ${browsers.join(', ')}`);
    process.exit(1);
  }
} else {
  // Run all browsers
  runAllTests();
}