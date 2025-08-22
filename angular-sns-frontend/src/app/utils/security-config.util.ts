import { environment } from '../../environments/environment';

export class SecurityConfigUtil {
  
  /**
   * Get CSP directives based on environment
   */
  static getCSPDirectives(): string {
    const baseDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Angular requires unsafe-inline
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ];

    // Add API URL to connect-src
    if (environment.apiUrl) {
      baseDirectives.push(`connect-src 'self' ${environment.apiUrl}`);
    }

    // Add upgrade-insecure-requests in production
    if (environment.production) {
      baseDirectives.push("upgrade-insecure-requests");
    }

    return baseDirectives.join('; ');
  }

  /**
   * Get security headers for HTTP responses
   */
  static getSecurityHeaders(): { [key: string]: string } {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': environment.production ? 'max-age=31536000; includeSubDomains' : ''
    };
  }

  /**
   * Validate environment security configuration
   */
  static validateSecurityConfig(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check API key
    if (!environment.apiKey || environment.apiKey.trim().length === 0) {
      errors.push('API key is missing');
    } else if (environment.apiKey.length < 10) {
      warnings.push('API key appears to be too short');
    }

    // Check API URL
    if (!environment.apiUrl || environment.apiUrl.trim().length === 0) {
      errors.push('API URL is missing');
    } else if (environment.production && !environment.apiUrl.startsWith('https://')) {
      errors.push('API URL must use HTTPS in production');
    }

    // Check for placeholder values in production
    if (environment.production) {
      const placeholderPatterns = [
        'your-api-key',
        'your-production-api-key',
        'REPLACE_WITH_ACTUAL_API_KEY',
        'your-api-gateway-url.amazonaws.com'
      ];

      if (placeholderPatterns.some(pattern => 
        environment.apiKey.includes(pattern) || environment.apiUrl.includes(pattern)
      )) {
        errors.push('Production environment contains placeholder values');
      }
    }

    // Check security configuration
    if (!environment.security) {
      warnings.push('Security configuration is missing');
    } else {
      if (!environment.security.enforceHttps && environment.production) {
        warnings.push('HTTPS enforcement is disabled in production');
      }
      
      if (!environment.security.enableCSP) {
        warnings.push('Content Security Policy is disabled');
      }
      
      if (!environment.security.sanitizeInputs) {
        warnings.push('Input sanitization is disabled');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get recommended security settings for different environments
   */
  static getRecommendedSettings(isProduction: boolean) {
    return {
      security: {
        enforceHttps: isProduction,
        enableCSP: true,
        sanitizeInputs: true,
        validateApiKey: true
      },
      csp: this.getCSPDirectives(),
      headers: this.getSecurityHeaders()
    };
  }

  /**
   * Check if current environment meets security requirements
   */
  static meetsSecurityRequirements(): boolean {
    const validation = this.validateSecurityConfig();
    return validation.isValid;
  }

  /**
   * Generate security report for monitoring
   */
  static generateSecurityReport(): {
    timestamp: string;
    environment: string;
    validation: ReturnType<typeof SecurityConfigUtil.validateSecurityConfig>;
    recommendations: string[];
  } {
    const validation = this.validateSecurityConfig();
    const recommendations: string[] = [];

    if (validation.errors.length > 0) {
      recommendations.push('Fix all security configuration errors before deployment');
    }

    if (validation.warnings.length > 0) {
      recommendations.push('Review and address security warnings');
    }

    if (environment.production && !environment.apiUrl.startsWith('https://')) {
      recommendations.push('Ensure all API communications use HTTPS');
    }

    if (!environment.security?.enableCSP) {
      recommendations.push('Enable Content Security Policy for XSS protection');
    }

    return {
      timestamp: new Date().toISOString(),
      environment: environment.production ? 'production' : 'development',
      validation,
      recommendations
    };
  }
}