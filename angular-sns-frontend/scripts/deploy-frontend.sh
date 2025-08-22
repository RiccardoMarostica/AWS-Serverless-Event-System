#!/bin/bash

# Frontend Deployment Script for AWS S3 and CloudFront
# This script builds the Angular application and deploys it to S3 with CloudFront invalidation

set -e

# Configuration
ENV=${1:-dev}
PROJECT_NAME="serverless-event-system"
BUCKET_NAME="${PROJECT_NAME}-frontend-${ENV}"
REGION=${AWS_REGION:-us-east-1}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting frontend deployment for environment: ${ENV}${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Angular CLI is installed
if ! command -v ng &> /dev/null; then
    echo -e "${RED}Angular CLI is not installed. Please install it first: npm install -g @angular/cli${NC}"
    exit 1
fi

# Navigate to the Angular project directory
cd "$(dirname "$0")/.."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Build the Angular application for production
echo -e "${YELLOW}Building Angular application for production...${NC}"
ng build --configuration=production

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}Build failed. dist directory not found.${NC}"
    exit 1
fi

# Copy custom error pages to dist directory
echo -e "${YELLOW}Copying custom error pages...${NC}"
cp public/404.html dist/angular-sns-frontend/
cp public/error.html dist/angular-sns-frontend/

# Get the CloudFront distribution ID
echo -e "${YELLOW}Getting CloudFront distribution ID...${NC}"
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "InfrastructureStack" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendDistributionId'].OutputValue" \
    --output text \
    --region $REGION 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Warning: Could not retrieve CloudFront distribution ID. Skipping cache invalidation.${NC}"
fi

# Sync files to S3 bucket
echo -e "${YELLOW}Uploading files to S3 bucket: ${BUCKET_NAME}...${NC}"
aws s3 sync dist/angular-sns-frontend/ s3://${BUCKET_NAME}/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --region $REGION

# Upload HTML files with shorter cache control
echo -e "${YELLOW}Uploading HTML files with shorter cache control...${NC}"
aws s3 sync dist/angular-sns-frontend/ s3://${BUCKET_NAME}/ \
    --delete \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html" \
    --region $REGION

# Set proper content types for specific files
echo -e "${YELLOW}Setting content types for specific files...${NC}"
aws s3 cp s3://${BUCKET_NAME}/404.html s3://${BUCKET_NAME}/404.html \
    --content-type "text/html" \
    --cache-control "public, max-age=300" \
    --metadata-directive REPLACE \
    --region $REGION

aws s3 cp s3://${BUCKET_NAME}/error.html s3://${BUCKET_NAME}/error.html \
    --content-type "text/html" \
    --cache-control "public, max-age=60" \
    --metadata-directive REPLACE \
    --region $REGION

# Invalidate CloudFront cache if distribution ID is available
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --query "Invalidation.Id" \
        --output text \
        --region $REGION)
    
    echo -e "${GREEN}CloudFront invalidation created with ID: ${INVALIDATION_ID}${NC}"
    echo -e "${YELLOW}Waiting for invalidation to complete...${NC}"
    
    aws cloudfront wait invalidation-completed \
        --distribution-id $DISTRIBUTION_ID \
        --id $INVALIDATION_ID \
        --region $REGION
    
    echo -e "${GREEN}CloudFront invalidation completed.${NC}"
fi

# Get the frontend URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name "InfrastructureStack" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
    --output text \
    --region $REGION 2>/dev/null || echo "")

echo -e "${GREEN}Frontend deployment completed successfully!${NC}"
echo -e "${GREEN}S3 Bucket: ${BUCKET_NAME}${NC}"

if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo -e "${GREEN}CloudFront Distribution ID: ${DISTRIBUTION_ID}${NC}"
fi

if [ ! -z "$FRONTEND_URL" ]; then
    echo -e "${GREEN}Frontend URL: ${FRONTEND_URL}${NC}"
else
    echo -e "${YELLOW}Frontend URL will be available after infrastructure deployment.${NC}"
fi

echo -e "${GREEN}Deployment completed!${NC}"