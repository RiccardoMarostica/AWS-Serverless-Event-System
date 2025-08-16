import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  
  handleError(error: any): void {
    console.error('Global error caught:', error);
    
    if (error instanceof HttpErrorResponse) {
      // Handle HTTP errors
      this.handleHttpError(error);
    } else {
      // Handle other errors
      this.handleGenericError(error);
    }
  }

  handleApiError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Network error. Please check your internet connection.';
    }
    
    if (error.status >= 400 && error.status < 500) {
      return error.error?.message || 'Invalid request. Please check your input.';
    }
    
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  private handleHttpError(error: HttpErrorResponse): void {
    const userMessage = this.handleApiError(error);
    console.error('HTTP Error:', {
      status: error.status,
      message: error.message,
      userMessage
    });
  }

  private handleGenericError(error: any): void {
    console.error('Generic Error:', error);
  }
}