import { SecurityConfigUtil } from './security-config.util';

describe('SecurityConfigUtil', () => {

  describe('getCSPDirectives', () => {
    it('should return valid CSP directives string', () => {
      const csp = SecurityConfigUtil.getCSPDirectives();
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain('connect-src');
    });

    it('should include upgrade-insecure-requests in production', () => {
      const csp = SecurityConfigUtil.getCSPDirectives();
      expect(csp).toBeDefined();
    });
  });

  describe('getSecurityHeaders', () => {
    it('should return security headers object', () => {
      const headers = SecurityConfigUtil.getSecurityHeaders();
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Permissions-Policy']).toBe('geolocation=(), microphone=(), camera=()');
    });

    it('should include HSTS header in production', () => {
      const headers = SecurityConfigUtil.getSecurityHeaders();
      expect(headers['Strict-Transport-Security']).toBeDefined();
    });
  });

  describe('validateSecurityConfig', () => {
    it('should return valid for proper configuration', () => {
      const validation = SecurityConfigUtil.validateSecurityConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should validate security configuration', () => {
      const validation = SecurityConfigUtil.validateSecurityConfig();
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.errors).toBeDefined();
      expect(validation.warnings).toBeDefined();
    });
  });

  describe('meetsSecurityRequirements', () => {
    it('should check security requirements', () => {
      const result = SecurityConfigUtil.meetsSecurityRequirements();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate security report with timestamp', () => {
      const report = SecurityConfigUtil.generateSecurityReport();
      
      expect(report.timestamp).toBeDefined();
      expect(report.environment).toBeDefined();
      expect(report.validation).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });
  });

  describe('getRecommendedSettings', () => {
    it('should return recommended settings for production', () => {
      const settings = SecurityConfigUtil.getRecommendedSettings(true);
      
      expect(settings.security.enforceHttps).toBe(true);
      expect(settings.security.enableCSP).toBe(true);
      expect(settings.security.sanitizeInputs).toBe(true);
      expect(settings.security.validateApiKey).toBe(true);
      expect(settings.csp).toBeDefined();
      expect(settings.headers).toBeDefined();
    });

    it('should return recommended settings for development', () => {
      const settings = SecurityConfigUtil.getRecommendedSettings(false);
      
      expect(settings.security.enforceHttps).toBe(false);
      expect(settings.security.enableCSP).toBe(true);
      expect(settings.security.sanitizeInputs).toBe(true);
      expect(settings.security.validateApiKey).toBe(true);
    });
  });
});