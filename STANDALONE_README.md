# Google Colab Standalone Client

This directory contains a standalone implementation of the Google Colab plugin logic that can be run from the terminal using Node.js, without requiring VSCode.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- Google OAuth 2.0 credentials configured

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy the template and fill in your credentials
   cp .env.template .env
   # Edit .env with your OAuth credentials
   ```

3. **Generate configuration:**
   ```bash
   npm run generate:config
   ```

4. **Build the project:**
   ```bash
   npm run build:extension
   ```

## 📋 Available Scripts

### Simple Colab Client (Recommended)

The `simple-colab-client.ts` provides a clean, dependency-free implementation:

```bash
# Run the demo
npx tsx simple-colab-client.ts demo

# Start authentication flow
npx tsx simple-colab-client.ts auth

# Test with dummy token (shows error handling)
npx tsx simple-colab-client.ts test-auth
```

### Full Extension Logic

The `standalone-colab.ts` uses the complete extension logic but requires more setup:

```bash
# Run the demo
npx tsx standalone-colab.ts demo

# Start authentication
npx tsx standalone-colab.ts auth
```

## 🔧 Configuration

The configuration is stored in `.env` and automatically generated into `src/colab-config.ts`:

```env
# Environment: "production", "sandbox", or "local"
COLAB_EXTENSION_ENVIRONMENT=production

# OAuth 2.0 credentials
COLAB_EXTENSION_CLIENT_ID=your_client_id_here
COLAB_EXTENSION_CLIENT_NOT_SO_SECRET=your_client_secret_here
```

## 🔐 Authentication

The client uses Google OAuth 2.0 for authentication. The flow works as follows:

1. **Generate Auth URL:** The client generates a Google OAuth URL
2. **User Authorization:** User visits the URL and grants permissions
3. **Get Access Token:** Extract the authorization code and exchange for access token
4. **Use Token:** Set the access token in the client to make API calls

### Example Authentication Flow

```typescript
import { SimpleColabRunner } from './simple-colab-client';

const runner = new SimpleColabRunner();

// 1. Get the authorization URL
const authUrl = await runner.authenticate();
console.log('Visit:', authUrl);

// 2. After user authorization, you'll get an access token
// (Implementation of OAuth callback server not included in this demo)

// 3. Set the access token
await runner.setAccessToken('your_access_token_here');

// 4. Now you can make API calls
const tier = await runner.getSubscriptionTier();
const ccuInfo = await runner.getCcuInfo();
const assignments = await runner.listAssignments();
```

## 📚 API Methods

### Core Methods

- **`getSubscriptionTier()`** - Get user's Colab subscription level (Free, Pro, Pro+)
- **`getCcuInfo()`** - Get Colab Compute Units information and usage
- **`listAssignments()`** - List current server assignments
- **`sendKeepAlive(endpoint)`** - Send keep-alive ping to a server

### Advanced Methods (Full Client Only)

- **`assignServer(variant, accelerator)`** - Assign a new server
- **`unassignServer(endpoint)`** - Unassign a server
- **`refreshConnection(endpoint)`** - Refresh server connection
- **`listKernels(server)`** - List kernels on a server
- **`listSessions(server)`** - List sessions on a server

## 🎯 Usage Examples

### Basic Usage

```typescript
import { SimpleColabRunner } from './simple-colab-client';

async function main() {
  const runner = new SimpleColabRunner();
  
  // Set your access token (obtained through OAuth flow)
  await runner.setAccessToken('your_access_token');
  
  try {
    // Get subscription information
    const tier = await runner.getSubscriptionTier();
    console.log('Subscription tier:', tier);
    
    // Get compute units info
    const ccuInfo = await runner.getCcuInfo();
    console.log('CCU Balance:', ccuInfo.currentBalance);
    console.log('Hourly consumption:', ccuInfo.consumptionRateHourly);
    
    // List current assignments
    const assignments = await runner.listAssignments();
    console.log('Active assignments:', assignments.length);
    
    // Send keep-alive to servers
    for (const assignment of assignments) {
      await runner.sendKeepAlive(assignment.endpoint);
    }
    
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

main();
```

### Programmatic Usage

```typescript
import { SimpleColabClient } from './simple-colab-client';

// Create client with custom token provider
const client = new SimpleColabClient(
  new URL('https://colab.research.google.com'),
  new URL('https://colab.pa.googleapis.com'),
  async () => {
    // Your custom token retrieval logic
    return await getAccessTokenFromSomewhere();
  }
);

// Use the client
const ccuInfo = await client.getCcuInfo();
```

## 🛠️ Development

### Project Structure

```
├── simple-colab-client.ts     # Simplified standalone client
├── standalone-colab.ts        # Full extension logic client
├── src/                       # Original VSCode extension source
│   ├── colab/                 # Colab API client and logic
│   ├── auth/                  # Authentication handling
│   └── config/                # Configuration management
├── .env                       # Environment configuration
└── package.json               # Dependencies and scripts
```

### Building

```bash
# Build extension
npm run build:extension

# Build with watch mode
npm run watch:extension

# Type checking
npm run typecheck
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Make sure you've run `npm install`
   - Ensure `src/colab-config.ts` exists (run `npm run generate:config`)

2. **Authentication errors**
   - Verify your OAuth credentials in `.env`
   - Make sure the redirect URI matches your OAuth app configuration
   - Check that the required scopes are granted

3. **API errors**
   - Ensure you have a valid access token
   - Check that your Google account has access to Colab
   - Verify the API endpoints are correct for your environment

### Debug Mode

Set environment variable for verbose logging:

```bash
DEBUG=colab:* npx tsx simple-colab-client.ts demo
```

## 📄 License

This project is licensed under the Apache 2.0 License - see the original LICENSE file for details.

## 🤝 Contributing

This is a demonstration of how to extract and use the Colab plugin logic outside of VSCode. For the main project, please refer to the original repository.

## ⚠️ Disclaimer

This standalone client is for educational and development purposes. Make sure to comply with Google's Terms of Service and API usage policies when using this client.