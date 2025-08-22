# Frontend Deployment Guide

This guide explains how to deploy the Angular frontend application to AWS using S3 and CloudFront.

## Prerequisites

- AWS CLI installed and configured with appropriate permissions
- Node.js and npm installed
- Angular CLI installed globally (`npm install -g @angular/cli`)
- CDK CLI installed globally (`npm install -g aws-cdk`)

## Infrastructure Components

The frontend deployment includes:

1. **S3 Bucket** - Static website hosting with public read access
2. **CloudFront Distribution** - Global CDN with caching and security headers
3. **Origin Access Identity** - Secure access from CloudFront to S3
4. **Custom Error Pages** - 404 and error handling pages
5. **Security Headers** - CSP, HSTS, and other security policies

## Deployment Steps

### 1. Deploy Infrastructure

First, deploy the updated infrastructure stack that includes the frontend resources:

```bash
cd infrastructure
npm install
npm run build
npm run deploy
```

This will create:
- S3 bucket for static website hosting
- CloudFront distribution with security headers
- Origin Access Identity for secure access
- Custom error page configurations

### 2. Build and Deploy Frontend

Use the deployment script to build and deploy the Angular application:

```bash
cd angular-sns-frontend
./scripts/deploy-frontend.sh dev
```

This script will:
- Install dependencies if needed
- Build the Angular application for production
- Copy custom error pages to the build output
- Upload files to S3 with appropriate cache headers
- Invalidate CloudFront cache
- Display the frontend URL

### 3. Update CORS Settings (Optional)

If you need to restrict CORS to only allow the CloudFront domain:

```bash
cd infrastructure
./scripts/update-cors.sh dev
```

Then redeploy the infrastructure:

```bash
npm run deploy
```

## Configuration Details

### S3 Bucket Configuration

- **Public Read Access**: Enabled for static website hosting
- **Website Hosting**: Configured with `index.html` as default and `error.html` for errors
- **SSL Enforcement**: Required for all requests
- **CORS**: Configured to work with CloudFront

### CloudFront Distribution

- **Origin**: S3 bucket with Origin Access Identity
- **Viewer Protocol Policy**: Redirect HTTP to HTTPS
- **Caching**: Optimized caching for static assets
- **Compression**: Enabled for better performance
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.

### Custom Error Pages

- **404 Errors**: Custom 404.html page with user-friendly design
- **5xx Errors**: Custom error.html page for server errors
- **SPA Routing**: Configured to handle Angular routing

### Security Headers

The CloudFront distribution includes comprehensive security headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' [API_URL]; img-src 'self' data: https:; font-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

## Environment Variables

The Angular application should be configured with the following environment variables:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api-gateway-url.amazonaws.com/dev',
  apiKey: 'your-api-key'
};
```

## Monitoring and Troubleshooting

### CloudWatch Logs

Monitor CloudFront access logs and S3 access logs for troubleshooting.

### Common Issues

1. **CORS Errors**: Ensure the API Gateway CORS settings include the CloudFront domain
2. **404 Errors**: Verify that the custom error pages are uploaded correctly
3. **Cache Issues**: Use CloudFront invalidation to clear cached content
4. **SSL Certificate**: CloudFront automatically provides SSL certificates

### Useful Commands

```bash
# Check deployment status
aws cloudformation describe-stacks --stack-name InfrastructureStack

# Get CloudFront distribution details
aws cloudfront get-distribution --id DISTRIBUTION_ID

# Invalidate CloudFront cache manually
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"

# Check S3 bucket contents
aws s3 ls s3://serverless-event-system-frontend-dev/
```

## Performance Optimization

The deployment includes several performance optimizations:

1. **CloudFront Caching**: Static assets cached for 1 year, HTML files for immediate updates
2. **Compression**: Gzip compression enabled for all content
3. **HTTP/2**: Automatically enabled by CloudFront
4. **Global Distribution**: Content served from edge locations worldwide

## Security Considerations

1. **HTTPS Only**: All traffic redirected to HTTPS
2. **Security Headers**: Comprehensive security headers applied
3. **Origin Access Identity**: Direct S3 access blocked, only through CloudFront
4. **Input Sanitization**: Handled by the Angular application
5. **API Security**: API key required for backend access

## Cost Optimization

- **S3 Storage**: Standard storage class for frequently accessed content
- **CloudFront**: PriceClass_100 for cost-effective global distribution
- **Data Transfer**: Reduced costs through CloudFront caching

## Backup and Recovery

- **S3 Versioning**: Disabled by default for cost optimization
- **CloudFormation**: Infrastructure as code for easy recreation
- **Source Control**: All code stored in Git for version control

## Next Steps

After deployment:

1. Test the frontend application thoroughly
2. Configure monitoring and alerting
3. Set up automated deployment pipelines
4. Implement additional security measures as needed
5. Monitor performance and optimize as necessary