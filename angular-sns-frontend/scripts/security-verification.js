#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Security Verification...\n');

class SecurityVerifier {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  addIssue(category, message) {
    this.issues.push({ category, message });
  }

  addWarning(category, message) {
    this.warnings.push({ category, message });
  }

  addPassed(category, message) {
    this.passed.push({ category, message });
  }

  verifyEnvironmentSecurity() {
    console.log('🔍 Verifying environment security...');
    
    // Check production environment configuration
    const prodEnvPath = path.join(__dirname, '../src/environments/environment.prod.ts');
    if (fs.existsSync(prodEnvPath)) {
      const prodEnv = fs.readFileSync(prodEnvPath, 'utf8');
      
      // Check HTTPS enforcement
      if (prodEnv.includes('enforceHttps: true')) {
        this.addPassed('HTTPS', 'HTTPS enforcement enabled in production');
      } else {
        this.addIssue('HTTPS', 'HTTPS enforcement not enabled in production environment');
      }
      
      // Check CSP enablement
      if (prodEnv.includes('enableCSP: true')) {
        this.addPassed('CSP', 'Content Security Policy enabled');
      } else {
        this.addIssue('CSP', 'Content Security Policy not enabled');
      }
      
      // Check input sanitization
      if (prodEnv.includes('sanitizeInputs: true')) {
        this.addPassed('Input Sanitization', 'Input sanitization enabled');
      } else {
        this.addIssue('Input Sanitization', 'Input sanitization not enabled');
      }
      
      // Check for hardcoded secrets
      if (prodEnv.includes('REPLACE_WITH_ACTUAL_API_KEY')) {
        this.addWarning('API Key', 'API key placeholder found - ensure proper replacement in deployment');
      } else if (prodEnv.includes('dev-api-key') || prodEnv.includes('test-key')) {
        this.addIssue('API Key', 'Development API key found in production environment');
      } else {
        this.addPassed('API Key', 'No obvious hardcoded API keys found');
      }
    } else {
      this.addIssue('Environment', 'Production environment file not found');
    }
  }

  verifySecurityServices() {
    console.log('🔍 Verifying security services...');
    
    // Check security service implementation
    const securityServicePath = path.join(__dirname, '../src/app/services/security.service.ts');
    if (fs.existsSync(securityServicePath)) {
      const securityService = fs.readFileSync(securityServicePath, 'utf8');
      
      // Check for HTTPS validation
      if (securityService.includes('isSecureEnvironment')) {
        this.addPassed('Security Service', 'Secure environment validation implemented');
      } else {
        this.addWarning('Security Service', 'Secure environment validation not found');
      }
      
      // Check for input sanitization methods
      if (securityService.includes('sanitize') || securityService.includes('clean')) {
        this.addPassed('Input Sanitization', 'Input sanitization methods found');
      } else {
        this.addWarning('Input Sanitization', 'Input sanitization methods not found in security service');
      }
    } else {
      this.addIssue('Security Service', 'Security service not found');
    }
    
    // Check sanitization service
    const sanitizationServicePath = path.join(__dirname, '../src/app/services/sanitization.service.ts');
    if (fs.existsSync(sanitizationServicePath)) {
      this.addPassed('Sanitization Service', 'Dedicated sanitization service found');
    } else {
      this.addWarning('Sanitization Service', 'Dedicated sanitization service not found');
    }
  }

  verifyHTTPSecurity() {
    console.log('🔍 Verifying HTTP security...');
    
    // Check API interceptor
    const interceptorPath = path.join(__dirname, '../src/app/interceptors/api-key.interceptor.ts');
    if (fs.existsSync(interceptorPath)) {
      const interceptor = fs.readFileSync(interceptorPath, 'utf8');
      
      // Check for API key handling
      if (interceptor.includes('X-API-Key') || interceptor.includes('Authorization')) {
        this.addPassed('API Security', 'API key/authorization header handling found');
      } else {
        this.addWarning('API Security', 'API key/authorization header handling not found');
      }
      
      // Check for secure header handling
      if (interceptor.includes('environment.apiKey')) {
        this.addPassed('API Key Management', 'Environment-based API key management found');
      } else {
        this.addWarning('API Key Management', 'Environment-based API key management not found');
      }
    } else {
      this.addIssue('HTTP Interceptor', 'API key interceptor not found');
    }
  }

  verifyFormSecurity() {
    console.log('🔍 Verifying form security...');
    
    // Check validation service
    const validationServicePath = path.join(__dirname, '../src/app/services/validation.service.ts');
    if (fs.existsSync(validationServicePath)) {
      const validationService = fs.readFileSync(validationServicePath, 'utf8');
      
      // Check for email validation
      if (validationService.includes('validateEmail') || validationService.includes('email')) {
        this.addPassed('Form Validation', 'Email validation found');
      } else {
        this.addWarning('Form Validation', 'Email validation not found');
      }
      
      // Check for XSS prevention
      if (validationService.includes('sanitize') || validationService.includes('escape')) {
        this.addPassed('XSS Prevention', 'Input sanitization for XSS prevention found');
      } else {
        this.addWarning('XSS Prevention', 'Input sanitization for XSS prevention not found');
      }
    } else {
      this.addWarning('Validation Service', 'Validation service not found');
    }
    
    // Check subscription component for security measures
    const subscriptionComponentPath = path.join(__dirname, '../src/app/components/subscription.component.ts');
    if (fs.existsSync(subscriptionComponentPath)) {
      const subscriptionComponent = fs.readFileSync(subscriptionComponentPath, 'utf8');
      
      // Check for form validation
      if (subscriptionComponent.includes('Validators.') || subscriptionComponent.includes('FormControl')) {
        this.addPassed('Form Security', 'Form validation implementation found');
      } else {
        this.addWarning('Form Security', 'Form validation implementation not found');
      }
    }
  }

  verifyBuildSecurity() {
    console.log('🔍 Verifying build security...');
    
    // Check Angular configuration
    const angularJsonPath = path.join(__dirname, '../angular.json');
    if (fs.existsSync(angularJsonPath)) {
      const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
      
      // Check production build configuration
      const prodConfig = angularJson.projects['angular-sns-frontend']?.architect?.build?.configurations?.production;
      if (prodConfig) {
        // Check optimization
        if (prodConfig.optimization === true) {
          this.addPassed('Build Security', 'Production optimization enabled');
        } else {
          this.addWarning('Build Security', 'Production optimization not enabled');
        }
        
        // Check source maps
        if (prodConfig.sourceMap === false) {
          this.addPassed('Build Security', 'Source maps disabled in production');
        } else {
          this.addWarning('Build Security', 'Source maps enabled in production - consider disabling');
        }
        
        // Check file replacements for environment
        if (prodConfig.fileReplacements && prodConfig.fileReplacements.length > 0) {
          this.addPassed('Environment Security', 'Environment file replacement configured');
        } else {
          this.addWarning('Environment Security', 'Environment file replacement not configured');
        }
      } else {
        this.addIssue('Build Configuration', 'Production build configuration not found');
      }
    } else {
      this.addIssue('Build Configuration', 'Angular configuration file not found');
    }
  }

  verifyDependencySecurity() {
    console.log('🔍 Verifying dependency security...');
    
    // Check package.json for security-related packages
    const packageJsonPath = path.join(__dirname, '../package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for known security packages
      const securityPackages = ['@angular/cdk', '@angular/material'];
      const hasSecurityPackages = securityPackages.some(pkg => 
        packageJson.dependencies && packageJson.dependencies[pkg]
      );
      
      if (hasSecurityPackages) {
        this.addPassed('Dependencies', 'Security-focused packages found');
      }
      
      // Check for development-only packages in production dependencies
      const devOnlyPackages = ['cypress', 'karma', 'jasmine'];
      const hasDevInProd = devOnlyPackages.some(pkg => 
        packageJson.dependencies && packageJson.dependencies[pkg]
      );
      
      if (!hasDevInProd) {
        this.addPassed('Dependencies', 'No development packages in production dependencies');
      } else {
        this.addWarning('Dependencies', 'Development packages found in production dependencies');
      }
    }
  }

  generateReport() {
    console.log('\n📊 Security Verification Report');
    console.log('================================\n');
    
    // Summary
    console.log(`✅ Passed: ${this.passed.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Issues: ${this.issues.length}\n`);
    
    // Detailed results
    if (this.passed.length > 0) {
      console.log('✅ PASSED CHECKS:');
      this.passed.forEach(item => {
        console.log(`  • ${item.category}: ${item.message}`);
      });
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(item => {
        console.log(`  • ${item.category}: ${item.message}`);
      });
      console.log('');
    }
    
    if (this.issues.length > 0) {
      console.log('❌ ISSUES:');
      this.issues.forEach(item => {
        console.log(`  • ${item.category}: ${item.message}`);
      });
      console.log('');
    }
    
    // Overall status
    if (this.issues.length === 0) {
      console.log('🎉 Security verification completed successfully!');
      if (this.warnings.length > 0) {
        console.log('💡 Consider addressing the warnings above for enhanced security.');
      }
      return true;
    } else {
      console.log('🚨 Security issues found that need to be addressed.');
      return false;
    }
  }

  run() {
    this.verifyEnvironmentSecurity();
    this.verifySecurityServices();
    this.verifyHTTPSecurity();
    this.verifyFormSecurity();
    this.verifyBuildSecurity();
    this.verifyDependencySecurity();
    
    return this.generateReport();
  }
}

// Run security verification
const verifier = new SecurityVerifier();
const success = verifier.run();

process.exit(success ? 0 : 1);