#!/bin/bash

# Deployment Testing Script
# This script tests the deployed frontend and verifies integration with backend APIs

set -e

ENV=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_EMAIL="test@example.com"
TIMEOUT=30

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

print_test_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    DEPLOYMENT TESTING                       ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║ Environment: $ENV"
    echo "║ Timeout: ${TIMEOUT}s"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

get_deployment_info() {
    log_info "Retrieving deployment information..."
    
    # Get infrastructure outputs
    FRONTEND_URL=$(aws cloudformation describe-stacks \
        --stack-name "InfrastructureStack" \
        --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "InfrastructureStack" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name "InfrastructureStack" \
        --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name "InfrastructureStack" \
        --query "Stacks[0].Outputs[?OutputKey=='FrontendDistributionId'].OutputValue" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    log_info "Deployment information:"
    log_info "  Frontend URL: ${FRONTEND_URL:-'Not found'}"
    log_info "  API URL: ${API_URL:-'Not found'}"
    log_info "  S3 Bucket: ${BUCKET_NAME:-'Not found'}"
    log_info "  CloudFront Distribution: ${DISTRIBUTION_ID:-'Not found'}"
}

test_s3_deployment() {
    log_info "Testing S3 deployment..."
    
    if [ -z "$BUCKET_NAME" ]; then
        log_error "S3 bucket name not found"
        return 1
    fi
    
    # Test if index.html exists
    if aws s3api head-object --bucket "$BUCKET_NAME" --key "index.html" --region ${AWS_REGION:-us-east-1} &>/dev/null; then
        log_success "index.html found in S3 bucket"
    else
        log_error "index.html not found in S3 bucket"
        return 1
    fi
    
    # Test if error pages exist
    if aws s3api head-object --bucket "$BUCKET_NAME" --key "404.html" --region ${AWS_REGION:-us-east-1} &>/dev/null; then
        log_success "404.html found in S3 bucket"
    else
        log_warning "404.html not found in S3 bucket"
    fi
    
    if aws s3api head-object --bucket "$BUCKET_NAME" --key "error.html" --region ${AWS_REGION:-us-east-1} &>/dev/null; then
        log_success "error.html found in S3 bucket"
    else
        log_warning "error.html not found in S3 bucket"
    fi
    
    # List some files to verify deployment
    FILE_COUNT=$(aws s3 ls "s3://$BUCKET_NAME/" --recursive | wc -l)
    log_info "Total files in S3 bucket: $FILE_COUNT"
    
    log_success "S3 deployment test completed"
}

test_cloudfront_distribution() {
    log_info "Testing CloudFront distribution..."
    
    if [ -z "$DISTRIBUTION_ID" ]; then
        log_error "CloudFront distribution ID not found"
        return 1
    fi
    
    # Get distribution status
    DISTRIBUTION_STATUS=$(aws cloudfront get-distribution \
        --id "$DISTRIBUTION_ID" \
        --query "Distribution.Status" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    if [ "$DISTRIBUTION_STATUS" = "Deployed" ]; then
        log_success "CloudFront distribution is deployed"
    else
        log_warning "CloudFront distribution status: ${DISTRIBUTION_STATUS:-'Unknown'}"
    fi
    
    log_success "CloudFront distribution test completed"
}

test_frontend_accessibility() {
    log_info "Testing frontend accessibility..."
    
    if [ -z "$FRONTEND_URL" ]; then
        log_error "Frontend URL not found"
        return 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_warning "curl not available, skipping HTTP tests"
        return 0
    fi
    
    # Test main page
    log_info "Testing main page accessibility..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$FRONTEND_URL" || echo "000")
    
    case $HTTP_STATUS in
        200)
            log_success "Frontend is accessible (HTTP $HTTP_STATUS)"
            ;;
        000)
            log_error "Frontend is not accessible (timeout or connection error)"
            return 1
            ;;
        *)
            log_warning "Frontend returned HTTP $HTTP_STATUS"
            ;;
    esac
    
    # Test 404 page
    log_info "Testing 404 error page..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$FRONTEND_URL/nonexistent-page" || echo "000")
    
    if [ "$HTTP_STATUS" = "404" ]; then
        log_success "404 error page is working correctly"
    else
        log_warning "404 error page returned HTTP $HTTP_STATUS"
    fi
    
    # Test if the page contains expected content
    log_info "Testing page content..."
    PAGE_CONTENT=$(curl -s --max-time $TIMEOUT "$FRONTEND_URL" || echo "")
    
    if echo "$PAGE_CONTENT" | grep -q "angular-sns-frontend\|subscription\|email"; then
        log_success "Page contains expected application content"
    else
        log_warning "Page may not contain expected application content"
    fi
    
    log_success "Frontend accessibility test completed"
}

test_api_integration() {
    log_info "Testing API integration..."
    
    if [ -z "$API_URL" ]; then
        log_error "API URL not found"
        return 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_warning "curl not available, skipping API tests"
        return 0
    fi
    
    # Test API Gateway health
    log_info "Testing API Gateway accessibility..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$API_URL" || echo "000")
    
    case $HTTP_STATUS in
        403)
            log_success "API Gateway is accessible (HTTP $HTTP_STATUS - expected for protected endpoints)"
            ;;
        200)
            log_success "API Gateway is accessible (HTTP $HTTP_STATUS)"
            ;;
        000)
            log_error "API Gateway is not accessible (timeout or connection error)"
            return 1
            ;;
        *)
            log_warning "API Gateway returned HTTP $HTTP_STATUS"
            ;;
    esac
    
    # Test CORS preflight (OPTIONS request)
    log_info "Testing CORS configuration..."
    CORS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT \
        -X OPTIONS \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,X-API-Key" \
        "$API_URL/subscribe" || echo "000")
    
    case $CORS_STATUS in
        200|204)
            log_success "CORS preflight successful (HTTP $CORS_STATUS)"
            ;;
        000)
            log_warning "CORS preflight failed (timeout or connection error)"
            ;;
        *)
            log_warning "CORS preflight returned HTTP $CORS_STATUS"
            ;;
    esac
    
    log_success "API integration test completed"
}

test_security_headers() {
    log_info "Testing security headers..."
    
    if [ -z "$FRONTEND_URL" ]; then
        log_warning "Frontend URL not found, skipping security header tests"
        return 0
    fi
    
    if ! command -v curl &> /dev/null; then
        log_warning "curl not available, skipping security header tests"
        return 0
    fi
    
    # Get response headers
    HEADERS=$(curl -s -I --max-time $TIMEOUT "$FRONTEND_URL" || echo "")
    
    # Check for security headers
    SECURITY_HEADERS=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "Strict-Transport-Security"
        "Content-Security-Policy"
    )
    
    for header in "${SECURITY_HEADERS[@]}"; do
        if echo "$HEADERS" | grep -qi "$header"; then
            log_success "Security header present: $header"
        else
            log_warning "Security header missing: $header"
        fi
    done
    
    log_success "Security headers test completed"
}

test_performance() {
    log_info "Testing performance metrics..."
    
    if [ -z "$FRONTEND_URL" ]; then
        log_warning "Frontend URL not found, skipping performance tests"
        return 0
    fi
    
    if ! command -v curl &> /dev/null; then
        log_warning "curl not available, skipping performance tests"
        return 0
    fi
    
    # Measure response time
    log_info "Measuring response time..."
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$FRONTEND_URL" || echo "0")
    
    if [ "$RESPONSE_TIME" != "0" ]; then
        log_info "Response time: ${RESPONSE_TIME}s"
        
        # Check if response time meets requirements (< 3 seconds)
        if (( $(echo "$RESPONSE_TIME < 3.0" | bc -l 2>/dev/null || echo "1") )); then
            log_success "Response time meets requirements (< 3s)"
        else
            log_warning "Response time exceeds requirements (>= 3s)"
        fi
    else
        log_warning "Could not measure response time"
    fi
    
    # Test compression
    log_info "Testing compression..."
    CONTENT_ENCODING=$(curl -s -H "Accept-Encoding: gzip" -I --max-time $TIMEOUT "$FRONTEND_URL" | grep -i "content-encoding" || echo "")
    
    if echo "$CONTENT_ENCODING" | grep -qi "gzip"; then
        log_success "Compression is enabled"
    else
        log_warning "Compression may not be enabled"
    fi
    
    log_success "Performance test completed"
}

run_comprehensive_tests() {
    local test_results=()
    
    # Run all tests and collect results
    if test_s3_deployment; then
        test_results+=("S3: PASS")
    else
        test_results+=("S3: FAIL")
    fi
    
    if test_cloudfront_distribution; then
        test_results+=("CloudFront: PASS")
    else
        test_results+=("CloudFront: FAIL")
    fi
    
    if test_frontend_accessibility; then
        test_results+=("Frontend: PASS")
    else
        test_results+=("Frontend: FAIL")
    fi
    
    if test_api_integration; then
        test_results+=("API: PASS")
    else
        test_results+=("API: FAIL")
    fi
    
    if test_security_headers; then
        test_results+=("Security: PASS")
    else
        test_results+=("Security: FAIL")
    fi
    
    if test_performance; then
        test_results+=("Performance: PASS")
    else
        test_results+=("Performance: FAIL")
    fi
    
    # Print test summary
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                      TEST SUMMARY                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    
    local all_passed=true
    for result in "${test_results[@]}"; do
        if echo "$result" | grep -q "PASS"; then
            log_success "$result"
        else
            log_error "$result"
            all_passed=false
        fi
    done
    
    echo ""
    if [ "$all_passed" = true ]; then
        log_success "All tests passed! Deployment is ready for use."
        
        if [ ! -z "$FRONTEND_URL" ]; then
            echo ""
            echo "🌐 Frontend URL: $FRONTEND_URL"
            echo "📋 Next steps:"
            echo "   1. Test the subscription form manually"
            echo "   2. Verify email notifications are working"
            echo "   3. Test error handling scenarios"
            echo "   4. Check responsive design on different devices"
        fi
    else
        log_error "Some tests failed. Please review the issues above."
        return 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Arguments:"
    echo "  environment  - Target environment to test (dev|staging|production) [default: dev]"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  $0 production"
    echo ""
}

# Main execution
main() {
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi
    
    print_test_header
    get_deployment_info
    run_comprehensive_tests
}

# Run main function
main "$@"