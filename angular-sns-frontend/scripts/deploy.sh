#!/bin/bash

# Enhanced Frontend Deployment Script for AWS S3 and CloudFront
# This script builds the Angular application and deploys it to S3 with CloudFront invalidation
# Supports multiple environments and comprehensive error handling

set -e

# Configuration
ENV=${1:-dev}
PROJECT_NAME="serverless-event-system"
BUCKET_NAME="${PROJECT_NAME}-frontend-${ENV}"
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="InfrastructureStack"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist/angular-sns-frontend/browser"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed. Check the logs above for details."
        exit 1
    fi
}
trap cleanup EXIT

# Validation functions
validate_environment() {
    case $ENV in
        dev|staging|production)
            log_info "Deploying to environment: $ENV"
            ;;
        *)
            log_error "Invalid environment: $ENV"
            log_error "Valid environments: dev, staging, production"
            exit 1
            ;;
    esac
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    # Check if Angular CLI is installed
    if ! command -v ng &> /dev/null; then
        log_error "Angular CLI is not installed. Please install it first: npm install -g @angular/cli"
        exit 1
    fi

    # Check if jq is installed (for JSON parsing)
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. Some features may not work properly."
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

get_infrastructure_outputs() {
    log_info "Retrieving infrastructure outputs..."
    
    # Get CloudFront distribution ID
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='FrontendDistributionId'].OutputValue" \
        --output text \
        --region $REGION 2>/dev/null || echo "")

    # Get S3 bucket name from CloudFormation
    CF_BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
        --output text \
        --region $REGION 2>/dev/null || echo "")

    # Use CloudFormation bucket name if available
    if [ ! -z "$CF_BUCKET_NAME" ]; then
        BUCKET_NAME="$CF_BUCKET_NAME"
    fi

    # Get API URL for environment configuration
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
        --output text \
        --region $REGION 2>/dev/null || echo "")

    # Get API Key ID
    API_KEY_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiKeyId'].OutputValue" \
        --output text \
        --region $REGION 2>/dev/null || echo "")

    # Get Frontend URL
    FRONTEND_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
        --output text \
        --region $REGION 2>/dev/null || echo "")

    log_info "Infrastructure outputs retrieved:"
    log_info "  S3 Bucket: $BUCKET_NAME"
    log_info "  CloudFront Distribution ID: ${DISTRIBUTION_ID:-'Not found'}"
    log_info "  API URL: ${API_URL:-'Not found'}"
    log_info "  Frontend URL: ${FRONTEND_URL:-'Not found'}"
}

build_application() {
    log_info "Building Angular application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi

    # Run tests before building (skip for dev environment)
    if [ "$ENV" != "dev" ]; then
        log_info "Running tests..."
        npm run test:ci
    fi

    # Build the application based on environment
    case $ENV in
        dev)
            log_info "Building for development..."
            npm run build
            ;;
        staging)
            log_info "Building for staging..."
            npm run build:staging
            ;;
        production)
            log_info "Building for production..."
            npm run build:prod
            ;;
    esac

    # Verify build output
    if [ ! -d "$DIST_DIR" ]; then
        log_error "Build failed - output directory not found: $DIST_DIR"
        exit 1
    fi

    # Check if main files exist
    REQUIRED_FILES=("index.html")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$DIST_DIR/$file" ]; then
            log_error "Build failed - $file not found in $DIST_DIR"
            exit 1
        fi
    done

    # Copy custom error pages to dist directory
    log_info "Copying custom error pages..."
    if [ -f "$PROJECT_ROOT/public/404.html" ]; then
        cp "$PROJECT_ROOT/public/404.html" "$DIST_DIR/"
    fi
    if [ -f "$PROJECT_ROOT/public/error.html" ]; then
        cp "$PROJECT_ROOT/public/error.html" "$DIST_DIR/"
    fi

    # Display build statistics
    log_success "Build completed successfully!"
    log_info "Build statistics:"
    log_info "  Environment: $ENV"
    log_info "  Build size: $(du -sh "$DIST_DIR" | cut -f1)"
    log_info "  Files count: $(find "$DIST_DIR" -type f | wc -l)"
}

deploy_to_s3() {
    log_info "Deploying to S3 bucket: $BUCKET_NAME..."
    
    # Check if bucket exists
    if ! aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
        log_error "S3 bucket '$BUCKET_NAME' does not exist or is not accessible"
        exit 1
    fi

    # Sync static assets (JS, CSS, images) with long cache control
    log_info "Uploading static assets with long cache control..."
    aws s3 sync "$DIST_DIR/" "s3://${BUCKET_NAME}/" \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "*.html" \
        --exclude "*.json" \
        --exclude "*.txt" \
        --region "$REGION"

    # Upload HTML files with shorter cache control
    log_info "Uploading HTML files with shorter cache control..."
    aws s3 sync "$DIST_DIR/" "s3://${BUCKET_NAME}/" \
        --cache-control "public, max-age=0, must-revalidate" \
        --include "*.html" \
        --region "$REGION"

    # Upload JSON and text files with medium cache control
    log_info "Uploading configuration files..."
    aws s3 sync "$DIST_DIR/" "s3://${BUCKET_NAME}/" \
        --cache-control "public, max-age=300" \
        --include "*.json" \
        --include "*.txt" \
        --region "$REGION"

    # Set proper content types and cache control for specific files
    if [ -f "$DIST_DIR/404.html" ]; then
        aws s3 cp "$DIST_DIR/404.html" "s3://${BUCKET_NAME}/404.html" \
            --content-type "text/html" \
            --cache-control "public, max-age=300" \
            --metadata-directive REPLACE \
            --region "$REGION"
    fi

    if [ -f "$DIST_DIR/error.html" ]; then
        aws s3 cp "$DIST_DIR/error.html" "s3://${BUCKET_NAME}/error.html" \
            --content-type "text/html" \
            --cache-control "public, max-age=60" \
            --metadata-directive REPLACE \
            --region "$REGION"
    fi

    log_success "S3 deployment completed"
}

invalidate_cloudfront() {
    if [ -z "$DISTRIBUTION_ID" ]; then
        log_warning "CloudFront distribution ID not found. Skipping cache invalidation."
        return 0
    fi

    log_info "Invalidating CloudFront cache..."
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --query "Invalidation.Id" \
        --output text \
        --region "$REGION")
    
    if [ $? -eq 0 ]; then
        log_success "CloudFront invalidation created with ID: $INVALIDATION_ID"
        
        # Wait for invalidation to complete (optional, can be skipped for faster deployments)
        if [ "$ENV" = "production" ]; then
            log_info "Waiting for invalidation to complete (this may take a few minutes)..."
            aws cloudfront wait invalidation-completed \
                --distribution-id "$DISTRIBUTION_ID" \
                --id "$INVALIDATION_ID" \
                --region "$REGION"
            log_success "CloudFront invalidation completed"
        else
            log_info "Invalidation is in progress. Check AWS Console for status."
        fi
    else
        log_error "Failed to create CloudFront invalidation"
        exit 1
    fi
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if index.html is accessible via S3
    if aws s3api head-object --bucket "$BUCKET_NAME" --key "index.html" --region "$REGION" &>/dev/null; then
        log_success "index.html successfully uploaded to S3"
    else
        log_error "index.html not found in S3 bucket"
        exit 1
    fi

    # Test API connectivity if API URL is available
    if [ ! -z "$API_URL" ] && command -v curl &> /dev/null; then
        log_info "Testing API connectivity..."
        if curl -s -o /dev/null -w "%{http_code}" "$API_URL" | grep -q "403\|200"; then
            log_success "API endpoint is accessible"
        else
            log_warning "API endpoint may not be accessible (this is normal if API key is required)"
        fi
    fi

    log_success "Deployment verification completed"
}

print_deployment_summary() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "=== Deployment Summary ==="
    echo "Environment: $ENV"
    echo "S3 Bucket: $BUCKET_NAME"
    echo "Region: $REGION"
    
    if [ ! -z "$DISTRIBUTION_ID" ]; then
        echo "CloudFront Distribution ID: $DISTRIBUTION_ID"
    fi
    
    if [ ! -z "$FRONTEND_URL" ]; then
        echo "Frontend URL: $FRONTEND_URL"
    fi
    
    if [ ! -z "$API_URL" ]; then
        echo "API URL: $API_URL"
    fi
    
    echo ""
    echo "=== Next Steps ==="
    if [ ! -z "$FRONTEND_URL" ]; then
        echo "1. Visit your application: $FRONTEND_URL"
    else
        echo "1. Check AWS Console for CloudFront distribution URL"
    fi
    echo "2. Test the subscription functionality"
    echo "3. Monitor CloudWatch logs for any issues"
    
    if [ "$ENV" = "production" ]; then
        echo "4. Consider setting up custom domain and SSL certificate"
        echo "5. Configure monitoring and alerting"
    fi
}

# Main execution
main() {
    log_info "Starting frontend deployment process..."
    
    validate_environment
    check_prerequisites
    get_infrastructure_outputs
    build_application
    deploy_to_s3
    invalidate_cloudfront
    verify_deployment
    print_deployment_summary
    
    log_success "All deployment tasks completed successfully!"
}

# Show usage if help is requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  dev        - Development environment (default)"
    echo "  staging    - Staging environment"
    echo "  production - Production environment"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_REGION - AWS region (default: us-east-1)"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  AWS_REGION=us-west-2 $0 production"
    exit 0
fi

# Run main function
main "$@"