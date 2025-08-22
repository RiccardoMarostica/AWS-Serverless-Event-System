import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { ErrorDisplayComponent } from './error-display.component';
import { ErrorHandlerService, ErrorType, ErrorInfo } from '../services/error-handler.service';
import { ConnectivityService, ConnectivityStatus } from '../services/connectivity.service';

describe('ErrorDisplayComponent', () => {
  let component: ErrorDisplayComponent;
  let fixture: ComponentFixture<ErrorDisplayComponent>;
  let mockErrorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let mockConnectivity: jasmine.SpyObj<ConnectivityService>;
  let errorSubject: BehaviorSubject<ErrorInfo | null>;
  let connectivitySubject: BehaviorSubject<ConnectivityStatus>;

  beforeEach(async () => {
    errorSubject = new BehaviorSubject<ErrorInfo | null>(null);
    connectivitySubject = new BehaviorSubject<ConnectivityStatus>({
      isOnline: true,
      connectionType: 'wifi',
      lastChecked: new Date(),
      latency: undefined
    });

    mockErrorHandler = jasmine.createSpyObj('ErrorHandlerService', ['clearError'], {
      error$: errorSubject.asObservable()
    });

    mockConnectivity = jasmine.createSpyObj('ConnectivityService', ['getConnectionQuality'], {
      connectivity$: connectivitySubject.asObservable()
    });

    mockConnectivity.getConnectionQuality.and.returnValue('good');

    await TestBed.configureTestingModule({
      imports: [ErrorDisplayComponent],
      providers: [
        { provide: ErrorHandlerService, useValue: mockErrorHandler },
        { provide: ConnectivityService, useValue: mockConnectivity }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display error container when no error and connectivity status is hidden', () => {
    component.showConnectivityStatus = false;
    fixture.detectChanges();
    
    const errorContainer = fixture.nativeElement.querySelector('.error-container');
    expect(errorContainer).toBeFalsy();
  });

  it('should display network error with correct styling', () => {
    const networkError: ErrorInfo = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network failed',
      userMessage: 'Please check your connection',
      retryable: true,
      timestamp: new Date()
    };

    errorSubject.next(networkError);
    fixture.detectChanges();

    const errorContainer = fixture.nativeElement.querySelector('.error-container');
    expect(errorContainer).toBeTruthy();
    expect(errorContainer.classList.contains('error-network')).toBeTruthy();

    const errorTitle = fixture.nativeElement.querySelector('.error-title');
    expect(errorTitle.textContent).toBe('Connection Problem');

    const errorDescription = fixture.nativeElement.querySelector('.error-description');
    expect(errorDescription.textContent).toBe('Please check your connection');
  });

  it('should display offline banner when offline', () => {
    component.showConnectivityStatus = true;
    connectivitySubject.next({
      isOnline: false,
      connectionType: 'none',
      lastChecked: new Date(),
      latency: undefined
    });
    fixture.detectChanges();

    const offlineBanner = fixture.nativeElement.querySelector('.connectivity-banner.offline');
    expect(offlineBanner).toBeTruthy();
    expect(offlineBanner.textContent).toContain('You\'re offline');
  });

  it('should display poor connection warning', () => {
    component.showConnectivityStatus = true;
    mockConnectivity.getConnectionQuality.and.returnValue('poor');
    connectivitySubject.next({
      isOnline: true,
      connectionType: 'cellular',
      lastChecked: new Date(),
      latency: 800
    });
    fixture.detectChanges();

    const poorConnectionBanner = fixture.nativeElement.querySelector('.connectivity-banner.poor-connection');
    expect(poorConnectionBanner).toBeTruthy();
    expect(poorConnectionBanner.textContent).toContain('Slow connection detected');
  });

  it('should show retry button for retryable errors', () => {
    const retryableError: ErrorInfo = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network failed',
      userMessage: 'Please check your connection',
      retryable: true,
      timestamp: new Date()
    };

    errorSubject.next(retryableError);
    fixture.detectChanges();

    const retryButton = fixture.nativeElement.querySelector('.action-button.retry');
    expect(retryButton).toBeTruthy();
    expect(retryButton.textContent.trim()).toContain('Try Again');
  });

  it('should show help button for non-retryable errors', () => {
    const nonRetryableError: ErrorInfo = {
      type: ErrorType.VALIDATION_ERROR,
      message: 'Invalid input',
      userMessage: 'Please check your input',
      retryable: false,
      timestamp: new Date()
    };

    errorSubject.next(nonRetryableError);
    fixture.detectChanges();

    const helpButton = fixture.nativeElement.querySelector('.action-button.help');
    expect(helpButton).toBeTruthy();
    expect(helpButton.textContent.trim()).toContain('Get Help');
  });

  it('should emit retry event when retry button clicked', () => {
    spyOn(component.retry, 'emit');

    const retryableError: ErrorInfo = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network failed',
      userMessage: 'Please check your connection',
      retryable: true,
      timestamp: new Date()
    };

    errorSubject.next(retryableError);
    fixture.detectChanges();

    const retryButton = fixture.nativeElement.querySelector('.action-button.retry');
    retryButton.click();

    expect(component.retry.emit).toHaveBeenCalled();
  });

  it('should clear error when dismiss button clicked', () => {
    spyOn(component.dismiss, 'emit');

    const error: ErrorInfo = {
      type: ErrorType.GENERIC_ERROR,
      message: 'Generic error',
      userMessage: 'Something went wrong',
      retryable: false,
      timestamp: new Date()
    };

    errorSubject.next(error);
    fixture.detectChanges();

    const dismissButton = fixture.nativeElement.querySelector('.action-button.dismiss');
    dismissButton.click();

    expect(mockErrorHandler.clearError).toHaveBeenCalled();
    expect(component.dismiss.emit).toHaveBeenCalled();
  });

  it('should start auto retry countdown when autoRetry is enabled', fakeAsync(() => {
    component.autoRetry = true;
    component.retryDelay = 2;

    const retryableError: ErrorInfo = {
      type: ErrorType.TIMEOUT_ERROR,
      message: 'Request timeout',
      userMessage: 'Request took too long',
      retryable: true,
      timestamp: new Date()
    };

    errorSubject.next(retryableError);
    fixture.detectChanges();

    expect(component.retryCountdown).toBe(2);
    expect(component.retryDisabled).toBeTruthy();

    tick(1000);
    expect(component.retryCountdown).toBe(1);

    tick(1000);
    expect(component.retryCountdown).toBe(0);
    expect(component.retryDisabled).toBeFalsy();
  }));

  it('should return correct error icons for different error types', () => {
    expect(component.getErrorIcon()).toBe('⚠️'); // No error

    component.currentError = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network error',
      userMessage: 'Network error',
      retryable: true,
      timestamp: new Date()
    };
    expect(component.getErrorIcon()).toBe('🌐');

    component.currentError.type = ErrorType.OFFLINE_ERROR;
    expect(component.getErrorIcon()).toBe('📡');

    component.currentError.type = ErrorType.SERVER_ERROR;
    expect(component.getErrorIcon()).toBe('🔧');

    component.currentError.type = ErrorType.VALIDATION_ERROR;
    expect(component.getErrorIcon()).toBe('⚠️');

    component.currentError.type = ErrorType.TIMEOUT_ERROR;
    expect(component.getErrorIcon()).toBe('⏱️');
  });

  it('should return correct error titles for different error types', () => {
    expect(component.getErrorTitle()).toBe('Error'); // No error

    component.currentError = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network error',
      userMessage: 'Network error',
      retryable: true,
      timestamp: new Date()
    };
    expect(component.getErrorTitle()).toBe('Connection Problem');

    component.currentError.type = ErrorType.OFFLINE_ERROR;
    expect(component.getErrorTitle()).toBe('You\'re Offline');

    component.currentError.type = ErrorType.SERVER_ERROR;
    expect(component.getErrorTitle()).toBe('Server Error');

    component.currentError.type = ErrorType.VALIDATION_ERROR;
    expect(component.getErrorTitle()).toBe('Invalid Input');

    component.currentError.type = ErrorType.TIMEOUT_ERROR;
    expect(component.getErrorTitle()).toBe('Request Timeout');
  });

  it('should show debug info when showDebugInfo is true', () => {
    component.showDebugInfo = true;

    const error: ErrorInfo = {
      type: ErrorType.SERVER_ERROR,
      message: 'Server error',
      userMessage: 'Server is down',
      retryable: true,
      timestamp: new Date(),
      details: { status: 500 }
    };

    errorSubject.next(error);
    fixture.detectChanges();

    const debugDetails = fixture.nativeElement.querySelector('.error-details');
    expect(debugDetails).toBeTruthy();

    const debugInfo = fixture.nativeElement.querySelector('.debug-info');
    expect(debugInfo.textContent).toContain('SERVER_ERROR');
    expect(debugInfo.textContent).toContain('Status Code: 500');
  });

  it('should hide actions when showActions is false', () => {
    component.showActions = false;

    const error: ErrorInfo = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network error',
      userMessage: 'Network error',
      retryable: true,
      timestamp: new Date()
    };

    errorSubject.next(error);
    fixture.detectChanges();

    const errorActions = fixture.nativeElement.querySelector('.error-actions');
    expect(errorActions).toBeFalsy();
  });
});