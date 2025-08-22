# Build Configuration Guide

This document describes the production build configuration for the Angular SNS Frontend application.

## Build Environments

### Development
- **Command**: `npm run build` or `npm start`
- **Configuration**: `development`
- **Features**:
  - Source maps enabled
  - No optimization
  - Fast rebuilds
  - Local API endpoints

### Staging
- **Command**: `npm run build:staging`
- **Configuration**: `staging`
- **Features**:
  - Partial optimization
  - Source maps enabled (for debugging)
  - Named chunks (for easier debugging)
  - Staging API endpoints
  - Debug mode enabled

### Production
- **Command**: `npm run build:prod`
- **Configuration**: `production`
- **Features**:
  - Full optimization
  - Tree shaking
  - Minification
  - Bundle splitting
  - Subresource integrity
  - Strict TypeScript compilation
  - No source maps
  - Production API endpoints

## Build Scripts

### Core Build Commands

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Staging build
npm run build:staging

# Build with bundle analysis
npm run build:analyze

# Build with statistics
npm run build:stats
```

### Deployment Commands

```bash
# Full deployment build (includes tests and optimization)
npm run deploy:build

# Build and deploy script
./scripts/build-deploy.sh [environment]
```

## Build Optimizations

### Production Optimizations

1. **Script Optimization**: JavaScript minification and tree shaking
2. **Style Optimization**: CSS minification and critical CSS inlining
3. **Font Optimization**: Font loading optimization
4. **Bundle Splitting**: Vendor chunk separation for better caching
5. **Build Optimizer**: Angular-specific optimizations
6. **Subresource Integrity**: Security hashes for all assets
7. **Cross-Origin**: Anonymous cross-origin requests

### Bundle Analysis

Use the bundle analyzer to understand your application's bundle composition:

```bash
npm run build:analyze
```

This will:
1. Build the application with statistics
2. Open the webpack bundle analyzer in your browser
3. Show detailed breakdown of bundle sizes

## Build Budgets

The application enforces the following size budgets:

- **Initial Bundle**: 500kB warning, 1MB error
- **Component Styles**: 4kB warning, 8kB error
- **Vendor Bundle**: 300kB warning, 500kB error

## Environment Configuration

### Environment Files

- `environment.ts` - Development configuration
- `environment.staging.ts` - Staging configuration
- `environment.prod.ts` - Production configuration

### Environment Variables

Each environment includes:
- `production`: Boolean flag
- `apiUrl`: API Gateway endpoint
- `apiKey`: API authentication key
- `security`: Security configuration object
- `enableDebugMode`: Debug mode flag
- `logLevel`: Logging level

## TypeScript Configuration

### Production TypeScript Config

The production build uses `tsconfig.prod.json` with strict compilation settings:

- Strict null checks
- No unused locals/parameters
- No implicit returns
- Strict template checking
- Full template type checking

## Asset Optimization

The build process includes a post-build optimization script (`scripts/optimize-assets.js`) that:

1. **Security Headers**: Adds security meta tags to index.html
2. **Asset Manifest**: Creates a manifest of all built assets
3. **Build Validation**: Ensures all required files are present
4. **Build Info**: Generates build metadata

## Deployment

### AWS S3 + CloudFront Deployment

1. **Build the application**:
   ```bash
   npm run build:prod
   ```

2. **Upload to S3**:
   ```bash
   aws s3 sync dist/angular-sns-frontend/browser/ s3://your-bucket-name --delete
   ```

3. **Invalidate CloudFront cache**:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

### Automated Deployment

Use the deployment script for automated builds:

```bash
# Production deployment
./scripts/build-deploy.sh production

# Staging deployment
./scripts/build-deploy.sh staging
```

## Performance Considerations

### Bundle Size Optimization

1. **Lazy Loading**: Implement lazy loading for feature modules
2. **Tree Shaking**: Remove unused code automatically
3. **Vendor Chunking**: Separate vendor libraries for better caching
4. **Code Splitting**: Split code into smaller chunks

### Caching Strategy

1. **Output Hashing**: All files include content hashes
2. **Vendor Chunk**: Separate vendor bundle for long-term caching
3. **CloudFront**: CDN caching for global distribution

## Security Features

### Build-time Security

1. **Subresource Integrity**: All assets include integrity hashes
2. **Security Headers**: Automatic security header injection
3. **HTTPS Enforcement**: Production builds enforce HTTPS
4. **Input Sanitization**: All user inputs are sanitized

### Content Security Policy

The build process prepares the application for CSP headers:
- No inline scripts (except Angular's required ones)
- No eval() usage
- Strict source policies

## Troubleshooting

### Common Build Issues

1. **Bundle Size Exceeded**: Check bundle analyzer and remove unused dependencies
2. **TypeScript Errors**: Use stricter TypeScript config in production
3. **Missing Assets**: Ensure all assets are in the `public` folder
4. **Environment Variables**: Verify environment-specific configurations

### Build Performance

To improve build performance:
1. Use `npm ci` instead of `npm install`
2. Enable build caching
3. Use incremental builds for development
4. Consider using build cache in CI/CD

## Monitoring

### Build Metrics

The build process generates:
- Bundle size statistics
- Build time metrics
- Asset manifest
- Build information file

### Post-deployment Verification

After deployment, verify:
1. Application loads correctly
2. API endpoints are accessible
3. All assets load without errors
4. Security headers are present