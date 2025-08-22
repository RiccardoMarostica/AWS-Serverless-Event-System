import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  GENERIC_ERROR = 'GENERIC_ERROR'
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  timestamp: Date;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  private errorSubject = new BehaviorSubject<ErrorInfo | null>(null);
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);

  public readonly error$ = this.errorSubject.asObservable();
  public readonly isOnline$ = this.isOnlineSubject.asObservable();

  constructor() {
    this.initializeConnectivityMonitoring();
  }

  handleError(error: any): void {
    console.error('Global error caught:', error);
    
    const errorInfo = this.categorizeError(error);
    this.errorSubject.next(errorInfo);
    
    // Log error details for debugging
    this.logError(errorInfo);
  }

  handleApiError(error: HttpErrorResponse): string {
    const errorInfo = this.categorizeError(error);
    return errorInfo.userMessage;
  }

  categorizeError(error: any): ErrorInfo {
    const timestamp = new Date();
    
    // Check if it's an HTTP error
    if (error instanceof HttpErrorResponse) {
      return this.categorizeHttpError(error, timestamp);
    }
    
    // Check for timeout errors
    if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: error.message || 'Request timeout',
        userMessage: 'The request took too long to complete. Please try again.',
        retryable: true,
        timestamp,
        details: error
      };
    }
    
    // Check for network errors
    if (this.isNetworkError(error)) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: error.message || 'Network error',
        userMessage: 'Network connection failed. Please check your internet connection and try again.',
        retryable: true,
        timestamp,
        details: error
      };
    }
    
    // Check for offline errors
    if (!navigator.onLine) {
      return {
        type: ErrorType.OFFLINE_ERROR,
        message: 'Device is offline',
        userMessage: 'You appear to be offline. Please check your internet connection.',
        retryable: true,
        timestamp,
        details: error
      };
    }
    
    // Generic error
    return {
      type: ErrorType.GENERIC_ERROR,
      message: error?.message || 'Unknown error',
      userMessage: 'An unexpected error occurred. Please try again later.',
      retryable: false,
      timestamp,
      details: error
    };
  }

  private categorizeHttpError(error: HttpErrorResponse, timestamp: Date): ErrorInfo {
    // Network connectivity issues
    if (error.status === 0) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network connection failed',
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        retryable: true,
        timestamp,
        details: error
      };
    }
    
    // Client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      const userMessage = this.getClientErrorMessage(error);
      return {
        type: ErrorType.VALIDATION_ERROR,
        message: error.message,
        userMessage,
        retryable: error.status === 429, // Only retry for rate limiting
        timestamp,
        details: error
      };
    }
    
    // Server errors (5xx)
    if (error.status >= 500) {
      return {
        type: ErrorType.SERVER_ERROR,
        message: error.message,
        userMessage: 'The server is experiencing issues. Please try again in a few moments.',
        retryable: true,
        timestamp,
        details: error
      };
    }
    
    // Other HTTP errors
    return {
      type: ErrorType.GENERIC_ERROR,
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: false,
      timestamp,
      details: error
    };
  }

  private getClientErrorMessage(error: HttpErrorResponse): string {
    // Try to extract message from error response
    const errorBody = error.error;
    if (errorBody?.message) {
      return errorBody.message;
    }
    
    // Default messages based on status code
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please try again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'The requested service was not found. Please try again later.';
      case 409:
        return 'This email address is already subscribed.';
      case 422:
        return 'Invalid email address format. Please enter a valid email.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return 'Request failed. Please check your input and try again.';
    }
  }

  private isNetworkError(error: any): boolean {
    return (
      error?.message?.toLowerCase().includes('network') ||
      error?.message?.toLowerCase().includes('connection') ||
      error?.message?.toLowerCase().includes('fetch') ||
      error?.name === 'NetworkError' ||
      error?.code === 'NETWORK_ERROR'
    );
  }

  private initializeConnectivityMonitoring(): void {
    // Monitor online/offline status
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    merge(online$, offline$)
      .pipe(startWith(navigator.onLine))
      .subscribe(isOnline => {
        this.isOnlineSubject.next(isOnline);
        
        if (!isOnline) {
          this.errorSubject.next({
            type: ErrorType.OFFLINE_ERROR,
            message: 'Device went offline',
            userMessage: 'You are now offline. Please check your internet connection.',
            retryable: true,
            timestamp: new Date()
          });
        } else {
          // Clear offline errors when coming back online
          const currentError = this.errorSubject.value;
          if (currentError?.type === ErrorType.OFFLINE_ERROR) {
            this.clearError();
          }
        }
      });
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  getCurrentError(): ErrorInfo | null {
    return this.errorSubject.value;
  }

  isRetryableError(error?: ErrorInfo): boolean {
    const errorToCheck = error || this.errorSubject.value;
    return errorToCheck?.retryable || false;
  }

  getConnectivityStatus(): boolean {
    return this.isOnlineSubject.value;
  }

  private logError(errorInfo: ErrorInfo): void {
    const logData = {
      type: errorInfo.type,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      timestamp: errorInfo.timestamp,
      retryable: errorInfo.retryable,
      url: window.location.href,
      userAgent: navigator.userAgent,
      online: navigator.onLine
    };
    
    // In production, this could be sent to a logging service
    console.error('Error logged:', logData);
    
    // Store recent errors in session storage for debugging
    try {
      const recentErrors = JSON.parse(sessionStorage.getItem('recentErrors') || '[]');
      recentErrors.push(logData);
      
      // Keep only last 10 errors
      if (recentErrors.length > 10) {
        recentErrors.shift();
      }
      
      sessionStorage.setItem('recentErrors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Could not store error in session storage:', e);
    }
  }
}