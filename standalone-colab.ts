#!/usr/bin/env tsx

/**
 * Standalone Colab Client Runner (TypeScript version)
 * 
 * This script demonstrates how to run the Google Colab plugin logic
 * outside of VSCode using Node.js directly.
 */

import { ColabClient, TooManyAssignmentsError, InsufficientQuotaError, DenylistedError } from './src/colab/client';
import { CONFIG } from './src/colab-config';
import { OAuth2Client } from 'google-auth-library';
import { Variant } from './src/colab/api';
import { randomUUID } from 'crypto';

class StandaloneColabRunner {
  private authClient: OAuth2Client;
  private colabClient: ColabClient;
  private accessToken: string | null = null;

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
  }

  private async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }
    return this.accessToken;
  }

  async authenticate(): Promise<string> {
    console.log('🔐 Starting authentication flow...');
    
    // Generate a random state parameter for security
    const state = randomUUID();
    
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

  async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
    console.log('✅ Access token set successfully');
  }

  async getSubscriptionTier(): Promise<any> {
    try {
      console.log('📊 Getting subscription tier...');
      const tier = await this.colabClient.getSubscriptionTier();
      console.log(`Subscription tier: ${tier}`);
      return tier;
    } catch (error: any) {
      console.error('❌ Error getting subscription tier:', error.message);
      throw error;
    }
  }

  async getCcuInfo(): Promise<any> {
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
    } catch (error: any) {
      console.error('❌ Error getting CCU info:', error.message);
      throw error;
    }
  }

  async listAssignments(): Promise<any[]> {
    try {
      console.log('📋 Listing current assignments...');
      const assignments = await this.colabClient.listAssignments();
      console.log(`Found ${assignments.length} assignments:`);
      assignments.forEach((assignment, index) => {
        console.log(`  ${index + 1}. ${assignment.endpoint} (${assignment.variant})`);
      });
      return assignments;
    } catch (error: any) {
      console.error('❌ Error listing assignments:', error.message);
      throw error;
    }
  }

  async assignServer(variant: Variant = Variant.DEFAULT, accelerator?: string): Promise<any> {
    try {
      console.log(`🚀 Assigning ${variant} server${accelerator ? ` with ${accelerator}` : ''}...`);
      
      // Generate a random notebook hash (in real usage, this would be based on the actual notebook)
      const notebookHash = randomUUID();
      
      const result = await this.colabClient.assign(notebookHash, variant, accelerator);
      console.log('✅ Server assigned successfully:', {
        endpoint: result.assignment.endpoint,
        variant: result.assignment.variant,
        isNew: result.isNew
      });
      return result;
    } catch (error: any) {
      if (error instanceof TooManyAssignmentsError) {
        console.error('❌ Too many assignments. Please unassign some servers first.');
      } else if (error instanceof InsufficientQuotaError) {
        console.error('❌ Insufficient quota to assign this server.');
      } else if (error instanceof DenylistedError) {
        console.error('❌ Account has been blocked from accessing Colab servers.');
      } else {
        console.error('❌ Error assigning server:', error.message);
      }
      throw error;
    }
  }

  async unassignServer(endpoint: string): Promise<void> {
    try {
      console.log(`🗑️  Unassigning server: ${endpoint}...`);
      await this.colabClient.unassign(endpoint);
      console.log('✅ Server unassigned successfully');
    } catch (error: any) {
      console.error('❌ Error unassigning server:', error.message);
      throw error;
    }
  }

  async sendKeepAlive(endpoint: string): Promise<void> {
    try {
      console.log(`💓 Sending keep-alive to: ${endpoint}...`);
      await this.colabClient.sendKeepAlive(endpoint);
      console.log('✅ Keep-alive sent successfully');
    } catch (error: any) {
      console.error('❌ Error sending keep-alive:', error.message);
      throw error;
    }
  }

  async runDemo(): Promise<void> {
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

      console.log('\n🔧 Configuration:');
      console.log(`- Environment: ${CONFIG.Environment}`);
      console.log(`- Colab API Domain: ${CONFIG.ColabApiDomain}`);
      console.log(`- Colab GAPI Domain: ${CONFIG.ColabGapiDomain}`);
      console.log(`- Client ID: ${CONFIG.ClientId.substring(0, 20)}...`);

    } catch (error: any) {
      console.error('❌ Demo failed:', error.message);
    }
  }
}

// CLI interface
async function main(): Promise<void> {
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
      console.log('Use: runner.setAccessToken("your_token") then call runner.getSubscriptionTier()');
      break;
    
    case 'ccu':
      // This would require a valid access token
      console.log('⚠️  This command requires authentication first');
      console.log('Use: runner.setAccessToken("your_token") then call runner.getCcuInfo()');
      break;
    
    case 'list':
      // This would require a valid access token
      console.log('⚠️  This command requires authentication first');
      console.log('Use: runner.setAccessToken("your_token") then call runner.listAssignments()');
      break;
    
    default:
      console.log('🎯 Google Colab Standalone Client');
      console.log('Usage: tsx standalone-colab.ts <command>');
      console.log('   or: npx tsx standalone-colab.ts <command>');
      console.log('');
      console.log('Commands:');
      console.log('  demo        - Run the full demo');
      console.log('  auth        - Start authentication flow');
      console.log('  subscription- Get subscription tier (requires auth)');
      console.log('  ccu         - Get CCU information (requires auth)');
      console.log('  list        - List assignments (requires auth)');
      console.log('');
      console.log('Example: tsx standalone-colab.ts demo');
      break;
  }
}

// Export for programmatic use
export { StandaloneColabRunner };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}