import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SanitizationService {

  /**
   * Sanitizes email input to prevent XSS attacks
   * @param email Raw email input
   * @returns Sanitized email string
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';
    
    // Remove any HTML tags
    const htmlTagRegex = /<[^>]*>/g;
    let sanitized = email.replace(htmlTagRegex, '');
    
    // Remove script-related content
    const scriptRegex = /javascript:|data:|vbscript:|on\w+\s*=/gi;
    sanitized = sanitized.replace(scriptRegex, '');
    
    // Remove potentially dangerous characters but keep valid email characters
    const allowedChars = /[^a-zA-Z0-9@._+-]/g;
    sanitized = sanitized.replace(allowedChars, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit length to prevent buffer overflow attacks
    const maxLength = 254; // RFC 5321 limit
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  /**
   * Sanitizes general text input
   * @param input Raw text input
   * @returns Sanitized text string
   */
  sanitizeText(input: string): string {
    if (!input) return '';
    
    // Remove HTML tags
    const htmlTagRegex = /<[^>]*>/g;
    let sanitized = input.replace(htmlTagRegex, '');
    
    // Remove script-related content
    const scriptRegex = /javascript:|data:|vbscript:|on\w+\s*=/gi;
    sanitized = sanitized.replace(scriptRegex, '');
    
    // Encode special characters
    sanitized = this.encodeSpecialCharacters(sanitized);
    
    // Trim and limit length
    sanitized = sanitized.trim();
    const maxLength = 1000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  /**
   * Validates that input doesn't contain malicious patterns
   * @param input Input to validate
   * @returns true if input is safe, false otherwise
   */
  validateInputSafety(input: string): boolean {
    if (!input) return true;
    
    // Check for common XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi
    ];
    
    return !xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Encodes special characters to prevent XSS
   * @param input Input string
   * @returns Encoded string
   */
  private encodeSpecialCharacters(input: string): string {
    const entityMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return input.replace(/[&<>"'`=\/]/g, (char) => entityMap[char]);
  }

  /**
   * Sanitizes form data object
   * @param formData Form data object
   * @returns Sanitized form data
   */
  sanitizeFormData(formData: any): any {
    if (!formData || typeof formData !== 'object') {
      return formData;
    }
    
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        // Special handling for email fields
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = this.sanitizeEmail(value);
        } else {
          sanitized[key] = this.sanitizeText(value);
        }
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}