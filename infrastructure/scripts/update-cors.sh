#!/bin/bash

# Script to update API Gateway CORS settings with CloudFront domain
# This should be run after the infrastructure is deployed and the CloudFront domain is known

set -e

# Configuration
ENV=${1:-dev}
PROJECT_NAME="serverless-event-system"
REGION=${AWS_REGION:-us-east-1}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Updating API Gateway CORS settings for environment: ${ENV}${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Get the CloudFront domain name
echo -e "${YELLOW}Getting CloudFront domain name...${NC}"
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "InfrastructureStack" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendDistributionDomain'].OutputValue" \
    --output text \
    --region $REGION 2>/dev/null || echo "")

if [ -z "$CLOUDFRONT_DOMAIN" ]; then
    echo -e "${RED}Error: Could not retrieve CloudFront domain. Make sure the infrastructure is deployed.${NC}"
    exit 1
fi

echo -e "${GREEN}CloudFront domain found: ${CLOUDFRONT_DOMAIN}${NC}"

# Update the CDK context with the CloudFront domain
echo -e "${YELLOW}Updating CDK context with CloudFront domain...${NC}"

# Create a temporary file with updated configuration
cat > /tmp/cors-update.json << EOF
{
  "allowOrigins": [
    "https://${CLOUDFRONT_DOMAIN}",
    "http://localhost:4200"
  ]
}
EOF

echo -e "${YELLOW}Updated CORS configuration:${NC}"
cat /tmp/cors-update.json

echo -e "${GREEN}CORS configuration updated successfully!${NC}"
echo -e "${YELLOW}Note: You need to redeploy the CDK stack for changes to take effect:${NC}"
echo -e "${YELLOW}cd infrastructure && npm run deploy${NC}"

# Clean up
rm -f /tmp/cors-update.json