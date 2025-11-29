#!/usr/bin/env tsx

/**
 * Example Usage of the Standalone Colab Client
 * 
 * This script demonstrates how to use the Colab client programmatically
 * in your own Node.js applications.
 */

import { SimpleColabRunner } from './simple-colab-client';

async function exampleUsage() {
  console.log('🎯 Colab Client Example Usage');
  console.log('=============================\n');

  // Create a new runner instance
  const runner = new SimpleColabRunner();

  try {
    // Step 1: Authentication
    console.log('Step 1: Authentication');
    console.log('----------------------');
    
    // In a real application, you would:
    // 1. Get the auth URL
    const authUrl = await runner.authenticate();
    
    // 2. Redirect user to authUrl or open it in browser
    // 3. Handle the OAuth callback to get authorization code
    // 4. Exchange authorization code for access token
    // 5. Set the access token
    
    console.log('🔗 Auth URL generated successfully\n');

    // For this demo, we'll simulate setting a token
    // In reality, you'd get this from the OAuth flow
    console.log('Step 2: Setting Access Token (Demo)');
    console.log('-----------------------------------');
    console.log('⚠️  In a real app, you would get this from OAuth flow');
    
    // This will fail with 401, but shows the API structure
    await runner.setAccessToken('demo_token_will_fail');
    console.log('✅ Token set (demo)\n');

    // Step 3: API Calls (will fail due to invalid token, but shows structure)
    console.log('Step 3: Making API Calls');
    console.log('------------------------');
    
    try {
      console.log('📊 Attempting to get subscription tier...');
      const tier = await runner.getSubscriptionTier();
      console.log(`✅ Subscription tier: ${tier}`);
    } catch (error: any) {
      console.log(`❌ Expected error (invalid token): ${error.message.split('\n')[0]}`);
    }

    try {
      console.log('\n💰 Attempting to get CCU info...');
      const ccuInfo = await runner.getCcuInfo();
      console.log('✅ CCU Info retrieved:', ccuInfo);
    } catch (error: any) {
      console.log(`❌ Expected error (invalid token): ${error.message.split('\n')[0]}`);
    }

    try {
      console.log('\n📋 Attempting to list assignments...');
      const assignments = await runner.listAssignments();
      console.log(`✅ Found ${assignments.length} assignments`);
    } catch (error: any) {
      console.log(`❌ Expected error (invalid token): ${error.message.split('\n')[0]}`);
    }

  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
  }

  console.log('\n📝 Real Implementation Notes:');
  console.log('============================');
  console.log('1. Implement OAuth 2.0 callback server to handle authorization');
  console.log('2. Exchange authorization code for access token');
  console.log('3. Store and refresh tokens as needed');
  console.log('4. Handle API rate limits and errors gracefully');
  console.log('5. Implement proper error handling and retry logic');
}

async function realWorldExample() {
  console.log('\n\n🌍 Real-World Integration Example');
  console.log('=================================\n');

  console.log('```typescript');
  console.log('// Real-world integration example');
  console.log('import { SimpleColabRunner } from "./simple-colab-client";');
  console.log('import express from "express";');
  console.log('');
  console.log('const app = express();');
  console.log('const runner = new SimpleColabRunner();');
  console.log('');
  console.log('// OAuth callback endpoint');
  console.log('app.get("/auth/callback", async (req, res) => {');
  console.log('  const { code } = req.query;');
  console.log('  ');
  console.log('  // Exchange code for access token');
  console.log('  const token = await exchangeCodeForToken(code);');
  console.log('  await runner.setAccessToken(token);');
  console.log('  ');
  console.log('  res.send("Authentication successful!");');
  console.log('});');
  console.log('');
  console.log('// API endpoint to get Colab info');
  console.log('app.get("/api/colab/info", async (req, res) => {');
  console.log('  try {');
  console.log('    const [tier, ccuInfo, assignments] = await Promise.all([');
  console.log('      runner.getSubscriptionTier(),');
  console.log('      runner.getCcuInfo(),');
  console.log('      runner.listAssignments()');
  console.log('    ]);');
  console.log('    ');
  console.log('    res.json({ tier, ccuInfo, assignments });');
  console.log('  } catch (error) {');
  console.log('    res.status(500).json({ error: error.message });');
  console.log('  }');
  console.log('});');
  console.log('');
  console.log('app.listen(3000, () => {');
  console.log('  console.log("Server running on http://localhost:3000");');
  console.log('});');
  console.log('```');
}

async function main() {
  await exampleUsage();
  await realWorldExample();
  
  console.log('\n🎉 Example completed!');
  console.log('\nNext steps:');
  console.log('1. Set up OAuth 2.0 credentials in Google Cloud Console');
  console.log('2. Implement the OAuth callback flow');
  console.log('3. Integrate the Colab client into your application');
  console.log('4. Handle authentication and token management');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}