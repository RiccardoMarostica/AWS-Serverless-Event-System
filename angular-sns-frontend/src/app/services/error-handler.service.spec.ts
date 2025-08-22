import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService, ErrorType, ErrorInfo } from './error-handler.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should categorize HTTP network errors correctly', () => {
    const networkError = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      error: new ErrorEvent('Network error')
    });

    const errorInfo = service.categorizeError(networkError);
    
    expect(errorInfo.type).toBe(ErrorType.NETWORK_ERROR);
    expect(errorInfo.userMessage).toContain('Unable to connect');
    expect(errorInfo.retryable).toBe(true);
  });

  it('should categorize HTTP client errors correctly', () => {
    const clientError = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: { message: 'Invalid email format' }
    });

    const errorInfo = service.categorizeError(clientError);
    
    expect(errorInfo.type).toBe(ErrorType.VALIDATION_ERROR);
    expect(errorInfo.userMessage).toBe('Invalid email format');
    expect(errorInfo.retryable).toBe(false);
  });

  it('should categorize HTTP server errors correctly', () => {
    const serverError = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error'
    });

    const errorInfo = service.categorizeError(serverError);
    
    expect(errorInfo.type).toBe(ErrorType.SERVER_ERROR);
    expect(errorInfo.userMessage).toContain('server is experiencing issues');
    expect(errorInfo.retryable).toBe(true);
  });

  it('should categorize timeout errors correctly', () => {
    const timeoutError = { name: 'TimeoutError', message: 'Request timeout' };

    const errorInfo = service.categorizeError(timeoutError);
    
    expect(errorInfo.type).toBe(ErrorType.TIMEOUT_ERROR);
    expect(errorInfo.userMessage).toContain('took too long');
    expect(errorInfo.retryable).toBe(true);
  });

  it('should categorize offline errors correctly', () => {
    // Create a fresh service instance for this test
    const offlineService = new ErrorHandlerService();
    
    // Mock navigator.onLine for this specific test
    const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    const genericError = new Error('Some error');
    const errorInfo = offlineService.categorizeError(genericError);
    
    expect(errorInfo.type).toBe(ErrorType.OFFLINE_ERROR);
    expect(errorInfo.userMessage).toContain('appear to be offline');
    expect(errorInfo.retryable).toBe(true);
    
    // Restore original property
    if (originalOnLine) {
      Object.defineProperty(navigator, 'onLine', originalOnLine);
    }
  });

  it('should categorize generic errors correctly', () => {
    const genericError = new Error('Unknown error');
    const errorInfo = service.categorizeError(genericError);
    
    expect(errorInfo.type).toBe(ErrorType.GENERIC_ERROR);
    expect(errorInfo.userMessage).toContain('unexpected error');
    expect(errorInfo.retryable).toBe(false);
  });

  it('should handle different HTTP status codes correctly', () => {
    const testCases = [
      { status: 400, expectedMessage: 'Invalid request' },
      { status: 401, expectedMessage: 'Authentication required' },
      { status: 403, expectedMessage: 'Access denied' },
      { status: 404, expectedMessage: 'service was not found' },
      { status: 409, expectedMessage: 'already subscribed' },
      { status: 422, expectedMessage: 'Invalid email address' },
      { status: 429, expectedMessage: 'Too many requests' }
    ];

    testCases.forEach(testCase => {
      const error = new HttpErrorResponse({
        status: testCase.status,
        statusText: 'Error'
      });

      const userMessage = service['getClientErrorMessage'](error);
      expect(userMessage).toContain(testCase.expectedMessage);
    });
  });

  it('should detect network errors correctly', () => {
    const networkErrors = [
      { message: 'Network connection failed' },
      { message: 'Connection timeout' },
      { message: 'Fetch failed' },
      { name: 'NetworkError' },
      { code: 'NETWORK_ERROR' }
    ];

    networkErrors.forEach(error => {
      expect(service['isNetworkError'](error)).toBe(true);
    });

    const nonNetworkError = { message: 'Validation failed' };
    expect(service['isNetworkError'](nonNetworkError)).toBe(false);
  });

  it('should emit error updates', (done) => {
    const testError = new Error('Test error');
    
    service.error$.subscribe(errorInfo => {
      if (errorInfo) {
        expect(errorInfo.type).toBe(ErrorType.GENERIC_ERROR);
        expect(errorInfo.message).toBe('Test error');
        done();
      }
    });

    service.handleError(testError);
  });

  it('should clear errors', () => {
    const testError = new Error('Test error');
    service.handleError(testError);
    
    expect(service.getCurrentError()).toBeTruthy();
    
    service.clearError();
    expect(service.getCurrentError()).toBeNull();
  });

  it('should determine if error is retryable', () => {
    const retryableError: ErrorInfo = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network error',
      userMessage: 'Network error',
      retryable: true,
      timestamp: new Date()
    };

    const nonRetryableError: ErrorInfo = {
      type: ErrorType.VALIDATION_ERROR,
      message: 'Validation error',
      userMessage: 'Validation error',
      retryable: false,
      timestamp: new Date()
    };

    expect(service.isRetryableError(retryableError)).toBe(true);
    expect(service.isRetryableError(nonRetryableError)).toBe(false);
  });

  it('should get connectivity status', () => {
    expect(service.getConnectivityStatus()).toBe(navigator.onLine);
  });

  it('should handle rate limiting as retryable', () => {
    const rateLimitError = new HttpErrorResponse({
      status: 429,
      statusText: 'Too Many Requests'
    });

    const errorInfo = service.categorizeError(rateLimitError);
    expect(errorInfo.retryable).toBe(true);
  });

  it('should log errors to session storage', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('[]');
    spyOn(sessionStorage, 'setItem');

    const testError = new Error('Test error');
    service.handleError(testError);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'recentErrors',
      jasmine.any(String)
    );
  });

  it('should handle session storage errors gracefully', () => {
    spyOn(sessionStorage, 'getItem').and.throwError('Storage error');
    spyOn(console, 'warn');

    const testError = new Error('Test error');
    
    expect(() => service.handleError(testError)).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });

  it('should monitor online/offline events', (done) => {
    let emissionCount = 0;
    
    service.isOnline$.subscribe(isOnline => {
      emissionCount++;
      if (emissionCount === 1) {
        expect(isOnline).toBe(navigator.onLine);
        done();
      }
    });
  });

  it('should clear offline errors when coming back online', (done) => {
    // Create a fresh service instance for this test
    const offlineService = new ErrorHandlerService();
    
    let errorReceived = false;
    
    offlineService.error$.subscribe(error => {
      if (error?.type === ErrorType.OFFLINE_ERROR && !errorReceived) {
        errorReceived = true;
        
        // Simulate coming back online
        const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true
        });
        
        // Trigger online event
        window.dispatchEvent(new Event('online'));
        
        setTimeout(() => {
          expect(offlineService.getCurrentError()).toBeNull();
          
          // Restore original property
          if (originalOnLine) {
            Object.defineProperty(navigator, 'onLine', originalOnLine);
          }
          done();
        }, 100);
      }
    });

    // Mock offline and trigger offline event
    const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    // Trigger offline event
    window.dispatchEvent(new Event('offline'));
  });
});