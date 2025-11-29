#!/usr/bin/env tsx

/**
 * Simple Colab Client Runner
 * 
 * This script demonstrates the core Colab API functionality
 * without VSCode dependencies.
 */

import { OAuth2Client } from 'google-auth-library';
import fetch, { Request, RequestInit, Headers } from 'node-fetch';
import { randomUUID } from 'crypto';
import * as https from 'https';
import { z } from 'zod';

// Import the configuration
import { CONFIG } from './src/colab-config';

// Simplified API types (extracted from the main API file)
export enum Variant {
  DEFAULT = "DEFAULT",
  GPU = "GPU",
  TPU = "TPU",
}

export enum SubscriptionTier {
  NONE = 0,
  PRO = 1,
  PRO_PLUS = 2,
}

// Headers
const ACCEPT_JSON_HEADER = { key: 'Accept', value: 'application/json' };
const AUTHORIZATION_HEADER = { key: 'Authorization', value: '' };
const COLAB_CLIENT_AGENT_HEADER = { key: 'X-Colab-Client-Agent', value: 'vscode-extension' };
const COLAB_XSRF_TOKEN_HEADER = { key: 'X-Colab-Xsrf-Token', value: '' };
const COLAB_TUNNEL_HEADER = { key: 'X-Colab-Tunnel', value: 'true' };
const COLAB_RUNTIME_PROXY_TOKEN_HEADER = { key: 'X-Colab-Runtime-Proxy-Token', value: '' };

const XSSI_PREFIX = ")]}'\n";
const TUN_ENDPOINT = "/tun/m";

// Simplified schemas
const CcuInfoSchema = z.object({
  currentBalance: z.number(),
  consumptionRateHourly: z.number(),
  assignmentsCount: z.number(),
  eligibleGpus: z.array(z.string()),
  eligibleTpus: z.array(z.string()),
});

const UserInfoSchema = z.object({
  subscriptionTier: z.number().transform((tier) => tier as SubscriptionTier),
});

const AssignmentSchema = z.object({
  endpoint: z.string(),
  variant: z.string(),
  shape: z.number().optional(),
});

const ListedAssignmentsSchema = z.object({
  assignments: z.array(AssignmentSchema),
});

/**
 * Simplified Colab Client
 */
class SimpleColabClient {
  private readonly httpsAgent?: https.Agent;

  constructor(
    private readonly colabDomain: URL,
    private readonly colabGapiDomain: URL,
    private getAccessToken: () => Promise<string>,
  ) {
    // Allow self-signed certificates for local development
    if (colabDomain.hostname === "localhost") {
      this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
  }

  async getSubscriptionTier(signal?: AbortSignal): Promise<SubscriptionTier> {
    const userInfo = await this.issueRequest(
      new URL("v1/user-info", this.colabGapiDomain),
      { method: "GET", signal },
      UserInfoSchema,
    );
    return userInfo.subscriptionTier;
  }

  async getCcuInfo(signal?: AbortSignal): Promise<any> {
    return this.issueRequest(
      new URL(`${TUN_ENDPOINT}/ccu-info`, this.colabDomain),
      { method: "GET", signal },
      CcuInfoSchema,
    );
  }

  async listAssignments(signal?: AbortSignal): Promise<any[]> {
    const assignments = await this.issueRequest(
      new URL(`${TUN_ENDPOINT}/assignments`, this.colabDomain),
      { method: "GET", signal },
      ListedAssignmentsSchema,
    );
    return assignments.assignments;
  }

  async sendKeepAlive(endpoint: string, signal?: AbortSignal): Promise<void> {
    await this.issueRequest(
      new URL(`${TUN_ENDPOINT}/${endpoint}/keep-alive/`, this.colabDomain),
      {
        method: "GET",
        headers: { [COLAB_TUNNEL_HEADER.key]: COLAB_TUNNEL_HEADER.value },
        signal,
      },
    );
  }

  private async issueRequest<T extends z.ZodType>(
    endpoint: URL,
    init: RequestInit,
    schema: T,
  ): Promise<z.infer<T>>;

  private async issueRequest(endpoint: URL, init: RequestInit): Promise<void>;

  private async issueRequest(
    endpoint: URL,
    init: RequestInit,
    schema?: z.ZodType,
  ): Promise<unknown> {
    // The Colab API requires the authuser parameter to be set.
    if (endpoint.hostname === this.colabDomain.hostname) {
      endpoint.searchParams.append("authuser", "0");
    }
    
    const token = await this.getAccessToken();
    const requestHeaders = new Headers(init.headers);
    requestHeaders.set(ACCEPT_JSON_HEADER.key, ACCEPT_JSON_HEADER.value);
    requestHeaders.set(AUTHORIZATION_HEADER.key, `Bearer ${token}`);
    requestHeaders.set(
      COLAB_CLIENT_AGENT_HEADER.key,
      COLAB_CLIENT_AGENT_HEADER.value,
    );
    
    const request = new Request(endpoint, {
      ...init,
      headers: requestHeaders,
      agent: this.httpsAgent,
    });
    
    const response = await fetch(request);
    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.text();
      } catch {
        // Ignore errors reading the body
      }
      throw new Error(`Request failed: ${response.status} ${response.statusText}${errorBody ? `\nResponse: ${errorBody}` : ''}`);
    }
    
    if (!schema) {
      return;
    }

    const body = await response.text();
    return schema.parse(JSON.parse(stripXssiPrefix(body)));
  }
}

function stripXssiPrefix(v: string): string {
  if (!v.startsWith(XSSI_PREFIX)) {
    return v;
  }
  return v.slice(XSSI_PREFIX.length);
}

/**
 * Simple Colab Runner
 */
class SimpleColabRunner {
  private authClient: OAuth2Client;
  private colabClient: SimpleColabClient;
  private accessToken: string | null = null;

  constructor() {
    this.authClient = new OAuth2Client(
      CONFIG.ClientId,
      CONFIG.ClientNotSoSecret
    );
    
    this.colabClient = new SimpleColabClient(
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
    
    const state = randomUUID();
    
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
    console.log('\n⚠️  Note: You\'ll need to complete the OAuth flow to get an access token.');
    
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
    console.log('🎯 Google Colab Simple Client Demo');
    console.log('==================================\n');

    try {
      console.log('⚠️  This demo requires authentication. To use this client:');
      console.log('1. Complete the OAuth flow to get an access token');
      console.log('2. Set the access token using setAccessToken()');
      console.log('3. Then call the various Colab API methods\n');

      const authUrl = await this.authenticate();
      
      console.log('\n📝 Available methods after authentication:');
      console.log('- getSubscriptionTier(): Get user\'s subscription level');
      console.log('- getCcuInfo(): Get Colab Compute Units information');
      console.log('- listAssignments(): List current server assignments');
      console.log('- sendKeepAlive(endpoint): Send keep-alive to a server');

      console.log('\n🔧 Configuration:');
      console.log(`- Environment: ${CONFIG.Environment}`);
      console.log(`- Colab API Domain: ${CONFIG.ColabApiDomain}`);
      console.log(`- Colab GAPI Domain: ${CONFIG.ColabGapiDomain}`);
      console.log(`- Client ID: ${CONFIG.ClientId.substring(0, 20)}...`);

      console.log('\n💡 Example usage:');
      console.log('```javascript');
      console.log('const runner = new SimpleColabRunner();');
      console.log('await runner.setAccessToken("your_access_token_here");');
      console.log('const tier = await runner.getSubscriptionTier();');
      console.log('const ccuInfo = await runner.getCcuInfo();');
      console.log('const assignments = await runner.listAssignments();');
      console.log('```');

    } catch (error: any) {
      console.error('❌ Demo failed:', error.message);
    }
  }
}

// CLI interface
async function main(): Promise<void> {
  const runner = new SimpleColabRunner();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'auth':
      await runner.authenticate();
      break;
    
    case 'demo':
      await runner.runDemo();
      break;
    
    case 'test-auth':
      // Test with a dummy token (will fail but shows the flow)
      console.log('🧪 Testing with dummy token (will fail)...');
      await runner.setAccessToken('dummy_token');
      try {
        await runner.getSubscriptionTier();
      } catch (error: any) {
        console.log('Expected error (invalid token):', error.message);
      }
      break;
    
    default:
      console.log('🎯 Google Colab Simple Client');
      console.log('Usage: tsx simple-colab-client.ts <command>');
      console.log('');
      console.log('Commands:');
      console.log('  demo        - Run the full demo');
      console.log('  auth        - Start authentication flow');
      console.log('  test-auth   - Test with dummy token (will fail)');
      console.log('');
      console.log('Example: tsx simple-colab-client.ts demo');
      break;
  }
}

// Export for programmatic use
export { SimpleColabRunner, SimpleColabClient };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}