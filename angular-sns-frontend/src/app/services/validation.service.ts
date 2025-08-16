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

    if (errors['required']) {
      return 'Email address is required';
    }

    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    if (errors['invalidEmail']) {
      return errors['invalidEmail'].message;
    }

    if (errors['emailTooLong']) {
      return errors['emailTooLong'].message;
    }

    return 'Please enter a valid email address';
  }
}