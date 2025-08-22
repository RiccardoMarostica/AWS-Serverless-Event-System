#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Performance Testing Suite...\n');

// Performance test configuration
const config = {
  buildTimeout: 120000, // 2 minutes
  testTimeout: 300000,  // 5 minutes
  performanceThresholds: {
    loadTime: 3000,      // 3 seconds
    bundleSize: 500,     // 500KB
    memoryUsage: 100     // 100MB
  }
};

async function runPerformanceTests() {
  try {
    console.log('📦 Building production bundle...');
    const buildStart = Date.now();
    
    // Build production version
    execSync('npm run build:prod', { 
      stdio: 'inherit',
      timeout: config.buildTimeout 
    });
    
    const buildTime = Date.now() - buildStart;
    console.log(`✅ Build completed in ${buildTime}ms\n`);
    
    // Analyze bundle size
    console.log('📊 Analyzing bundle size...');
    analyzeBundleSize();
    
    // Run performance tests
    console.log('🧪 Running performance tests...');
    execSync('npm run e2e:headless -- --spec "cypress/e2e/performance-testing.cy.ts"', {
      stdio: 'inherit',
      timeout: config.testTimeout
    });
    
    console.log('✅ Performance tests completed successfully!');
    
    // Generate performance report
    generatePerformanceReport();
    
  } catch (error) {
    console.error('❌ Performance tests failed:', error.message);
    process.exit(1);
  }
}

function analyzeBundleSize() {
  const distPath = path.join(__dirname, '../dist/angular-sns-frontend/browser');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build output not found. Run build first.');
    return;
  }
  
  const files = fs.readdirSync(distPath);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  let totalSize = 0;
  const fileSizes = [];
  
  jsFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    totalSize += sizeKB;
    
    fileSizes.push({
      name: file,
      size: sizeKB
    });
  });
  
  console.log('Bundle Analysis:');
  console.log(`Total JS Size: ${totalSize.toFixed(2)}KB`);
  
  fileSizes.sort((a, b) => b.size - a.size);
  fileSizes.forEach(file => {
    console.log(`  ${file.name}: ${file.size.toFixed(2)}KB`);
  });
  
  // Check against threshold
  if (totalSize > config.performanceThresholds.bundleSize) {
    console.warn(`⚠️  Bundle size (${totalSize.toFixed(2)}KB) exceeds threshold (${config.performanceThresholds.bundleSize}KB)`);
  } else {
    console.log(`✅ Bundle size within threshold`);
  }
  
  console.log('');
}

function generatePerformanceReport() {
  const report = {
    timestamp: new Date().toISOString(),
    buildInfo: {
      nodeVersion: process.version,
      platform: process.platform
    },
    thresholds: config.performanceThresholds,
    status: 'completed'
  };
  
  const reportPath = path.join(__dirname, '../performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Performance report generated: ${reportPath}`);
}

// Run the performance tests
runPerformanceTests();