#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Final Integration Testing...\n');

class IntegrationTester {
  constructor() {
    this.testResults = {
      performance: false,
      security: false,
      production: false,
      e2e: false
    };
    this.serverProcess = null;
  }

  async runAllTests() {
    try {
      console.log('📦 Building production application...');
      await this.buildProduction();

      console.log('🚀 Starting test server...');
      await this.startTestServer();

      console.log('⚡ Running performance tests...');
      this.testResults.performance = await this.runPerformanceTests();

      console.log('🔒 Running security verification...');
      this.testResults.security = await this.runSecurityTests();

      console.log('🌐 Running production integration tests...');
      this.testResults.production = await this.runProductionTests();

      console.log('🔄 Running comprehensive E2E tests...');
      this.testResults.e2e = await this.runE2ETests();

      this.generateFinalReport();

    } catch (error) {
      console.error('❌ Integration testing failed:', error.message);
      this.cleanup();
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  async buildProduction() {
    try {
      execSync('npm run build:prod', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: 120000 
      });
      console.log('✅ Production build completed\n');
    } catch (error) {
      throw new Error('Production build failed');
    }
  }

  async startTestServer() {
    return new Promise((resolve, reject) => {
      // Start a simple HTTP server for testing
      this.serverProcess = spawn('npx', ['http-server', 'dist/angular-sns-frontend/browser', '-p', '4200', '-c-1'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Test server failed to start'));
        }
      }, 30000);

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Available on:') || output.includes('Hit CTRL-C')) {
          if (!serverReady) {
            serverReady = true;
            clearTimeout(timeout);
            console.log('✅ Test server started on http://localhost:4200\n');
            // Wait a bit for server to be fully ready
            setTimeout(resolve, 2000);
          }
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });
    });
  }

  async runPerformanceTests() {
    try {
      console.log('  📊 Running performance analysis...');
      execSync('node scripts/performance-test.js', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: 300000
      });
      
      console.log('  🏃 Running Cypress performance tests...');
      execSync('npx cypress run --spec "cypress/e2e/performance-testing.cy.ts" --headless', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: 300000,
        env: { ...process.env, CYPRESS_baseUrl: 'http://localhost:4200' }
      });
      
      console.log('✅ Performance tests passed\n');
      return true;
    } catch (error) {
      console.error('❌ Performance tests failed\n');
      return false;
    }
  }

  async runSecurityTests() {
    try {
      console.log('  🔍 Running security verification...');
      execSync('node scripts/security-verification.js', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: 60000
      });
      
      console.log('✅ Security verification passed\n');
      return true;
    } catch (error) {
      console.error('❌ Security verification failed\n');
      return false;
    }
  }

  async runProductionTests() {
    try {
      console.log('  🌐 Running production integration tests...');
      execSync('npx cypress run --spec "cypress/e2e/production-integration.cy.ts" --headless', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: 300000,
        env: { 
          ...process.env, 
          CYPRESS_baseUrl: 'http://localhost:4200',
          CYPRESS_PRODUCTION_URL: 'http://localhost:4200'
        }
      });
      
      console.log('✅ Production integration tests passed\n');
      return true;
    } catch (error) {
      console.error('❌ Production integration tests failed\n');
      return false;
    }
  }

  async runE2ETests() {
    try {
      console.log('  🔄 Running comprehensive E2E tests...');
      execSync('npx cypress run --headless', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: 600000,
        env: { ...process.env, CYPRESS_baseUrl: 'http://localhost:4200' }
      });
      
      console.log('✅ E2E tests passed\n');
      return true;
    } catch (error) {
      console.error('❌ E2E tests failed\n');
      return false;
    }
  }

  generateFinalReport() {
    console.log('📋 Final Integration Test Report');
    console.log('================================\n');

    const results = [
      { name: 'Performance Tests', passed: this.testResults.performance },
      { name: 'Security Verification', passed: this.testResults.security },
      { name: 'Production Integration', passed: this.testResults.production },
      { name: 'E2E Tests', passed: this.testResults.e2e }
    ];

    results.forEach(result => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} - ${result.name}`);
    });

    const allPassed = results.every(result => result.passed);
    const passedCount = results.filter(result => result.passed).length;

    console.log(`\nOverall: ${passedCount}/${results.length} test suites passed`);

    if (allPassed) {
      console.log('\n🎉 All integration tests passed successfully!');
      console.log('✅ Application is ready for production deployment.');
    } else {
      console.log('\n🚨 Some integration tests failed.');
      console.log('❌ Please address the failing tests before deployment.');
    }

    // Generate detailed report file
    const report = {
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: {
        total: results.length,
        passed: passedCount,
        failed: results.length - passedCount,
        success: allPassed
      },
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, '../integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    if (!allPassed) {
      process.exit(1);
    }
  }

  generateRecommendations() {
    const recommendations = [];

    if (!this.testResults.performance) {
      recommendations.push('Review performance optimizations and bundle size');
      recommendations.push('Check Core Web Vitals metrics');
    }

    if (!this.testResults.security) {
      recommendations.push('Address security configuration issues');
      recommendations.push('Verify HTTPS enforcement and CSP headers');
    }

    if (!this.testResults.production) {
      recommendations.push('Fix production environment integration issues');
      recommendations.push('Verify API connectivity and error handling');
    }

    if (!this.testResults.e2e) {
      recommendations.push('Fix end-to-end functionality issues');
      recommendations.push('Verify user workflows and form submissions');
    }

    return recommendations;
  }

  cleanup() {
    if (this.serverProcess) {
      console.log('🧹 Cleaning up test server...');
      this.serverProcess.kill('SIGTERM');
      
      // Force kill if it doesn't terminate gracefully
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          this.serverProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Integration testing interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Integration testing terminated');
  process.exit(1);
});

// Run integration tests
const tester = new IntegrationTester();
tester.runAllTests();