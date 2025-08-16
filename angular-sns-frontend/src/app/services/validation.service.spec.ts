import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateEmail', () => {
    it('should return valid result for correct email', () => {
      const result = service.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid result for empty email', () => {
      const result = service.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address is required');
    });

    it('should return invalid result for invalid email format', () => {
      const result = service.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Please enter a valid email address');
    });

    it('should return invalid result for email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = service.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address is too long (maximum 254 characters)');
    });
  });

  describe('getEmailValidators', () => {
    it('should return array of validators', () => {
      const validators = service.getEmailValidators();
      expect(validators).toBeInstanceOf(Array);
      expect(validators.length).toBe(2);
    });

    it('should validate correct email with custom validators', () => {
      const validators = service.getEmailValidators();
      const control = new FormControl('test@example.com');
      
      validators.forEach(validator => {
        const result = validator(control);
        expect(result).toBeNull();
      });
    });

    it('should invalidate incorrect email with custom validators', () => {
      const validators = service.getEmailValidators();
      const control = new FormControl('invalid-email');
      
      const customEmailValidator = validators[0];
      const result = customEmailValidator(control);
      expect(result).not.toBeNull();
      expect(result?.['invalidEmail']).toBeDefined();
    });
  });

  describe('getErrorMessage', () => {
    it('should return empty string for no errors', () => {
      const message = service.getErrorMessage(null);
      expect(message).toBe('');
    });

    it('should return required message', () => {
      const message = service.getErrorMessage({ required: true });
      expect(message).toBe('Email address is required');
    });

    it('should return email format message', () => {
      const message = service.getErrorMessage({ email: true });
      expect(message).toBe('Please enter a valid email address');
    });

    it('should return custom email error message', () => {
      const message = service.getErrorMessage({ 
        invalidEmail: { message: 'Custom error message' } 
      });
      expect(message).toBe('Custom error message');
    });

    it('should return email too long message', () => {
      const message = service.getErrorMessage({ 
        emailTooLong: { message: 'Email is too long' } 
      });
      expect(message).toBe('Email is too long');
    });
  });
});