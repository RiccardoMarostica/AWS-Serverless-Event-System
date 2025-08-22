export const environment = {
  production: true,
  apiUrl: 'https://p4nr9e8w96.execute-api.eu-west-1.amazonaws.com/dev', // Staging API Gateway URL
  apiKey: 'nXRGCkU1OT6gsnELBxYStWK3QgHagZa8L6VaidSg',
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