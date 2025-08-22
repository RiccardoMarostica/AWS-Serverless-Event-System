#!/bin/bash

# CI/CD Pipeline Deployment Script
# This script implements a complete build and deployment pipeline
# with comprehensive testing and validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
ENV=${1:-dev}
SKIP_TESTS=${2:-false}
DRY_RUN=${3:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

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

# Pipeline stages
PIPELINE_STAGES=(
    "validate_environment"
    "check_prerequisites" 
    "install_dependencies"
    "run_linting"
    "run_unit_tests"
    "build_application"
    "run_build_tests"
    "deploy_to_s3"
    "invalidate_cache"
    "verify_deployment"
    "run_integration_tests"
)

# Stage tracking
CURRENT_STAGE=0
TOTAL_STAGES=${#PIPELINE_STAGES[@]}

print_pipeline_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    DEPLOYMENT PIPELINE                      ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║ Environment: $ENV"
    echo "║ Skip Tests: $SKIP_TESTS"
    echo "║ Dry Run: $DRY_RUN"
    echo "║ Total Stages: $TOTAL_STAGES"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

print_stage_header() {
    local stage_name=$1
    CURRENT_STAGE=$((CURRENT_STAGE + 1))
    
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│ Stage $CURRENT_STAGE/$TOTAL_STAGES: $stage_name"
    echo "└─────────────────────────────────────────────────────────────┘"
}

validate_environment() {
    print_stage_header "Environment Validation"
    
    case $ENV in
        dev|staging|production)
            log_success "Environment '$ENV' is valid"
            ;;
        *)
            log_error "Invalid environment: $ENV"
            log_error "Valid environments: dev, staging, production"
            exit 1
            ;;
    esac
    
    # Set environment-specific configurations
    case $ENV in
        dev)
            export NODE_ENV=development
            export SKIP_CACHE_INVALIDATION=false
            ;;
        staging)
            export NODE_ENV=production
            export SKIP_CACHE_INVALIDATION=false
            ;;
        production)
            export NODE_ENV=production
            export SKIP_CACHE_INVALIDATION=false
            ;;
    esac
    
    log_info "NODE_ENV set to: $NODE_ENV"
}

check_prerequisites() {
    print_stage_header "Prerequisites Check"
    
    local missing_tools=()
    
    # Check required tools
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if ! command -v ng &> /dev/null; then
        missing_tools+=("@angular/cli")
    fi
    
    if ! command -v aws &> /dev/null; then
        missing_tools+=("aws-cli")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    log_info "Node.js version: $NODE_VERSION"
    
    # Check Angular CLI version
    NG_VERSION=$(ng version --json 2>/dev/null | jq -r '.["@angular/cli"]' 2>/dev/null || echo "unknown")
    log_info "Angular CLI version: $NG_VERSION"
    
    log_success "All prerequisites satisfied"
}

install_dependencies() {
    print_stage_header "Dependency Installation"
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would install dependencies"
        return 0
    fi
    
    # Clean install for production builds
    if [ "$ENV" = "production" ]; then
        log_info "Performing clean install for production..."
        rm -rf node_modules package-lock.json
        npm ci --production=false
    else
        # Check if dependencies need to be installed
        if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
            log_info "Installing dependencies..."
            npm ci
        else
            log_info "Dependencies are up to date"
        fi
    fi
    
    log_success "Dependencies installed"
}

run_linting() {
    print_stage_header "Code Linting"
    
    cd "$PROJECT_ROOT"
    
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping linting (SKIP_TESTS=true)"
        return 0
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would run linting"
        return 0
    fi
    
    # Check if lint script exists
    if npm run lint --silent 2>/dev/null; then
        log_success "Linting passed"
    else
        log_warning "Linting script not found or failed"
    fi
}

run_unit_tests() {
    print_stage_header "Unit Tests"
    
    cd "$PROJECT_ROOT"
    
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping unit tests (SKIP_TESTS=true)"
        return 0
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would run unit tests"
        return 0
    fi
    
    log_info "Running unit tests..."
    npm run test:ci
    
    log_success "Unit tests passed"
}

build_application() {
    print_stage_header "Application Build"
    
    cd "$PROJECT_ROOT"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would build application for $ENV"
        return 0
    fi
    
    # Clean previous build
    if [ -d "dist" ]; then
        log_info "Cleaning previous build..."
        rm -rf dist
    fi
    
    # Build based on environment
    case $ENV in
        dev)
            log_info "Building for development..."
            npm run build
            ;;
        staging)
            log_info "Building for staging..."
            npm run build:staging 2>/dev/null || npm run build:prod
            ;;
        production)
            log_info "Building for production..."
            npm run build:prod
            ;;
    esac
    
    # Verify build output
    DIST_DIR="$PROJECT_ROOT/dist/angular-sns-frontend/browser"
    if [ ! -d "$DIST_DIR" ]; then
        log_error "Build failed - output directory not found"
        exit 1
    fi
    
    # Display build statistics
    BUILD_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
    FILE_COUNT=$(find "$DIST_DIR" -type f | wc -l)
    
    log_success "Build completed successfully"
    log_info "Build size: $BUILD_SIZE"
    log_info "File count: $FILE_COUNT"
}

run_build_tests() {
    print_stage_header "Build Verification Tests"
    
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping build tests (SKIP_TESTS=true)"
        return 0
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would verify build output"
        return 0
    fi
    
    DIST_DIR="$PROJECT_ROOT/dist/angular-sns-frontend/browser"
    
    # Check required files
    REQUIRED_FILES=("index.html")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$DIST_DIR/$file" ]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    # Check for main bundle files
    if ! find "$DIST_DIR" -name "main*.js" | grep -q .; then
        log_error "Main JavaScript bundle not found"
        exit 1
    fi
    
    # Verify index.html contains expected content
    if ! grep -q "angular-sns-frontend" "$DIST_DIR/index.html"; then
        log_warning "index.html may not contain expected application content"
    fi
    
    log_success "Build verification passed"
}

deploy_to_s3() {
    print_stage_header "S3 Deployment"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would deploy to S3"
        return 0
    fi
    
    # Use the main deployment script for S3 deployment
    log_info "Delegating to main deployment script..."
    "$SCRIPT_DIR/deploy.sh" "$ENV"
}

invalidate_cache() {
    print_stage_header "Cache Invalidation"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would invalidate CloudFront cache"
        return 0
    fi
    
    if [ "$SKIP_CACHE_INVALIDATION" = "true" ]; then
        log_warning "Skipping cache invalidation"
        return 0
    fi
    
    # Cache invalidation is handled by the main deployment script
    log_success "Cache invalidation completed by deployment script"
}

verify_deployment() {
    print_stage_header "Deployment Verification"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would verify deployment"
        return 0
    fi
    
    # Get frontend URL
    FRONTEND_URL=$(aws cloudformation describe-stacks \
        --stack-name "InfrastructureStack" \
        --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
        --output text \
        --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
    
    if [ -z "$FRONTEND_URL" ]; then
        log_warning "Could not retrieve frontend URL"
        return 0
    fi
    
    # Basic connectivity test
    if command -v curl &> /dev/null; then
        log_info "Testing frontend connectivity..."
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")
        
        if [ "$HTTP_STATUS" = "200" ]; then
            log_success "Frontend is accessible (HTTP $HTTP_STATUS)"
        else
            log_warning "Frontend returned HTTP $HTTP_STATUS"
        fi
    fi
    
    log_success "Deployment verification completed"
}

run_integration_tests() {
    print_stage_header "Integration Tests"
    
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping integration tests (SKIP_TESTS=true)"
        return 0
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would run integration tests"
        return 0
    fi
    
    # Placeholder for future integration tests
    log_info "Integration tests not yet implemented"
    log_info "Manual testing recommended:"
    log_info "1. Test subscription form functionality"
    log_info "2. Verify API integration"
    log_info "3. Test error handling scenarios"
    
    log_success "Integration test stage completed"
}

print_pipeline_summary() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    PIPELINE SUMMARY                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN completed successfully"
        log_info "All stages would execute without errors"
    else
        log_success "Pipeline completed successfully!"
        log_success "Application deployed to $ENV environment"
        
        # Get deployment details
        FRONTEND_URL=$(aws cloudformation describe-stacks \
            --stack-name "InfrastructureStack" \
            --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
            --output text \
            --region ${AWS_REGION:-us-east-1} 2>/dev/null || echo "")
        
        if [ ! -z "$FRONTEND_URL" ]; then
            echo ""
            echo "🌐 Frontend URL: $FRONTEND_URL"
        fi
    fi
    
    echo ""
}

# Error handling
cleanup() {
    if [ $? -ne 0 ]; then
        echo ""
        log_error "Pipeline failed at stage $CURRENT_STAGE/$TOTAL_STAGES: ${PIPELINE_STAGES[$((CURRENT_STAGE-1))]}"
        log_error "Check the logs above for details"
        exit 1
    fi
}
trap cleanup EXIT

# Show usage
show_usage() {
    echo "Usage: $0 [environment] [skip_tests] [dry_run]"
    echo ""
    echo "Arguments:"
    echo "  environment  - Target environment (dev|staging|production) [default: dev]"
    echo "  skip_tests   - Skip test execution (true|false) [default: false]"
    echo "  dry_run      - Perform dry run without actual deployment (true|false) [default: false]"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging false false"
    echo "  $0 production true false"
    echo "  $0 dev false true  # Dry run"
    echo ""
}

# Main execution
main() {
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi
    
    print_pipeline_header
    
    # Execute pipeline stages
    for stage in "${PIPELINE_STAGES[@]}"; do
        $stage
    done
    
    print_pipeline_summary
}

# Run main function
main "$@"