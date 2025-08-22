#!/bin/bash

# Staging Environment Deployment Script
# This script deploys the Angular application to a staging environment for testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying to Staging Environment${NC}"
echo ""

# Configuration for staging
export AWS_REGION=${AWS_REGION:-us-east-1}
STAGING_ENV="staging"

# Pre-deployment checks
echo -e "${YELLOW}📋 Pre-deployment Checklist:${NC}"
echo "✓ Environment: $STAGING_ENV"
echo "✓ Region: $AWS_REGION"
echo "✓ Build tests will be executed"
echo "✓ CloudFront cache will be invalidated"
echo ""

# Confirm deployment
read -p "Continue with staging deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Run the main deployment script
echo -e "${BLUE}🔄 Starting deployment process...${NC}"
"$SCRIPT_DIR/deploy.sh" "$STAGING_ENV"

# Post-deployment staging-specific tasks
echo ""
echo -e "${BLUE}🧪 Running staging-specific post-deployment tasks...${NC}"

# Wait a bit for CloudFront to propagate
echo "⏳ Waiting 30 seconds for CloudFront propagation..."
sleep 30

# Get the staging URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name "InfrastructureStack" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "")

if [ ! -z "$FRONTEND_URL" ]; then
    echo ""
    echo -e "${GREEN}🎉 Staging Deployment Complete!${NC}"
    echo ""
    echo "=== Staging Environment Details ==="
    echo "Frontend URL: $FRONTEND_URL"
    echo "Environment: $STAGING_ENV"
    echo "Region: $AWS_REGION"
    echo ""
    echo "=== Testing Instructions ==="
    echo "1. Open the frontend URL in your browser"
    echo "2. Test the subscription form with a valid email"
    echo "3. Verify error handling with invalid inputs"
    echo "4. Check responsive design on different screen sizes"
    echo "5. Test API integration and error scenarios"
    echo ""
    echo "=== Monitoring ==="
    echo "• CloudWatch Logs: Check Lambda function logs"
    echo "• API Gateway: Monitor request/response metrics"
    echo "• CloudFront: Check cache hit ratios and errors"
    echo ""
    
    # Optional: Open the URL in default browser (macOS/Linux)
    if command -v open &> /dev/null; then
        read -p "Open staging URL in browser? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$FRONTEND_URL"
        fi
    elif command -v xdg-open &> /dev/null; then
        read -p "Open staging URL in browser? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            xdg-open "$FRONTEND_URL"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Could not retrieve frontend URL. Check AWS Console for CloudFront distribution.${NC}"
fi

echo ""
echo -e "${GREEN}✅ Staging deployment and setup completed!${NC}"