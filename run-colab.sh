#!/bin/bash

# Google Colab Standalone Client Runner
# This script provides easy access to all Colab client functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to print header
print_header() {
    echo
    print_color $BLUE "🎯 Google Colab Standalone Client"
    print_color $BLUE "=================================="
    echo
}

# Function to show usage
show_usage() {
    print_header
    echo "Usage: $0 <command> [options]"
    echo
    print_color $YELLOW "Available Commands:"
    echo
    print_color $GREEN "Setup Commands:"
    echo "  setup           - Install dependencies and configure environment"
    echo "  config          - Generate configuration from .env file"
    echo "  build           - Build the TypeScript project"
    echo
    print_color $GREEN "Demo Commands:"
    echo "  demo            - Run the simple client demo"
    echo "  example         - Run the example usage script"
    echo "  auth            - Start authentication flow"
    echo "  test-auth       - Test with dummy token (shows error handling)"
    echo
    print_color $GREEN "Development Commands:"
    echo "  watch           - Build and watch for changes"
    echo "  typecheck       - Run TypeScript type checking"
    echo "  lint            - Run linting"
    echo "  test            - Run unit tests"
    echo
    print_color $GREEN "Information Commands:"
    echo "  help            - Show this help message"
    echo "  status          - Show project status"
    echo
    print_color $YELLOW "Examples:"
    echo "  $0 setup        # First-time setup"
    echo "  $0 demo         # Run the demo"
    echo "  $0 auth         # Get authentication URL"
    echo
}

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_color $RED "❌ Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_color $RED "❌ Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_color $GREEN "✅ Node.js $(node --version) detected"
}

# Function to check if dependencies are installed
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_color $YELLOW "⚠️  Dependencies not installed. Run '$0 setup' first."
        return 1
    fi
    return 0
}

# Function to check if config exists
check_config() {
    if [ ! -f "src/colab-config.ts" ]; then
        print_color $YELLOW "⚠️  Configuration not generated. Run '$0 config' first."
        return 1
    fi
    return 0
}

# Setup function
setup() {
    print_header
    print_color $BLUE "Setting up Google Colab Standalone Client..."
    
    check_node
    
    print_color $YELLOW "📦 Installing dependencies..."
    npm install
    
    if [ ! -f ".env" ]; then
        print_color $YELLOW "📝 Creating .env file from template..."
        cp .env.template .env
        print_color $YELLOW "⚠️  Please edit .env file with your OAuth credentials"
    fi
    
    print_color $YELLOW "⚙️  Generating configuration..."
    npm run generate:config
    
    print_color $YELLOW "🔨 Building project..."
    npm run build:extension
    
    print_color $GREEN "✅ Setup completed successfully!"
    echo
    print_color $YELLOW "Next steps:"
    echo "1. Edit .env file with your Google OAuth credentials"
    echo "2. Run '$0 demo' to test the client"
    echo "3. Run '$0 auth' to start authentication flow"
}

# Status function
status() {
    print_header
    print_color $BLUE "Project Status:"
    echo
    
    # Check Node.js
    if command -v node &> /dev/null; then
        print_color $GREEN "✅ Node.js: $(node --version)"
    else
        print_color $RED "❌ Node.js: Not installed"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        print_color $GREEN "✅ npm: $(npm --version)"
    else
        print_color $RED "❌ npm: Not installed"
    fi
    
    # Check dependencies
    if [ -d "node_modules" ]; then
        print_color $GREEN "✅ Dependencies: Installed"
    else
        print_color $RED "❌ Dependencies: Not installed"
    fi
    
    # Check .env file
    if [ -f ".env" ]; then
        print_color $GREEN "✅ Environment: .env file exists"
    else
        print_color $RED "❌ Environment: .env file missing"
    fi
    
    # Check config
    if [ -f "src/colab-config.ts" ]; then
        print_color $GREEN "✅ Configuration: Generated"
    else
        print_color $RED "❌ Configuration: Not generated"
    fi
    
    # Check build output
    if [ -f "out/extension.js" ]; then
        print_color $GREEN "✅ Build: Completed"
    else
        print_color $RED "❌ Build: Not completed"
    fi
    
    echo
    if [ -f ".env" ]; then
        print_color $BLUE "Environment Configuration:"
        grep -E "^COLAB_EXTENSION_" .env | sed 's/COLAB_EXTENSION_CLIENT_NOT_SO_SECRET=.*/COLAB_EXTENSION_CLIENT_NOT_SO_SECRET=***/' | sed 's/^/  /'
    fi
}

# Main command handling
case "${1:-help}" in
    "setup")
        setup
        ;;
    "config")
        print_header
        check_node
        print_color $YELLOW "⚙️  Generating configuration..."
        npm run generate:config
        print_color $GREEN "✅ Configuration generated"
        ;;
    "build")
        print_header
        check_node
        if ! check_dependencies; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "🔨 Building project..."
        npm run build:extension
        print_color $GREEN "✅ Build completed"
        ;;
    "demo")
        print_header
        check_node
        if ! check_dependencies || ! check_config; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "🚀 Running simple client demo..."
        npx tsx simple-colab-client.ts demo
        ;;
    "example")
        print_header
        check_node
        if ! check_dependencies || ! check_config; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "📚 Running example usage script..."
        npx tsx example-usage.ts
        ;;
    "auth")
        print_header
        check_node
        if ! check_dependencies || ! check_config; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "🔐 Starting authentication flow..."
        npx tsx simple-colab-client.ts auth
        ;;
    "test-auth")
        print_header
        check_node
        if ! check_dependencies || ! check_config; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "🧪 Testing with dummy token..."
        npx tsx simple-colab-client.ts test-auth
        ;;
    "watch")
        print_header
        check_node
        if ! check_dependencies; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "👀 Starting watch mode..."
        npm run watch:extension
        ;;
    "typecheck")
        print_header
        check_node
        if ! check_dependencies; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "🔍 Running type checking..."
        npm run typecheck
        ;;
    "lint")
        print_header
        check_node
        if ! check_dependencies; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "🧹 Running linter..."
        npm run lint
        ;;
    "test")
        print_header
        check_node
        if ! check_dependencies; then
            print_color $RED "❌ Please run '$0 setup' first"
            exit 1
        fi
        print_color $YELLOW "🧪 Running tests..."
        npm run test:unit
        ;;
    "status")
        status
        ;;
    "help"|*)
        show_usage
        ;;
esac