#!/usr/bin/env node

/**
 * Google Colab Standalone Client Runner
 * 
 * This Node.js CLI tool provides easy access to all Colab client functionality
 * Usage: node run-colab.js <command> [options]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Utility functions
function printColor(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function printHeader() {
  console.log();
  printColor('blue', '🎯 Google Colab Standalone Client');
  printColor('blue', '==================================');
  console.log();
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      printColor('red', `❌ Node.js version 18+ is required. Current version: ${version}`);
      process.exit(1);
    }
    
    printColor('green', `✅ Node.js ${version} detected`);
    return true;
  } catch (error) {
    printColor('red', '❌ Error checking Node.js version');
    process.exit(1);
  }
}

function checkDependencies() {
  return fs.existsSync('node_modules');
}

function checkConfig() {
  return fs.existsSync('src/colab-config.ts');
}

function checkEnvFile() {
  return fs.existsSync('.env');
}

function checkBuildOutput() {
  return fs.existsSync('out/extension.js');
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    if (!options.silent) {
      printColor('red', `❌ Command failed: ${command}`);
      printColor('red', error.message);
    }
    if (options.exitOnError !== false) {
      process.exit(1);
    }
    return null;
  }
}

function showUsage() {
  printHeader();
  console.log('Usage: node run-colab.js <command> [options]');
  console.log();
  printColor('yellow', 'Available Commands:');
  console.log();
  printColor('green', 'Setup Commands:');
  console.log('  setup           - Install dependencies and configure environment');
  console.log('  config          - Generate configuration from .env file');
  console.log('  build           - Build the TypeScript project');
  console.log();
  printColor('green', 'Demo Commands:');
  console.log('  demo            - Run the simple client demo');
  console.log('  example         - Run the example usage script');
  console.log('  auth            - Start authentication flow');
  console.log('  test-auth       - Test with dummy token (shows error handling)');
  console.log();
  printColor('green', 'Development Commands:');
  console.log('  watch           - Build and watch for changes');
  console.log('  typecheck       - Run TypeScript type checking');
  console.log('  lint            - Run linting');
  console.log('  test            - Run unit tests');
  console.log();
  printColor('green', 'Information Commands:');
  console.log('  help            - Show this help message');
  console.log('  status          - Show project status');
  console.log();
  printColor('yellow', 'Examples:');
  console.log('  node run-colab.js setup        # First-time setup');
  console.log('  node run-colab.js demo         # Run the demo');
  console.log('  node run-colab.js auth         # Get authentication URL');
  console.log();
}

function setup() {
  printHeader();
  printColor('blue', 'Setting up Google Colab Standalone Client...');
  
  checkNodeVersion();
  
  printColor('yellow', '📦 Installing dependencies...');
  runCommand('npm install');
  
  if (!checkEnvFile()) {
    printColor('yellow', '📝 Creating .env file from template...');
    if (fs.existsSync('.env.template')) {
      fs.copyFileSync('.env.template', '.env');
    } else {
      // Create a basic .env template
      const envTemplate = `# Google Colab Extension Configuration
COLAB_EXTENSION_ENVIRONMENT=production
COLAB_EXTENSION_CLIENT_ID=your_client_id_here
COLAB_EXTENSION_CLIENT_NOT_SO_SECRET=your_client_secret_here
`;
      fs.writeFileSync('.env', envTemplate);
    }
    printColor('yellow', '⚠️  Please edit .env file with your OAuth credentials');
  }
  
  printColor('yellow', '⚙️  Generating configuration...');
  runCommand('npm run generate:config');
  
  printColor('yellow', '🔨 Building project...');
  runCommand('npm run build:extension');
  
  printColor('green', '✅ Setup completed successfully!');
  console.log();
  printColor('yellow', 'Next steps:');
  console.log('1. Edit .env file with your Google OAuth credentials');
  console.log('2. Run \'node run-colab.js demo\' to test the client');
  console.log('3. Run \'node run-colab.js auth\' to start authentication flow');
}

function showStatus() {
  printHeader();
  printColor('blue', 'Project Status:');
  console.log();
  
  // Check Node.js
  try {
    const version = process.version;
    printColor('green', `✅ Node.js: ${version}`);
  } catch (error) {
    printColor('red', '❌ Node.js: Error getting version');
  }
  
  // Check npm
  try {
    const npmVersion = runCommand('npm --version', { silent: true, exitOnError: false });
    if (npmVersion) {
      printColor('green', `✅ npm: ${npmVersion.trim()}`);
    } else {
      printColor('red', '❌ npm: Not available');
    }
  } catch (error) {
    printColor('red', '❌ npm: Not available');
  }
  
  // Check dependencies
  if (checkDependencies()) {
    printColor('green', '✅ Dependencies: Installed');
  } else {
    printColor('red', '❌ Dependencies: Not installed');
  }
  
  // Check .env file
  if (checkEnvFile()) {
    printColor('green', '✅ Environment: .env file exists');
  } else {
    printColor('red', '❌ Environment: .env file missing');
  }
  
  // Check config
  if (checkConfig()) {
    printColor('green', '✅ Configuration: Generated');
  } else {
    printColor('red', '❌ Configuration: Not generated');
  }
  
  // Check build output
  if (checkBuildOutput()) {
    printColor('green', '✅ Build: Completed');
  } else {
    printColor('red', '❌ Build: Not completed');
  }
  
  console.log();
  if (checkEnvFile()) {
    printColor('blue', 'Environment Configuration:');
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      const envLines = envContent.split('\n')
        .filter(line => line.startsWith('COLAB_EXTENSION_'))
        .map(line => line.replace(/COLAB_EXTENSION_CLIENT_NOT_SO_SECRET=.*/, 'COLAB_EXTENSION_CLIENT_NOT_SO_SECRET=***'))
        .map(line => `  ${line}`);
      envLines.forEach(line => console.log(line));
    } catch (error) {
      printColor('red', '  Error reading .env file');
    }
  }
}

function runDemo() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies() || !checkConfig()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '🚀 Running simple client demo...');
  runCommand('npx tsx simple-colab-client.ts demo');
}

function runExample() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies() || !checkConfig()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '📚 Running example usage script...');
  runCommand('npx tsx example-usage.ts');
}

function runAuth() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies() || !checkConfig()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '🔐 Starting authentication flow...');
  runCommand('npx tsx simple-colab-client.ts auth');
}

function runTestAuth() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies() || !checkConfig()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '🧪 Testing with dummy token...');
  runCommand('npx tsx simple-colab-client.ts test-auth');
}

function runConfig() {
  printHeader();
  checkNodeVersion();
  printColor('yellow', '⚙️  Generating configuration...');
  runCommand('npm run generate:config');
  printColor('green', '✅ Configuration generated');
}

function runBuild() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '🔨 Building project...');
  runCommand('npm run build:extension');
  printColor('green', '✅ Build completed');
}

function runWatch() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '👀 Starting watch mode...');
  runCommand('npm run watch:extension');
}

function runTypecheck() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '🔍 Running type checking...');
  runCommand('npm run typecheck');
}

function runLint() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '🧹 Running linter...');
  runCommand('npm run lint');
}

function runTest() {
  printHeader();
  checkNodeVersion();
  
  if (!checkDependencies()) {
    printColor('red', '❌ Please run \'node run-colab.js setup\' first');
    process.exit(1);
  }
  
  printColor('yellow', '🧪 Running tests...');
  runCommand('npm run test:unit');
}

// Main command handling
function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'setup':
      setup();
      break;
    case 'config':
      runConfig();
      break;
    case 'build':
      runBuild();
      break;
    case 'demo':
      runDemo();
      break;
    case 'example':
      runExample();
      break;
    case 'auth':
      runAuth();
      break;
    case 'test-auth':
      runTestAuth();
      break;
    case 'watch':
      runWatch();
      break;
    case 'typecheck':
      runTypecheck();
      break;
    case 'lint':
      runLint();
      break;
    case 'test':
      runTest();
      break;
    case 'status':
      showStatus();
      break;
    case 'help':
    default:
      showUsage();
      break;
  }
}

// Run the CLI
if (require.main === module) {
  main();
}

module.exports = {
  setup,
  showStatus,
  runDemo,
  runExample,
  runAuth,
  runTestAuth,
  runConfig,
  runBuild,
  runWatch,
  runTypecheck,
  runLint,
  runTest
};