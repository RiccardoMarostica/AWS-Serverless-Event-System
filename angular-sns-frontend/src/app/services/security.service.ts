import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  constructor() {
    this.initializeSecurity();
  }

  /**
   * Initialize security measures on service creation
   */
  private initializeSecurity(): void {
    if (environment.production) {
      this.enforceHttps();
      this.validateSecureContext();
    }
    
    if (environment.security?.enableCSP) {
      this.logCSPViolations();
    }
  }

  /**
   * Enforce HTTPS in production environment
   */
  enforceHttps(): void {
    if (environment.security?.enforceHttps && typeof window !== 'undefined') {
      const location = (window as any).location;
      if (location) {
        const currentProtocol = location.protocol;
        const currentHost = location.host;
        
        if (currentProtocol !== 'https:' && !this.isLocalhost(currentHost)) {
          console.warn('Redirecting to HTTPS for security');
          location.href = `https://${currentHost}${location.pathname}${location.search}`;
        }
      }
    }
  }

  /**
   * Validate that the application is running in a secure context
   */
  validateSecureContext(): boolean {
    if (typeof window !== 'undefined') {
      if ('isSecureContext' in window) {
        const isSecure = (window as any).isSecureContext;
        
        if (!isSecure && environment.production) {
          console.error('Application is not running in a secure context (HTTPS required)');
          return false;
        }
        
        return isSecure;
      }
      
      // Fallback check for older browsers
      if ((window as any).location) {
        const location = (window as any).location;
        return location.protocol === 'https:' || this.isLocalhost(location.hostname);
      }
    }
    
    return false;
  }

  /**
   * Check if the current host is localhost (for development)
   */
  private isLocalhost(host: string): boolean {
    return host === 'localhost' || 
           host === '127.0.0.1' || 
           host.startsWith('localhost:') ||
           host.startsWith('127.0.0.1:');
  }

  /**
   * Validate API key format and presence
   */
  validateApiKey(): boolean {
    const apiKey = environment.apiKey;
    
    if (!apiKey || apiKey.trim().length === 0) {
      console.error('API key is missing from environment configuration');
      return false;
    }
    
    // Check for placeholder values that should be replaced
    const placeholderPatterns = [
      'your-api-key',
      'your-production-api-key',
      'REPLACE_WITH_ACTUAL_API_KEY',
      'dev-api-key'
    ];
    
    if (environment.production && placeholderPatterns.includes(apiKey)) {
      console.error('Production API key appears to be a placeholder value');
      return false;
    }
    
    // Basic format validation (adjust based on your API key format)
    if (apiKey.length < 10) {
      console.warn('API key appears to be too short');
      return false;
    }
    
    return true;
  }

  /**
   * Get Content Security Policy directives
   */
  getCSPDirectives(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Angular requires unsafe-inline for now
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      `connect-src 'self' ${environment.apiUrl}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ];
    
    return directives.join('; ');
  }

  /**
   * Log CSP violations for monitoring
   */
  private logCSPViolations(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event) => {
        console.error('CSP Violation:', {
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          originalPolicy: event.originalPolicy,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
          columnNumber: event.columnNumber
        });
        
        // In production, you might want to send this to a logging service
        if (environment.production) {
          this.reportCSPViolation(event);
        }
      });
    }
  }

  /**
   * Report CSP violations to monitoring service
   */
  private reportCSPViolation(event: SecurityPolicyViolationEvent): void {
    // Implementation would depend on your monitoring/logging service
    // For example, sending to CloudWatch, Sentry, or other monitoring tools
    console.log('CSP violation reported:', event.violatedDirective);
  }

  /**
   * Check if current environment is secure for sensitive operations
   */
  isSecureEnvironment(): boolean {
    return this.validateSecureContext() && 
           this.validateApiKey() && 
           (environment.production ? this.isHttps() : true);
  }

  /**
   * Check if current connection is HTTPS
   */
  private isHttps(): boolean {
    if (typeof window !== 'undefined') {
      const location = (window as any).location;
      return location && location.protocol === 'https:';
    }
    return false;
  }

  /**
   * Generate security headers for HTTP requests
   */
  getSecurityHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {};
    
    // Add security headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    
    return headers;
  }

  /**
   * Validate that sensitive data is not being logged
   */
  sanitizeForLogging(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sensitiveFields = ['apiKey', 'password', 'token', 'secret', 'key'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}