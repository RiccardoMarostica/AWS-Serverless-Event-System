import { TestBed } from '@angular/core/testing';
import { SanitizationService } from './sanitization.service';

describe('SanitizationService', () => {
  let service: SanitizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SanitizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sanitizeEmail', () => {
    it('should return empty string for null/undefined input', () => {
      expect(service.sanitizeEmail('')).toBe('');
      expect(service.sanitizeEmail(null as any)).toBe('');
      expect(service.sanitizeEmail(undefined as any)).toBe('');
    });

    it('should remove HTML tags from email', () => {
      const maliciousEmail = 'test<script>alert("xss")</script>@example.com';
      const sanitized = service.sanitizeEmail(maliciousEmail);
      expect(sanitized).toBe('testalertxss@example.com'); // Parentheses and quotes are removed by allowedChars regex
    });

    it('should remove script-related content', () => {
      const maliciousEmail = 'javascript:alert("xss")@example.com';
      const sanitized = service.sanitizeEmail(maliciousEmail);
      expect(sanitized).toBe('alertxss@example.com'); // Parentheses and quotes are removed by allowedChars regex
    });

    it('should preserve valid email characters', () => {
      const validEmail = 'user.name+tag@example-domain.com';
      const sanitized = service.sanitizeEmail(validEmail);
      expect(sanitized).toBe(validEmail);
    });

    it('should trim whitespace', () => {
      const emailWithSpaces = '  user@example.com  ';
      const sanitized = service.sanitizeEmail(emailWithSpaces);
      expect(sanitized).toBe('user@example.com');
    });

    it('should limit email length to 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // 261 characters
      const sanitized = service.sanitizeEmail(longEmail);
      expect(sanitized.length).toBe(254);
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const maliciousText = 'Hello <script>alert("xss")</script> World';
      const sanitized = service.sanitizeText(maliciousText);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should encode special characters', () => {
      const textWithSpecialChars = 'Hello & <World>';
      const sanitized = service.sanitizeText(textWithSpecialChars);
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('World'); // The < and > are removed by HTML tag regex first
    });

    it('should limit text length to 1000 characters', () => {
      const longText = 'a'.repeat(1500);
      const sanitized = service.sanitizeText(longText);
      expect(sanitized.length).toBe(1000);
    });
  });

  describe('validateInputSafety', () => {
    it('should return true for safe input', () => {
      expect(service.validateInputSafety('user@example.com')).toBe(true);
      expect(service.validateInputSafety('Hello World')).toBe(true);
      expect(service.validateInputSafety('')).toBe(true);
    });

    it('should return false for script tags', () => {
      expect(service.validateInputSafety('<script>alert("xss")</script>')).toBe(false);
    });

    it('should return false for javascript: protocol', () => {
      expect(service.validateInputSafety('javascript:alert("xss")')).toBe(false);
    });

    it('should return false for event handlers', () => {
      expect(service.validateInputSafety('onclick=alert("xss")')).toBe(false);
    });

    it('should return false for iframe tags', () => {
      expect(service.validateInputSafety('<iframe src="malicious.com"></iframe>')).toBe(false);
    });
  });

  describe('sanitizeFormData', () => {
    it('should sanitize email fields specially', () => {
      const formData = {
        email: 'test<script>alert("xss")</script>@example.com',
        userEmail: 'user<b>bold</b>@example.com',
        name: 'John<script>alert("xss")</script>Doe'
      };

      const sanitized = service.sanitizeFormData(formData);
      
      expect(sanitized.email).not.toContain('<script>');
      expect(sanitized.userEmail).not.toContain('<b>');
      expect(sanitized.name).not.toContain('<script>');
    });

    it('should handle non-object input', () => {
      expect(service.sanitizeFormData(null)).toBe(null);
      expect(service.sanitizeFormData('string')).toBe('string');
      expect(service.sanitizeFormData(123)).toBe(123);
    });

    it('should preserve non-string values', () => {
      const formData = {
        email: 'user@example.com',
        age: 25,
        active: true
      };

      const sanitized = service.sanitizeFormData(formData);
      
      expect(sanitized.age).toBe(25);
      expect(sanitized.active).toBe(true);
    });
  });
});