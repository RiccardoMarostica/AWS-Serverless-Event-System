import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ValidationResult } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  /**
   * Validates email format and provides detailed feedback
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || email.trim().length === 0) {
      errors.push('Email address is required');
      return { isValid: false, errors };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }

    if (email.length > 254) {
      errors.push('Email address is too long (maximum 254 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Returns Angular validators for email field
   */
  getEmailValidators(): ValidatorFn[] {
    return [
      this.customEmailValidator(),
      this.emailLengthValidator()
    ];
  }

  /**
   * Custom email validator that provides specific error messages
   */
  private customEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Let required validator handle empty values
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (!emailRegex.test(control.value)) {
        return { 
          invalidEmail: { 
            message: 'Please enter a valid email address',
            value: control.value 
          } 
        };
      }

      return null;
    };
  }

  /**
   * Email length validator
   */
  private emailLengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      if (control.value.length > 254) {
        return { 
          emailTooLong: { 
            message: 'Email address is too long (maximum 254 characters)',
            maxLength: 254,
            actualLength: control.value.length
          } 
        };
      }

      return null;
    };
  }

  /**
   * Gets user-friendly error message from validation errors
   */
  getErrorMessage(errors: ValidationErrors | null): string {
    if (!errors) {
      return '';
    }

    // Priority order for multiple errors
    const errorPriority = ['required', 'invalidEmail', 'emailTooLong', 'email'];
    
    for (const errorType of errorPriority) {
      if (errors[errorType]) {
        return this.getSpecificErrorMessage(errorType, errors[errorType]);
      }
    }

    return 'Please enter a valid email address';
  }

  /**
   * Gets detailed error information for form field highlighting
   */
  getFieldErrorInfo(errors: ValidationErrors | null): {
    hasError: boolean;
    errorType: string;
    message: string;
    severity: 'error' | 'warning';
    suggestions?: string[];
  } {
    if (!errors) {
      return {
        hasError: false,
        errorType: '',
        message: '',
        severity: 'error'
      };
    }

    const firstError = Object.keys(errors)[0];
    const errorData = errors[firstError];

    return {
      hasError: true,
      errorType: firstError,
      message: this.getSpecificErrorMessage(firstError, errorData),
      severity: this.getErrorSeverity(firstError),
      suggestions: this.getErrorSuggestions(firstError, errorData)
    };
  }

  /**
   * Validates email in real-time and provides suggestions
   */
  validateEmailWithSuggestions(email: string): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
    severity: 'error' | 'warning' | 'info';
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let severity: 'error' | 'warning' | 'info' = 'info';

    if (!email || email.trim().length === 0) {
      return {
        isValid: false,
        errors: ['Email address is required'],
        suggestions: ['Please enter your email address to subscribe'],
        severity: 'error'
      };
    }

    const trimmedEmail = email.trim();
    
    // Check for common typos and provide suggestions
    const commonDomainTypos = this.checkCommonDomainTypos(trimmedEmail);
    if (commonDomainTypos.length > 0) {
      suggestions.push(...commonDomainTypos);
      severity = 'warning';
    }

    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      errors.push('Please enter a valid email address');
      severity = 'error';
      
      // Provide specific suggestions based on the error
      if (!trimmedEmail.includes('@')) {
        suggestions.push('Email must contain an @ symbol');
      } else if (!trimmedEmail.includes('.')) {
        suggestions.push('Email must contain a domain (e.g., .com, .org)');
      } else if (trimmedEmail.startsWith('@')) {
        suggestions.push('Email cannot start with @');
      } else if (trimmedEmail.endsWith('@')) {
        suggestions.push('Email must have a domain after @');
      }
    }

    // Length validation
    if (trimmedEmail.length > 254) {
      errors.push('Email address is too long (maximum 254 characters)');
      severity = 'error';
    }

    // Additional format checks
    if (trimmedEmail.includes('..')) {
      errors.push('Email cannot contain consecutive dots');
      severity = 'error';
    }

    if (trimmedEmail.includes(' ')) {
      errors.push('Email cannot contain spaces');
      suggestions.push('Remove any spaces from your email address');
      severity = 'error';
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
      severity
    };
  }

  private getSpecificErrorMessage(errorType: string, errorData: any): string {
    switch (errorType) {
      case 'required':
        return 'Email address is required';
      case 'email':
        return 'Please enter a valid email address';
      case 'invalidEmail':
        return errorData?.message || 'Please enter a valid email address';
      case 'emailTooLong':
        return errorData?.message || 'Email address is too long';
      default:
        return 'Please enter a valid email address';
    }
  }

  private getErrorSeverity(errorType: string): 'error' | 'warning' {
    switch (errorType) {
      case 'required':
      case 'invalidEmail':
      case 'emailTooLong':
        return 'error';
      default:
        return 'error';
    }
  }

  private getErrorSuggestions(errorType: string, errorData: any): string[] {
    switch (errorType) {
      case 'required':
        return ['Enter your email address to receive notifications'];
      case 'invalidEmail':
        return [
          'Make sure your email includes @ and a domain (like .com)',
          'Example: your.name@example.com'
        ];
      case 'emailTooLong':
        return ['Try using a shorter email address'];
      default:
        return [];
    }
  }

  private checkCommonDomainTypos(email: string): string[] {
    const suggestions: string[] = [];
    const domain = email.split('@')[1];
    
    if (!domain) return suggestions;

    const commonDomains: { [key: string]: string } = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmail.co': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'yahoo.co': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'hotmail.co': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'outlook.co': 'outlook.com'
    };

    const lowerDomain = domain.toLowerCase();
    if (commonDomains[lowerDomain]) {
      const correctedEmail = email.replace(domain, commonDomains[lowerDomain]);
      suggestions.push(`Did you mean: ${correctedEmail}?`);
    }

    return suggestions;
  }
}