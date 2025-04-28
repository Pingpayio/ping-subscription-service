/**
 * Environment variables and configuration settings
 */
export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // NEAR Contract
  contractId: process.env.CONTRACT_ID,
  signerId: process.env.SIGNER_ID,
  secretKey: process.env.SECRET_KEY,

  // TEE
  dstackSimulatorEndpoint: process.env.DSTACK_SIMULATOR_ENDPOINT,
  nextPublicAccountId: process.env.NEXT_PUBLIC_accountId,

  // Scheduler
  schedulerApiUrl: process.env.SCHEDULER_API_URL,

  // Static Files
  staticPaths: {
    public: './public',
    assets: './dist/assets',
    indexHtml: process.env.NODE_ENV === 'production'
      ? './dist/index.html'
      : './frontend/index.html',
  },

  // CORS
  cors: {
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  },

  /**
   * Validate required environment variables
   */
  validate() {
    const required = ['CONTRACT_ID', 'SIGNER_ID', 'SECRET_KEY', 'SCHEDULER_API_URL'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.warn(
        'Missing required environment variables:',
        missing.join(', ')
      );
      return false;
    }

    return true;
  },

  /**
   * Initialize configuration
   */
  init() {
    // Validate environment variables
    this.validate();

    // Initialize SDK
    if (this.contractId) {
      console.log(`SDK initialized with contract: ${this.contractId}`);
    }

    if (this.signerId && this.secretKey) {
      console.log(`SDK initialized with account: ${this.signerId}`);
    }
  },
};
