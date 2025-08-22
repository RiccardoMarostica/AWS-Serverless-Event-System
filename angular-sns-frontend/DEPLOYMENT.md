# Frontend Deployment Guide

This document provides comprehensive instructions for deploying the Angular SNS Frontend application to AWS infrastructure.

## Overview

The Angular SNS Frontend is deployed as a static website using:
- **S3** for static file hosting
- **CloudFront** for global content delivery and caching
- **API Gateway** integration for backend services

## Prerequisites

### Required Tools
- Node.js (v18 or later)
- npm (v8 or later)
- Angular CLI (`npm install -g @angular/cli`)
- AWS CLI v2 (`aws configure` must be completed)
- jq (optional, for JSON parsing)

### AWS Permissions
Your AWS credentials must have permissions for:
- S3 bucket operations (read/write)
- CloudFront distribution management
- CloudFormation stack access
- API Gateway access (for testing)

## Deployment Scripts

### 1. Main Deployment Script (`deploy.sh`)
The primary deployment script that handles the complete deployment process.

```bash
# Deploy to development environment
./scripts/deploy.sh dev

# Deploy to staging environment
./scripts/deploy.sh staging

# Deploy to production environment
./scripts/deploy.sh production
```

**Features:**
- Environment validation
- Prerequisite checking
- Application building
- S3 deployment with optimized caching
- CloudFront cache invalidation
- Deployment verification

### 2. Staging Deployment Script (`deploy-staging.sh`)
Specialized script for staging deployments with additional testing features.

```bash
# Deploy to staging with interactive prompts
./scripts/deploy-staging.sh
```

**Features:**
- Interactive deployment confirmation
- Post-deployment testing instructions
- Browser opening option
- Staging-specific optimizations

### 3. Pipeline Deployment Script (`pipeline-deploy.sh`)
Comprehensive CI/CD pipeline script with full testing and validation.

```bash
# Full pipeline deployment
./scripts/pipeline-deploy.sh production

# Skip tests (for development)
./scripts/pipeline-deploy.sh dev true

# Dry run (no actual deployment)
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

### 4. Deployment Testing Script (`test-deployment.sh`)
Comprehensive testing script to verify deployment success.

```bash
# Test deployment
./scripts/test-deployment.sh production
```

**Test Categories:**
- S3 deployment verification
- CloudFront distribution status
- Frontend accessibility
- API integration
- Security headers
- Performance metrics

## NPM Scripts

The following npm scripts are available for deployment:

```bash
# Quick deployment to development
npm run deploy:dev

# Staging deployment with testing
npm run deploy:staging

# Production deployment
npm run deploy:prod

# Full pipeline deployment
npm run deploy:pipeline

# Test existing deployment
npm run deploy:test
```

## Environment Configuration

### Development Environment
- **Purpose:** Local development and testing
- **Build:** Standard Angular build
- **Tests:** Optional (can be skipped)
- **Cache:** Short-lived caching
- **Monitoring:** Minimal

### Staging Environment
- **Purpose:** Pre-production testing
- **Build:** Production-optimized build
- **Tests:** Full test suite required
- **Cache:** Production-like caching
- **Monitoring:** Enabled
- **Features:** Post-deployment testing

### Production Environment
- **Purpose:** Live application
- **Build:** Fully optimized production build
- **Tests:** Complete test suite required
- **Cache:** Long-term caching with invalidation
- **Monitoring:** Full monitoring enabled
- **Features:** Approval gates, comprehensive testing

## Deployment Process

### Step-by-Step Deployment

1. **Prepare Environment**
   ```bash
   # Ensure AWS credentials are configured
   aws sts get-caller-identity
   
   # Verify infrastructure is deployed
   aws cloudformation describe-stacks --stack-name InfrastructureStack
   ```

2. **Run Deployment**
   ```bash
   # For staging
   ./scripts/deploy-staging.sh
   
   # For production
   ./scripts/pipeline-deploy.sh production
   ```

3. **Verify Deployment**
   ```bash
   # Run comprehensive tests
   ./scripts/test-deployment.sh production
   ```

4. **Monitor Application**
   - Check CloudWatch logs
   - Monitor API Gateway metrics
   - Verify CloudFront cache performance

### Rollback Procedure

If deployment issues occur:

1. **Immediate Rollback**
   ```bash
   # Deploy previous working version
   git checkout <previous-commit>
   ./scripts/deploy.sh production
   ```

2. **CloudFront Cache Clear**
   ```bash
   # Get distribution ID
   DIST_ID=$(aws cloudformation describe-stacks \
     --stack-name InfrastructureStack \
     --query "Stacks[0].Outputs[?OutputKey=='FrontendDistributionId'].OutputValue" \
     --output text)
   
   # Create invalidation
   aws cloudfront create-invalidation \
     --distribution-id $DIST_ID \
     --paths "/*"
   ```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm ci

# Run build with verbose output
npm run build:prod -- --verbose
```

#### 2. S3 Upload Errors
```bash
# Check bucket permissions
aws s3api get-bucket-policy --bucket your-bucket-name

# Verify AWS credentials
aws sts get-caller-identity
```

#### 3. CloudFront Issues
```bash
# Check distribution status
aws cloudfront get-distribution --id your-distribution-id

# List recent invalidations
aws cloudfront list-invalidations --distribution-id your-distribution-id
```

#### 4. API Integration Problems
```bash
# Test API connectivity
curl -I https://your-api-gateway-url.amazonaws.com/dev

# Check CORS configuration
curl -X OPTIONS \
  -H "Origin: https://your-frontend-domain.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" \
  https://your-api-gateway-url.amazonaws.com/dev/subscribe
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment variable
export DEBUG=true

# Run deployment with debug output
./scripts/deploy.sh production
```

## Security Considerations

### Content Security Policy
The deployment automatically configures CSP headers:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline'`
- `style-src 'self' 'unsafe-inline'`
- `connect-src 'self' https://api-gateway-url`

### HTTPS Enforcement
- All traffic is redirected to HTTPS
- HSTS headers are configured
- Secure cookie settings are enforced

### API Security
- API keys are required for backend access
- CORS is configured for frontend domain only
- Input sanitization is implemented

## Performance Optimization

### Caching Strategy
- **Static Assets:** 1 year cache with immutable flag
- **HTML Files:** No cache with must-revalidate
- **JSON/Config:** 5 minutes cache
- **Error Pages:** 1 minute cache

### Compression
- Gzip compression enabled for all text-based files
- Brotli compression available for modern browsers

### CDN Configuration
- Global edge locations via CloudFront
- Origin shield for improved cache hit ratios
- Custom error pages for better UX

## Monitoring and Logging

### CloudWatch Metrics
- CloudFront request metrics
- S3 bucket access logs
- API Gateway performance metrics

### Alerts
Configure alerts for:
- High error rates (4xx/5xx responses)
- Slow response times (>3 seconds)
- Failed deployments
- Security violations

### Log Analysis
```bash
# View CloudFront logs
aws logs describe-log-groups --log-group-name-prefix "/aws/cloudfront"

# View API Gateway logs
aws logs describe-log-groups --log-group-name-prefix "/aws/apigateway"
```

## Best Practices

### Development Workflow
1. Develop and test locally
2. Deploy to staging environment
3. Run comprehensive tests
4. Deploy to production with approval
5. Monitor post-deployment metrics

### Version Control
- Tag releases for easy rollback
- Use semantic versioning
- Maintain deployment logs

### Testing
- Run unit tests before deployment
- Perform integration testing in staging
- Validate security headers and performance
- Test error scenarios and edge cases

### Documentation
- Keep deployment logs
- Document configuration changes
- Maintain runbooks for common issues
- Update this guide with new procedures

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review CloudWatch logs
3. Verify AWS infrastructure status
4. Contact the development team with specific error messages

## Configuration Files

- `deployment.config.json` - Deployment configuration
- `angular.json` - Angular build configuration
- `package.json` - NPM scripts and dependencies
- Environment files in `src/environments/`