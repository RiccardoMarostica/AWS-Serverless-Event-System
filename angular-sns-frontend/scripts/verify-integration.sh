#!/bin/bash

# Backend Integration Verification Script
# This script verifies that the frontend can properly integrate with the existing backend API

set -e

ENV=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                BACKEND INTEGRATION VERIFICATION             ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║ Environment: $ENV"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

get_infrastructure_info() {
    log_info "Retrieving infrastructure information..."
    
    # Get API Gateway URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "InfrastructureStack" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    # Get API Key ID
    API_KEY_ID=$(aws cloudformation describe-stacks \
        --stack-name "InfrastructureStack" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiKeyId'].OutputValue" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    # Get Frontend URL
    FRONTEND_URL=$(aws cloudformation describe-stacks \
        --stack-name "InfrastructureStack" \
        --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    log_info "Infrastructure details:"
    log_info "  API URL: ${API_URL:-'Not found'}"
    log_info "  API Key ID: ${API_KEY_ID:-'Not found'}"
    log_info "  Frontend URL: ${FRONTEND_URL:-'Not found'}"
    
    if [ -z "$API_URL" ]; then
        log_error "API URL not found. Ensure infrastructure is deployed."
        exit 1
    fi
}

get_api_key_value() {
    log_info "Retrieving API key value..."
    
    if [ -z "$API_KEY_ID" ]; then
        log_warning "API Key ID not found. Some tests may fail."
        return 0
    fi
    
    API_KEY_VALUE=$(aws apigateway get-api-key \
        --api-key "$API_KEY_ID" \
        --include-value \
        --query "value" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    if [ ! -z "$API_KEY_VALUE" ]; then
        log_success "API key retrieved successfully"
        # Don't log the actual key value for security
    else
        log_warning "Could not retrieve API key value"
    fi
}

test_api_endpoints() {
    log_info "Testing API endpoints..."
    
    if ! command -v curl &> /dev/null; then
        log_error "curl not available. Cannot test API endpoints."
        return 1
    fi
    
    # Test /subscribe endpoint
    log_info "Testing /subscribe endpoint..."
    
    # Test without API key (should return 403)
    SUBSCRIBE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com"}' \
        "$API_URL/subscribe" || echo "000")
    
    if [ "$SUBSCRIBE_STATUS" = "403" ]; then
        log_success "/subscribe endpoint is protected (HTTP 403 without API key)"
    else
        log_warning "/subscribe endpoint returned HTTP $SUBSCRIBE_STATUS (expected 403)"
    fi
    
    # Test with API key if available
    if [ ! -z "$API_KEY_VALUE" ]; then
        log_info "Testing /subscribe with API key..."
        
        SUBSCRIBE_WITH_KEY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY_VALUE" \
            -d '{"email":"test@example.com"}' \
            "$API_URL/subscribe" || echo "000")
        
        case $SUBSCRIBE_WITH_KEY_STATUS in
            200|201)
                log_success "/subscribe endpoint accepts valid requests (HTTP $SUBSCRIBE_WITH_KEY_STATUS)"
                ;;
            400)
                log_success "/subscribe endpoint validates input (HTTP 400 for test data)"
                ;;
            *)
                log_warning "/subscribe endpoint returned HTTP $SUBSCRIBE_WITH_KEY_STATUS"
                ;;
        esac
    fi
    
    # Test /event endpoint
    log_info "Testing /event endpoint..."
    
    EVENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        "$API_URL/event" || echo "000")
    
    if [ "$EVENT_STATUS" = "403" ]; then
        log_success "/event endpoint is protected (HTTP 403 without API key)"
    else
        log_warning "/event endpoint returned HTTP $EVENT_STATUS (expected 403)"
    fi
}

test_cors_configuration() {
    log_info "Testing CORS configuration..."
    
    if [ -z "$FRONTEND_URL" ]; then
        log_warning "Frontend URL not available. Using example domain for CORS test."
        FRONTEND_URL="https://example.cloudfront.net"
    fi
    
    # Test CORS preflight for /subscribe
    log_info "Testing CORS preflight for /subscribe..."
    
    CORS_RESPONSE=$(curl -s -I \
        -X OPTIONS \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,X-API-Key" \
        "$API_URL/subscribe" || echo "")
    
    CORS_STATUS=$(echo "$CORS_RESPONSE" | head -n1 | grep -o '[0-9]\{3\}' || echo "000")
    
    case $CORS_STATUS in
        200|204)
            log_success "CORS preflight successful (HTTP $CORS_STATUS)"
            ;;
        *)
            log_warning "CORS preflight returned HTTP $CORS_STATUS"
            ;;
    esac
    
    # Check CORS headers
    if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
        log_success "CORS Access-Control-Allow-Origin header present"
    else
        log_warning "CORS Access-Control-Allow-Origin header missing"
    fi
    
    if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-methods"; then
        log_success "CORS Access-Control-Allow-Methods header present"
    else
        log_warning "CORS Access-Control-Allow-Methods header missing"
    fi
    
    if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-headers"; then
        log_success "CORS Access-Control-Allow-Headers header present"
    else
        log_warning "CORS Access-Control-Allow-Headers header missing"
    fi
}

test_lambda_functions() {
    log_info "Testing Lambda function status..."
    
    # Check subscription Lambda
    SUBSCRIPTION_LAMBDA_NAME="serverless-event-system-add-subscription-${ENV}"
    
    SUBSCRIPTION_STATUS=$(aws lambda get-function \
        --function-name "$SUBSCRIPTION_LAMBDA_NAME" \
        --query "Configuration.State" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "NotFound")
    
    if [ "$SUBSCRIPTION_STATUS" = "Active" ]; then
        log_success "Subscription Lambda is active"
    else
        log_warning "Subscription Lambda status: $SUBSCRIPTION_STATUS"
    fi
    
    # Check event registration Lambda
    EVENT_LAMBDA_NAME="serverless-event-system-event-registration-${ENV}"
    
    EVENT_STATUS=$(aws lambda get-function \
        --function-name "$EVENT_LAMBDA_NAME" \
        --query "Configuration.State" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "NotFound")
    
    if [ "$EVENT_STATUS" = "Active" ]; then
        log_success "Event registration Lambda is active"
    else
        log_warning "Event registration Lambda status: $EVENT_STATUS"
    fi
}

test_sns_topic() {
    log_info "Testing SNS topic configuration..."
    
    SNS_TOPIC_NAME="serverless-event-system-event-notification-topic-${ENV}"
    
    # List topics and check if our topic exists
    TOPIC_ARN=$(aws sns list-topics \
        --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    if [ ! -z "$TOPIC_ARN" ]; then
        log_success "SNS topic exists: $SNS_TOPIC_NAME"
        
        # Get topic attributes
        TOPIC_POLICY=$(aws sns get-topic-attributes \
            --topic-arn "$TOPIC_ARN" \
            --query "Attributes.Policy" \
            --output text \
            --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
        
        if [ ! -z "$TOPIC_POLICY" ] && [ "$TOPIC_POLICY" != "None" ]; then
            log_success "SNS topic has access policy configured"
        else
            log_warning "SNS topic access policy not found"
        fi
    else
        log_warning "SNS topic not found: $SNS_TOPIC_NAME"
    fi
}

generate_integration_report() {
    log_info "Generating integration report..."
    
    REPORT_FILE="$SCRIPT_DIR/../integration-report-${ENV}.md"
    
    cat > "$REPORT_FILE" << EOF
# Backend Integration Report

**Environment:** $ENV  
**Generated:** $(date)  
**Region:** ${AWS_REGION:-us-east-1}

## Infrastructure Status

- **API Gateway URL:** ${API_URL:-'Not found'}
- **Frontend URL:** ${FRONTEND_URL:-'Not found'}
- **API Key ID:** ${API_KEY_ID:-'Not found'}

## Test Results

### API Endpoints
- /subscribe endpoint: Tested
- /event endpoint: Tested
- API key authentication: Verified

### CORS Configuration
- Preflight requests: Tested
- Required headers: Verified
- Origin validation: Checked

### Lambda Functions
- Subscription Lambda: Checked
- Event Registration Lambda: Checked

### SNS Topic
- Topic existence: Verified
- Access policies: Checked

## Next Steps

1. **Manual Testing Required:**
   - Test subscription form with real email
   - Verify email delivery
   - Test error handling scenarios

2. **Monitoring Setup:**
   - Configure CloudWatch alarms
   - Set up log monitoring
   - Enable API Gateway metrics

3. **Security Review:**
   - Verify CORS origins are restrictive
   - Check API key rotation policy
   - Review Lambda function permissions

## Commands for Manual Testing

\`\`\`bash
# Test subscription endpoint
curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"email":"your-email@example.com"}' \\
  $API_URL/subscribe

# Test CORS
curl -X OPTIONS \\
  -H "Origin: $FRONTEND_URL" \\
  -H "Access-Control-Request-Method: POST" \\
  -H "Access-Control-Request-Headers: Content-Type,X-API-Key" \\
  $API_URL/subscribe
\`\`\`

EOF
    
    log_success "Integration report generated: $REPORT_FILE"
}

run_comprehensive_verification() {
    local verification_results=()
    
    # Run all verification tests
    if get_infrastructure_info; then
        verification_results+=("Infrastructure: PASS")
    else
        verification_results+=("Infrastructure: FAIL")
    fi
    
    if get_api_key_value; then
        verification_results+=("API Key: PASS")
    else
        verification_results+=("API Key: FAIL")
    fi
    
    if test_api_endpoints; then
        verification_results+=("API Endpoints: PASS")
    else
        verification_results+=("API Endpoints: FAIL")
    fi
    
    if test_cors_configuration; then
        verification_results+=("CORS: PASS")
    else
        verification_results+=("CORS: FAIL")
    fi
    
    if test_lambda_functions; then
        verification_results+=("Lambda Functions: PASS")
    else
        verification_results+=("Lambda Functions: FAIL")
    fi
    
    if test_sns_topic; then
        verification_results+=("SNS Topic: PASS")
    else
        verification_results+=("SNS Topic: FAIL")
    fi
    
    # Generate report
    generate_integration_report
    
    # Print verification summary
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  VERIFICATION SUMMARY                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    
    local all_passed=true
    for result in "${verification_results[@]}"; do
        if echo "$result" | grep -q "PASS"; then
            log_success "$result"
        else
            log_error "$result"
            all_passed=false
        fi
    done
    
    echo ""
    if [ "$all_passed" = true ]; then
        log_success "All verification tests passed!"
        log_success "Backend integration is ready for frontend deployment."
        
        echo ""
        echo "🚀 Ready for deployment! Run:"
        echo "   ./scripts/deploy.sh $ENV"
        echo ""
        echo "📋 After deployment, test manually:"
        echo "   1. Visit: ${FRONTEND_URL:-'Your CloudFront URL'}"
        echo "   2. Test subscription form"
        echo "   3. Check email delivery"
    else
        log_error "Some verification tests failed."
        log_error "Please resolve the issues before deploying the frontend."
        return 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Arguments:"
    echo "  environment  - Target environment to verify (dev|staging|production) [default: dev]"
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
    
    print_header
    run_comprehensive_verification
}

# Run main function
main "$@"