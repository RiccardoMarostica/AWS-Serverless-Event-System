export const environment = {
  production: true,
  apiUrl: 'https://staging-api-gateway-url.amazonaws.com/dev', // Staging API Gateway URL
  apiKey: 'REPLACE_WITH_STAGING_API_KEY',
  // Security configuration
  security: {
    enforceHttps: true, // Enforce HTTPS in staging
    enableCSP: true,
    sanitizeInputs: true,
    validateApiKey: true
  },
  // Additional staging-specific settings
  enableDebugMode: true, // Allow some debugging in staging
  logLevel: 'warn' // More verbose logging than production
};