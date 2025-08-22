# Deployment Scripts

This directory contains comprehensive deployment automation scripts for the Angular SNS Frontend application.

## Scripts Overview

### 🚀 Main Deployment Scripts

#### `deploy.sh`
**Primary deployment script** - Handles complete deployment process with error handling and verification.

```bash
# Deploy to development
./scripts/deploy.sh dev

# Deploy to staging  
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

**Features:**
- Environment validation and configuration
- Prerequisites checking (AWS CLI, Angular CLI, credentials)
- Application building with environment-specific optimizations
- S3 deployment with optimized caching strategies
- CloudFront cache invalidation
- Deployment verification and health checks
- Comprehensive error handling and rollback support

#### `deploy-staging.sh`
**Staging-specific deployment** - Enhanced staging deployment with interactive features.

```bash
./scripts/deploy-staging.sh
```

**Features:**
- Interactive deployment confirmation
- Post-deployment testing instructions
- Browser opening for immediate testing
- Staging environment optimizations
- CloudFront propagation waiting

#### `pipeline-deploy.sh`
**CI/CD Pipeline deployment** - Full pipeline with comprehensive testing and validation.

```bash
# Full pipeline
./scripts/pipeline-deploy.sh production

# Skip tests (development)
./scripts/pipeline-deploy.sh dev true

# Dry run (no deployment)
./scripts/pipeline-deploy.sh staging false true
```

**Pipeline Stages:**
1. Environment validation
2. Prerequisites check
3. Dependency installation
4. Code linting
5. Unit tests
6. Application build
7. Build verification
8. S3 deployment
9. Cache invalidation
10. Deployment verification
11. Integration tests

### 🧪 Testing & Verification Scripts

#### `test-deployment.sh`
**Deployment testing** - Comprehensive testing of deployed application.

```bash
./scripts/test-deployment.sh production
```

**Test Categories:**
- S3 deployment verification
- CloudFront distribution status
- Frontend accessibility testing
- API integration validation
- Security headers verification
- Performance metrics analysis

#### `verify-integration.sh`
**Backend integration verification** - Validates backend API integration before deployment.

```bash
./scripts/verify-integration.sh production
```

**Verification Tests:**
- Infrastructure status checking
- API endpoint accessibility
- CORS configuration validation
- Lambda function status
- SNS topic configuration
- API key functionality

### 📦 Legacy Scripts

#### `build-deploy.sh`
**Build-focused deployment** - Original build and deployment script.

```bash
./scripts/build-deploy.sh production
```

#### `deploy-frontend.sh`
**Basic frontend deployment** - Simple S3 and CloudFront deployment.

```bash
./scripts/deploy-frontend.sh dev
```

## Quick Start

### 1. First-Time Setup
```bash
# Verify prerequisites
./scripts/verify-integration.sh dev

# Deploy to development
./scripts/deploy.sh dev
```

### 2. Staging Deployment
```bash
# Interactive staging deployment
./scripts/deploy-staging.sh

# Or use pipeline for full testing
./scripts/pipeline-deploy.sh staging
```

### 3. Production Deployment
```bash
# Full pipeline with all tests
./scripts/pipeline-deploy.sh production

# Test the deployment
./scripts/test-deployment.sh production
```

## Script Dependencies

### Required Tools
- **Node.js** (v18+) - JavaScript runtime
- **npm** (v8+) - Package manager
- **Angular CLI** - Angular framework CLI
- **AWS CLI v2** - AWS command line interface
- **jq** (optional) - JSON processor for enhanced features

### AWS Permissions
Scripts require AWS credentials with permissions for:
- S3 bucket operations (read/write)
- CloudFront distribution management
- CloudFormation stack access
- API Gateway access
- Lambda function status checking
- SNS topic access

### Environment Variables
- `AWS_REGION` - AWS region (default: us-east-1)
- `DEBUG` - Enable debug logging (true/false)
- `SKIP_TESTS` - Skip test execution (true/false)

## Configuration

### Deployment Configuration
Main configuration is stored in `../deployment.config.json`:

```json
{
  "environments": {
    "dev": { "skipTests": false, "cacheInvalidation": true },
    "staging": { "testAfterDeploy": true, "monitoring": true },
    "production": { "requireApproval": true, "monitoring": true }
  }
}
```

### Environment-Specific Settings
Each environment has specific configurations:

- **Development**: Fast builds, optional tests, short cache
- **Staging**: Production builds, full tests, monitoring enabled
- **Production**: Optimized builds, comprehensive tests, approval gates

## Error Handling

### Common Issues & Solutions

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm ci
npm run build:prod
```

#### AWS Permission Errors
```bash
# Verify credentials
aws sts get-caller-identity

# Check specific permissions
aws s3 ls s3://your-bucket-name
aws cloudfront list-distributions
```

#### CloudFront Issues
```bash
# Check distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Manual cache invalidation
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Debug Mode
Enable detailed logging:
```bash
export DEBUG=true
./scripts/deploy.sh production
```

## Security Features

### Content Security Policy
Automatic CSP header configuration:
- Restricts script sources to self and inline
- Limits connection sources to API Gateway
- Prevents clickjacking with frame options

### API Security
- API key validation for backend requests
- CORS configuration for frontend domain
- HTTPS enforcement for all communications

### Input Sanitization
- Form data sanitization before API calls
- XSS protection in user inputs
- Secure cookie handling

## Performance Optimizations

### Caching Strategy
- **Static Assets**: 1 year cache with immutable flag
- **HTML Files**: No cache with must-revalidate
- **Configuration**: 5 minutes cache
- **Error Pages**: 1 minute cache

### Build Optimizations
- Tree shaking for unused code removal
- Bundle splitting for optimal loading
- Compression (Gzip/Brotli) for all text files
- Asset optimization and minification

### CDN Configuration
- Global edge locations via CloudFront
- Origin shield for improved cache ratios
- Custom error pages for better UX

## Monitoring & Logging

### CloudWatch Integration
Scripts automatically configure:
- CloudFront request metrics
- S3 access logging
- API Gateway performance metrics
- Lambda function monitoring

### Log Analysis
```bash
# View deployment logs
aws logs describe-log-groups --log-group-name-prefix "/aws/cloudfront"

# Check API Gateway logs
aws logs describe-log-groups --log-group-name-prefix "/aws/apigateway"
```

### Alerts Configuration
Recommended alerts:
- High error rates (4xx/5xx responses)
- Slow response times (>3 seconds)
- Failed deployments
- Security violations

## Best Practices

### Development Workflow
1. **Local Development**: Test changes locally first
2. **Staging Deployment**: Deploy to staging for integration testing
3. **Comprehensive Testing**: Run all test suites
4. **Production Deployment**: Deploy with full pipeline validation
5. **Post-Deployment Monitoring**: Monitor metrics and logs

### Version Control
- Tag releases for easy rollback: `git tag v1.0.0`
- Use semantic versioning
- Maintain deployment logs
- Document configuration changes

### Rollback Procedures
```bash
# Quick rollback to previous version
git checkout <previous-commit>
./scripts/deploy.sh production

# Manual CloudFront invalidation
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

## Troubleshooting

### Script Execution Issues
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Check script syntax
bash -n scripts/deploy.sh
```

### AWS CLI Issues
```bash
# Update AWS CLI
pip install --upgrade awscli

# Reconfigure credentials
aws configure
```

### Node.js/npm Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Support

For deployment issues:
1. Check script logs for specific error messages
2. Verify AWS infrastructure status
3. Review CloudWatch logs
4. Consult the main [DEPLOYMENT.md](../DEPLOYMENT.md) guide
5. Contact development team with error details

## Contributing

When adding new scripts:
1. Follow existing naming conventions
2. Include comprehensive error handling
3. Add logging with consistent format
4. Update this README with new script documentation
5. Test scripts in all environments before committing