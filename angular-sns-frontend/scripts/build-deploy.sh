#!/bin/bash

# Build and deployment script for Angular SNS Frontend
# Usage: ./scripts/build-deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-production}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist/angular-sns-frontend"

echo "🚀 Building Angular SNS Frontend for $ENVIRONMENT environment..."

# Validate environment
case $ENVIRONMENT in
  development|staging|production)
    echo "✅ Building for $ENVIRONMENT environment"
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid environments: development, staging, production"
    exit 1
    ;;
esac

# Clean previous build
if [ -d "$DIST_DIR" ]; then
  echo "🧹 Cleaning previous build..."
  rm -rf "$DIST_DIR"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci
fi

# Run tests before building (skip for development)
if [ "$ENVIRONMENT" != "development" ]; then
  echo "🧪 Running tests..."
  npm run test:ci
fi

# Build the application
echo "🔨 Building application..."
case $ENVIRONMENT in
  development)
    npm run build
    ;;
  staging)
    npm run build:staging
    ;;
  production)
    npm run build:prod
    ;;
esac

# Verify build output
if [ ! -d "$DIST_DIR/browser" ]; then
  echo "❌ Build failed - output directory not found"
  exit 1
fi

# Check if main files exist
REQUIRED_FILES=("index.html")
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/browser/$file" ]; then
    echo "❌ Build failed - $file not found"
    exit 1
  fi
done

# Display build statistics
echo "📊 Build Statistics:"
echo "   Environment: $ENVIRONMENT"
echo "   Build size: $(du -sh "$DIST_DIR/browser" | cut -f1)"
echo "   Files count: $(find "$DIST_DIR/browser" -type f | wc -l)"

# List main bundle files
echo "📦 Main bundles:"
find "$DIST_DIR/browser" -name "*.js" -o -name "*.css" | head -10 | while read file; do
  size=$(du -h "$file" | cut -f1)
  basename=$(basename "$file")
  echo "   $basename: $size"
done

echo "✅ Build completed successfully!"
echo "📁 Output directory: $DIST_DIR/browser"

# Generate deployment instructions
echo ""
echo "🚀 Deployment Instructions:"
case $ENVIRONMENT in
  production|staging)
    echo "   1. Upload contents of $DIST_DIR/browser/ to S3 bucket"
    echo "   2. Invalidate CloudFront cache: aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths '/*'"
    echo "   3. Verify deployment at your domain"
    ;;
  development)
    echo "   1. Serve locally: npm run serve:prod"
    echo "   2. Or upload to development S3 bucket for testing"
    ;;
esac