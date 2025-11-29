#!/usr/bin/env node

/**
 * Standalone Colab Client Runner
 * 
 * This script demonstrates how to run the Google Colab plugin logic
 * outside of VSCode using Node.js directly.
 */

const { ColabClient } = require('./out/colab/client.js');
const { CONFIG } = require('./out/colab-config.js');
const { OAuth2Client } = require('google-auth-library');
const { Variant } = require('./out/colab/api.js');
const crypto = require('crypto');

class StandaloneColabRunner {
  constructor() {
    this.authClient = new OAuth2Client(
      CONFIG.ClientId,
      CONFIG.ClientNotSoSecret
    );
    
    this.colabClient = new ColabClient(
      new URL(CONFIG.ColabApiDomain),
      new URL(CONFIG.ColabGapiDomain),
      () => this.getAccessToken()
    );
    
    this.accessToken = null;
  }

  async getAccessToken() {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }
    return this.accessToken;
  }

  async authenticate() {
    console.log('🔐 Starting authentication flow...');
    
    // Generate a random state parameter for security
    const state = crypto.randomBytes(32).toString('hex');
    
    // Create the authorization URL
    const authUrl = this.authClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/colab'
      ],
      state: state,
      redirect_uri: 'http://localhost:8080/callback'
    });

    console.log('\n📋 Please visit this URL to authenticate:');
    console.log(authUrl);
    console.log('\n⚠️  Note: You\'ll need to set up a local callback server or manually extract the authorization code from the redirect URL.');
    console.log('For this demo, you would need to implement the OAuth flow completion.');
    
    return authUrl;
  }

  async setAccessToken(token) {
    this.accessToken = token;
    console.log('✅ Access token set successfully');
  }

  async getSubscriptionTier() {
    try {
      console.log('📊 Getting subscription tier...');
      const tier = await this.colabClient.getSubscriptionTier();
      console.log(`Subscription tier: ${tier}`);
      return tier;
    } catch (error) {
      console.error('❌ Error getting subscription tier:', error.message);
      throw error;
    }
  }

  async getCcuInfo() {
    try {
      console.log('💰 Getting CCU (Colab Compute Units) information...');
      const ccuInfo = await this.colabClient.getCcuInfo();
      console.log('CCU Info:', {
        currentBalance: ccuInfo.currentBalance,
        consumptionRateHourly: ccuInfo.consumptionRateHourly,
        assignmentsCount: ccuInfo.assignmentsCount,
        eligibleGpus: ccuInfo.eligibleGpus,
        eligibleTpus: ccuInfo.eligibleTpus
      });
      return ccuInfo;
    } catch (error) {
      console.error('❌ Error getting CCU info:', error.message);
      throw error;
    }
  }

  async listAssignments() {
    try {
      console.log('📋 Listing current assignments...');
      const assignments = await this.colabClient.listAssignments();
      console.log(`Found ${assignments.length} assignments:`);
      assignments.forEach((assignment, index) => {
        console.log(`  ${index + 1}. ${assignment.endpoint} (${assignment.variant})`);
      });
      return assignments;
    } catch (error) {
      console.error('❌ Error listing assignments:', error.message);
      throw error;
    }
  }

  async assignServer(variant = Variant.DEFAULT, accelerator = null) {
    try {
      console.log(`🚀 Assigning ${variant} server${accelerator ? ` with ${accelerator}` : ''}...`);
      
      // Generate a random notebook hash (in real usage, this would be based on the actual notebook)
      const notebookHash = crypto.randomUUID();
      
      const result = await this.colabClient.assign(notebookHash, variant, accelerator);
      console.log('✅ Server assigned successfully:', {
        endpoint: result.assignment.endpoint,
        variant: result.assignment.variant,
        isNew: result.isNew
      });
      return result;
    } catch (error) {
      console.error('❌ Error assigning server:', error.message);
      throw error;
    }
  }

  async unassignServer(endpoint) {
    try {
      console.log(`🗑️  Unassigning server: ${endpoint}...`);
      await this.colabClient.unassign(endpoint);
      console.log('✅ Server unassigned successfully');
    } catch (error) {
      console.error('❌ Error unassigning server:', error.message);
      throw error;
    }
  }

  async sendKeepAlive(endpoint) {
    try {
      console.log(`💓 Sending keep-alive to: ${endpoint}...`);
      await this.colabClient.sendKeepAlive(endpoint);
      console.log('✅ Keep-alive sent successfully');
    } catch (error) {
      console.error('❌ Error sending keep-alive:', error.message);
      throw error;
    }
  }

  async runDemo() {
    console.log('🎯 Google Colab Standalone Client Demo');
    console.log('=====================================\n');

    try {
      // Note: In a real implementation, you would need to complete the OAuth flow
      console.log('⚠️  This demo requires authentication. In a real implementation, you would:');
      console.log('1. Complete the OAuth flow to get an access token');
      console.log('2. Set the access token using setAccessToken()');
      console.log('3. Then call the various Colab API methods\n');

      // Generate auth URL for demonstration
      const authUrl = await this.authenticate();
      
      console.log('\n📝 Available methods after authentication:');
      console.log('- getSubscriptionTier(): Get user\'s subscription level');
      console.log('- getCcuInfo(): Get Colab Compute Units information');
      console.log('- listAssignments(): List current server assignments');
      console.log('- assignServer(variant, accelerator): Assign a new server');
      console.log('- unassignServer(endpoint): Unassign a server');
      console.log('- sendKeepAlive(endpoint): Send keep-alive to a server');

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const runner = new StandaloneColabRunner();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'auth':
      await runner.authenticate();
      break;
    
    case 'demo':
      await runner.runDemo();
      break;
    
    case 'subscription':
      // This would require a valid access token
      console.log('⚠️  This command requires authentication first');
      break;
    
    case 'ccu':
      // This would require a valid access token
      console.log('⚠️  This command requires authentication first');
      break;
    
    case 'list':
      // This would require a valid access token
      console.log('⚠️  This command requires authentication first');
      break;
    
    default:
      console.log('🎯 Google Colab Standalone Client');
      console.log('Usage: node standalone-colab.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  demo        - Run the full demo');
      console.log('  auth        - Start authentication flow');
      console.log('  subscription- Get subscription tier (requires auth)');
      console.log('  ccu         - Get CCU information (requires auth)');
      console.log('  list        - List assignments (requires auth)');
      console.log('');
      console.log('Example: node standalone-colab.js demo');
      break;
  }
}

// Export for programmatic use
module.exports = { StandaloneColabRunner };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}