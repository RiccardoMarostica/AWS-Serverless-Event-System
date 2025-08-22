import { TestBed } from '@angular/core/testing';
import { SecurityService } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecurityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateSecureContext', () => {
    it('should return true for secure context', () => {
      const result = service.validateSecureContext();
      expect(result).toBe(true);
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', () => {
      const result = service.validateApiKey();
      expect(result).toBe(true);
    });
  });

  describe('getCSPDirectives', () => {
    it('should return valid CSP directives string', () => {
      const csp = service.getCSPDirectives();
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("object-src 'none'");
    });
  });

  describe('isSecureEnvironment', () => {
    it('should return true when all security checks pass', () => {
      spyOn(service, 'validateSecureContext').and.returnValue(true);
      spyOn(service, 'validateApiKey').and.returnValue(true);
      
      const result = service.isSecureEnvironment();
      expect(result).toBe(true);
    });

    it('should return false when security checks fail', () => {
      spyOn(service, 'validateSecureContext').and.returnValue(false);
      spyOn(service, 'validateApiKey').and.returnValue(true);
      
      const result = service.isSecureEnvironment();
      expect(result).toBe(false);
    });
  });

  describe('getSecurityHeaders', () => {
    it('should return security headers object', () => {
      const headers = service.getSecurityHeaders();
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('sanitizeForLogging', () => {
    it('should redact sensitive fields', () => {
      const data = {
        email: 'user@example.com',
        apiKey: 'secret-key',
        password: 'secret-password',
        token: 'secret-token',
        normalField: 'normal-value'
      };
      
      const sanitized = service.sanitizeForLogging(data);
      
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('normal-value');
    });

    it('should handle non-object input', () => {
      expect(service.sanitizeForLogging('string')).toBe('string');
      expect(service.sanitizeForLogging(123)).toBe(123);
      expect(service.sanitizeForLogging(null)).toBe(null);
    });
  });
});