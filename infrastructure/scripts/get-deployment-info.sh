#!/bin/bash

# Script to get deployment information for the frontend and backend

set -e

# Configuration
ENV=${1:-dev}
REGION=${AWS_REGION:-us-east-1}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Deployment Information for Environment: ${ENV} ===${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Get stack outputs
echo -e "${YELLOW}Retrieving stack outputs...${NC}"
STACK_OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "InfrastructureStack" \
    --query "Stacks[0].Outputs" \
    --output json \
    --region $REGION 2>/dev/null || echo "[]")

if [ "$STACK_OUTPUTS" = "[]" ]; then
    echo -e "${RED}Error: Could not retrieve stack outputs. Make sure the infrastructure is deployed.${NC}"
    exit 1
fi

# Parse and display outputs
echo -e "${GREEN}=== Infrastructure Outputs ===${NC}"

# Frontend information
FRONTEND_URL=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="FrontendUrl") | .OutputValue' 2>/dev/null || echo "")
FRONTEND_BUCKET=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="FrontendBucketName") | .OutputValue' 2>/dev/null || echo "")
DISTRIBUTION_ID=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="FrontendDistributionId") | .OutputValue' 2>/dev/null || echo "")
DISTRIBUTION_DOMAIN=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="FrontendDistributionDomain") | .OutputValue' 2>/dev/null || echo "")

# Backend information
API_URL=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiUrl") | .OutputValue' 2>/dev/null || echo "")
API_KEY_ID=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiKeyId") | .OutputValue' 2>/dev/null || echo "")

# Display frontend information
if [ ! -z "$FRONTEND_URL" ]; then
    echo -e "${GREEN}Frontend URL:${NC} $FRONTEND_URL"
fi

if [ ! -z "$FRONTEND_BUCKET" ]; then
    echo -e "${GREEN}Frontend S3 Bucket:${NC} $FRONTEND_BUCKET"
fi

if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo -e "${GREEN}CloudFront Distribution ID:${NC} $DISTRIBUTION_ID"
fi

if [ ! -z "$DISTRIBUTION_DOMAIN" ]; then
    echo -e "${GREEN}CloudFront Domain:${NC} $DISTRIBUTION_DOMAIN"
fi

# Display backend information
if [ ! -z "$API_URL" ]; then
    echo -e "${GREEN}API Gateway URL:${NC} $API_URL"
fi

if [ ! -z "$API_KEY_ID" ]; then
    echo -e "${GREEN}API Key ID:${NC} $API_KEY_ID"
    
    # Get the actual API key value
    API_KEY_VALUE=$(aws apigateway get-api-key \
        --api-key $API_KEY_ID \
        --include-value \
        --query "value" \
        --output text \
        --region $REGION 2>/dev/null || echo "")
    
    if [ ! -z "$API_KEY_VALUE" ]; then
        echo -e "${GREEN}API Key Value:${NC} $API_KEY_VALUE"
    fi
fi

# Check deployment status
echo -e "\n${GREEN}=== Deployment Status ===${NC}"

# Check if S3 bucket exists and has content
if [ ! -z "$FRONTEND_BUCKET" ]; then
    BUCKET_OBJECTS=$(aws s3 ls s3://$FRONTEND_BUCKET/ --region $REGION 2>/dev/null | wc -l || echo "0")
    if [ "$BUCKET_OBJECTS" -gt "0" ]; then
        echo -e "${GREEN}✓ Frontend deployed to S3${NC} ($BUCKET_OBJECTS objects)"
    else
        echo -e "${YELLOW}⚠ Frontend not deployed to S3${NC} (bucket empty)"
    fi
fi

# Check CloudFront distribution status
if [ ! -z "$DISTRIBUTION_ID" ]; then
    DISTRIBUTION_STATUS=$(aws cloudfront get-distribution \
        --id $DISTRIBUTION_ID \
        --query "Distribution.Status" \
        --output text \
        --region $REGION 2>/dev/null || echo "Unknown")
    
    if [ "$DISTRIBUTION_STATUS" = "Deployed" ]; then
        echo -e "${GREEN}✓ CloudFront distribution deployed${NC}"
    else
        echo -e "${YELLOW}⚠ CloudFront distribution status: $DISTRIBUTION_STATUS${NC}"
    fi
fi

# Test API endpoints
if [ ! -z "$API_URL" ] && [ ! -z "$API_KEY_VALUE" ]; then
    echo -e "\n${GREEN}=== API Endpoint Tests ===${NC}"
    
    # Test subscription endpoint
    SUBSCRIBE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY_VALUE" \
        -d '{"email":"test@example.com"}' \
        "${API_URL}subscribe" 2>/dev/null || echo "000")
    
    if [ "$SUBSCRIBE_RESPONSE" = "200" ] || [ "$SUBSCRIBE_RESPONSE" = "400" ]; then
        echo -e "${GREEN}✓ Subscription endpoint accessible${NC} (HTTP $SUBSCRIBE_RESPONSE)"
    else
        echo -e "${RED}✗ Subscription endpoint not accessible${NC} (HTTP $SUBSCRIBE_RESPONSE)"
    fi
fi

# Display useful commands
echo -e "\n${GREEN}=== Useful Commands ===${NC}"
echo -e "${YELLOW}Deploy frontend:${NC} cd angular-sns-frontend && ./scripts/deploy-frontend.sh $ENV"
echo -e "${YELLOW}Invalidate CloudFront:${NC} aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*'"
echo -e "${YELLOW}Check S3 contents:${NC} aws s3 ls s3://$FRONTEND_BUCKET/"
echo -e "${YELLOW}Update CORS:${NC} cd infrastructure && ./scripts/update-cors.sh $ENV"

echo -e "\n${BLUE}=== End of Deployment Information ===${NC}"