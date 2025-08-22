#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Asset optimization script for production builds
 * This script performs additional optimizations after the Angular build
 */

const DIST_DIR = path.join(__dirname, '..', 'dist', 'angular-sns-frontend');
const BROWSER_DIR = path.join(DIST_DIR, 'browser');

console.log('🚀 Starting asset optimization...');

/**
 * Add security headers to index.html
 */
function addSecurityHeaders() {
  const indexPath = path.join(BROWSER_DIR, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️  index.html not found, skipping security headers');
    return;
  }

  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add meta tags for security
  const securityMetas = `
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta http-equiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()">`;

  // Insert security headers after charset meta tag
  indexContent = indexContent.replace(
    /<meta charset="utf-8">/,
    `<meta charset="utf-8">${securityMetas}`
  );

  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Security headers added to index.html');
}

/**
 * Create a simple asset manifest for cache busting
 */
function createAssetManifest() {
  const manifestPath = path.join(BROWSER_DIR, 'asset-manifest.json');
  const assets = {};

  function scanDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath, `${prefix}${file}/`);
      } else if (file.endsWith('.js') || file.endsWith('.css')) {
        const relativePath = `${prefix}${file}`;
        assets[relativePath] = {
          size: stat.size,
          modified: stat.mtime.toISOString()
        };
      }
    });
  }

  if (fs.existsSync(BROWSER_DIR)) {
    scanDirectory(BROWSER_DIR);
    fs.writeFileSync(manifestPath, JSON.stringify(assets, null, 2));
    console.log('✅ Asset manifest created');
  }
}

/**
 * Validate build output
 */
function validateBuild() {
  const requiredFiles = ['index.html', 'main.js', 'styles.css'];
  const missingFiles = [];

  requiredFiles.forEach(file => {
    const files = fs.readdirSync(BROWSER_DIR);
    const found = files.some(f => f.startsWith(file.split('.')[0]));
    
    if (!found) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:', missingFiles);
    process.exit(1);
  }

  console.log('✅ Build validation passed');
}

/**
 * Generate build info
 */
function generateBuildInfo() {
  const buildInfo = {
    buildTime: new Date().toISOString(),
    version: require('../package.json').version,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production'
  };

  const buildInfoPath = path.join(BROWSER_DIR, 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  console.log('✅ Build info generated');
}

// Main execution
try {
  if (!fs.existsSync(BROWSER_DIR)) {
    console.error('❌ Build directory not found. Run ng build first.');
    process.exit(1);
  }

  addSecurityHeaders();
  createAssetManifest();
  validateBuild();
  generateBuildInfo();

  console.log('🎉 Asset optimization completed successfully!');
} catch (error) {
  console.error('❌ Asset optimization failed:', error.message);
  process.exit(1);
}