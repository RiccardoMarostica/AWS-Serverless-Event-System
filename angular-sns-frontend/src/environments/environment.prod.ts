export const environment = {
  production: true,
  apiUrl: 'https://your-api-gateway-url.amazonaws.com/dev', // Production API Gateway URL
  // API key should be replaced during build process
  // Use build-time replacement or environment-specific configuration
  apiKey: 'REPLACE_WITH_ACTUAL_API_KEY',
  // Security configuration
  security: {
    enforceHttps: true, // Enforce HTTPS in production
    enableCSP: true,
    sanitizeInputs: true,
    validateApiKey: true
  },
  // Production-specific settings
  enableDebugMode: false, // Disable debugging in production
  logLevel: 'error' // Only log errors in production
};