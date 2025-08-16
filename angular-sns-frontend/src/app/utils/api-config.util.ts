import { environment } from '../../environments/environment';

export class ApiConfigUtil {
  /**
   * Get the full API endpoint URL
   * @param endpoint The endpoint path (e.g., '/subscribe')
   * @returns Full URL to the API endpoint
   */
  static getEndpointUrl(endpoint: string): string {
    const baseUrl = environment.apiUrl.endsWith('/') 
      ? environment.apiUrl.slice(0, -1) 
      : environment.apiUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  /**
   * Check if the current environment is production
   * @returns True if running in production mode
   */
  static isProduction(): boolean {
    return environment.production;
  }

  /**
   * Get API configuration object
   * @returns API configuration with base URL and key
   */
  static getApiConfig() {
    return {
      baseUrl: environment.apiUrl,
      apiKey: environment.apiKey,
      timeout: 30000
    };
  }

  /**
   * Validate API configuration
   * @returns True if API configuration is valid
   */
  static validateConfig(): boolean {
    return !!(environment.apiUrl && environment.apiKey);
  }
}