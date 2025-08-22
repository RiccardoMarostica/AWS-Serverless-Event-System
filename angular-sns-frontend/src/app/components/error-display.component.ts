import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { ErrorHandlerService, ErrorType, ErrorInfo } from '../services/error-handler.service';
import { ConnectivityService } from '../services/connectivity.service';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="currentError || showConnectivityStatus" 
      class="error-container"
      [class.error-network]="currentError?.type === ErrorType.NETWORK_ERROR"
      [class.error-offline]="currentError?.type === ErrorType.OFFLINE_ERROR"
      [class.error-server]="currentError?.type === ErrorType.SERVER_ERROR"
      [class.error-validation]="currentError?.type === ErrorType.VALIDATION_ERROR"
      [class.error-timeout]="currentError?.type === ErrorType.TIMEOUT_ERROR"
      [class.connectivity-status]="showConnectivityStatus && !currentError"
      role="alert"
      aria-live="polite"
    >
      <!-- Offline Status Banner -->
      <div 
        *ngIf="!isOnline && showConnectivityStatus" 
        class="connectivity-banner offline"
      >
        <div class="banner-content">
          <span class="banner-icon">📡</span>
          <div class="banner-text">
            <strong>You're offline</strong>
            <span class="banner-description">Check your internet connection</span>
          </div>
        </div>
      </div>

      <!-- Poor Connection Warning -->
      <div 
        *ngIf="isOnline && connectionQuality === 'poor' && showConnectivityStatus" 
        class="connectivity-banner poor-connection"
      >
        <div class="banner-content">
          <span class="banner-icon">⚠️</span>
          <div class="banner-text">
            <strong>Slow connection detected</strong>
            <span class="banner-description">Some features may be slower than usual</span>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="currentError" class="error-message">
        <div class="error-header">
          <div class="error-icon">
            <span [innerHTML]="getErrorIcon()"></span>
          </div>
          <div class="error-content">
            <h4 class="error-title">{{ getErrorTitle() }}</h4>
            <p class="error-description">{{ currentError.userMessage }}</p>
            
            <!-- Additional error details for debugging (only in development) -->
            <details *ngIf="showDebugInfo" class="error-details">
              <summary>Technical Details</summary>
              <div class="debug-info">
                <p><strong>Type:</strong> {{ currentError.type }}</p>
                <p><strong>Time:</strong> {{ currentError.timestamp | date:'medium' }}</p>
                <p><strong>Retryable:</strong> {{ currentError.retryable ? 'Yes' : 'No' }}</p>
                <p *ngIf="currentError.details?.status">
                  <strong>Status Code:</strong> {{ currentError.details.status }}
                </p>
              </div>
            </details>
          </div>
        </div>

        <!-- Error Actions -->
        <div class="error-actions" *ngIf="showActions">
          <button 
            *ngIf="currentError.retryable"
            type="button"
            class="action-button retry"
            (click)="onRetry()"
            [disabled]="retryDisabled"
          >
            <span class="button-icon">🔄</span>
            {{ retryDisabled ? 'Retrying...' : 'Try Again' }}
          </button>

          <button 
            type="button"
            class="action-button dismiss"
            (click)="onDismiss()"
          >
            <span class="button-icon">✕</span>
            Dismiss
          </button>

          <!-- Help/Support button for persistent errors -->
          <button 
            *ngIf="!currentError.retryable"
            type="button"
            class="action-button help"
            (click)="onGetHelp()"
          >
            <span class="button-icon">❓</span>
            Get Help
          </button>
        </div>

        <!-- Retry countdown -->
        <div *ngIf="retryCountdown > 0" class="retry-countdown">
          <div class="countdown-bar">
            <div 
              class="countdown-progress" 
              [style.width.%]="(retryCountdown / maxRetryCountdown) * 100"
            ></div>
          </div>
          <span class="countdown-text">
            Retrying automatically in {{ retryCountdown }}s...
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      margin-bottom: var(--spacing-md);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }

    .connectivity-banner {
      padding: var(--spacing-md);
      border-left: 4px solid;
    }

    .connectivity-banner.offline {
      background-color: #fef2f2;
      border-color: #ef4444;
      color: #991b1b;
    }

    .connectivity-banner.poor-connection {
      background-color: #fffbeb;
      border-color: #f59e0b;
      color: #92400e;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .banner-icon {
      font-size: var(--font-size-xl);
      flex-shrink: 0;
    }

    .banner-text {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .banner-description {
      font-size: var(--font-size-sm);
      opacity: 0.8;
    }

    .error-message {
      padding: var(--spacing-lg);
    }

    .error-container.error-network .error-message {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    .error-container.error-offline .error-message {
      background-color: #f3f4f6;
      border-left: 4px solid #6b7280;
      color: #374151;
    }

    .error-container.error-server .error-message {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      color: #991b1b;
    }

    .error-container.error-validation .error-message {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }

    .error-container.error-timeout .error-message {
      background-color: #fdf4ff;
      border-left: 4px solid #a855f7;
      color: #7c2d12;
    }

    .error-header {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .error-icon {
      flex-shrink: 0;
      font-size: var(--font-size-2xl);
      line-height: 1;
    }

    .error-content {
      flex: 1;
    }

    .error-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      margin: 0 0 var(--spacing-sm) 0;
    }

    .error-description {
      font-size: var(--font-size-base);
      line-height: 1.5;
      margin: 0;
    }

    .error-details {
      margin-top: var(--spacing-md);
      font-size: var(--font-size-sm);
    }

    .error-details summary {
      cursor: pointer;
      font-weight: 500;
      margin-bottom: var(--spacing-sm);
    }

    .debug-info {
      padding: var(--spacing-sm);
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: var(--border-radius-md);
      font-family: monospace;
    }

    .debug-info p {
      margin: var(--spacing-xs) 0;
    }

    .error-actions {
      display: flex;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      margin-top: var(--spacing-md);
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--border-radius-md);
      font-size: var(--font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .action-button.retry {
      background-color: #3b82f6;
      color: white;
    }

    .action-button.retry:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .action-button.dismiss {
      background-color: #6b7280;
      color: white;
    }

    .action-button.dismiss:hover {
      background-color: #4b5563;
    }

    .action-button.help {
      background-color: #10b981;
      color: white;
    }

    .action-button.help:hover {
      background-color: #059669;
    }

    .retry-countdown {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .countdown-bar {
      width: 100%;
      height: 4px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: var(--spacing-sm);
    }

    .countdown-progress {
      height: 100%;
      background-color: #3b82f6;
      transition: width 1s linear;
    }

    .countdown-text {
      font-size: var(--font-size-sm);
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 575.98px) {
      .error-header {
        flex-direction: column;
        text-align: center;
      }

      .error-actions {
        justify-content: center;
      }

      .action-button {
        flex: 1;
        justify-content: center;
        min-width: 120px;
      }
    }
  `]
})
export class ErrorDisplayComponent implements OnInit, OnDestroy {
  @Input() showActions = true;
  @Input() showConnectivityStatus = true;
  @Input() showDebugInfo = false;
  @Input() autoRetry = false;
  @Input() retryDelay = 3; // seconds

  @Output() retry = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
  @Output() getHelp = new EventEmitter<void>();

  currentError: ErrorInfo | null = null;
  isOnline = true;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline' = 'good';
  retryDisabled = false;
  retryCountdown = 0;
  maxRetryCountdown = 0;

  readonly ErrorType = ErrorType;

  private destroy$ = new Subject<void>();
  private retryTimer?: number;

  constructor(
    private errorHandler: ErrorHandlerService,
    private connectivity: ConnectivityService
  ) {}

  ngOnInit(): void {
    // Subscribe to error updates
    this.errorHandler.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.currentError = error;
        
        if (error && this.autoRetry && error.retryable) {
          this.startAutoRetry();
        }
      });

    // Subscribe to connectivity updates
    this.connectivity.connectivity$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isOnline = status.isOnline;
        this.connectionQuality = this.connectivity.getConnectionQuality();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearRetryTimer();
  }

  getErrorIcon(): string {
    if (!this.currentError) return '⚠️';

    switch (this.currentError.type) {
      case ErrorType.NETWORK_ERROR:
        return '🌐';
      case ErrorType.OFFLINE_ERROR:
        return '📡';
      case ErrorType.SERVER_ERROR:
        return '🔧';
      case ErrorType.VALIDATION_ERROR:
        return '⚠️';
      case ErrorType.TIMEOUT_ERROR:
        return '⏱️';
      default:
        return '❌';
    }
  }

  getErrorTitle(): string {
    if (!this.currentError) return 'Error';

    switch (this.currentError.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Connection Problem';
      case ErrorType.OFFLINE_ERROR:
        return 'You\'re Offline';
      case ErrorType.SERVER_ERROR:
        return 'Server Error';
      case ErrorType.VALIDATION_ERROR:
        return 'Invalid Input';
      case ErrorType.TIMEOUT_ERROR:
        return 'Request Timeout';
      default:
        return 'Something Went Wrong';
    }
  }

  onRetry(): void {
    this.retry.emit();
  }

  onDismiss(): void {
    this.errorHandler.clearError();
    this.dismiss.emit();
  }

  onGetHelp(): void {
    this.getHelp.emit();
  }

  private startAutoRetry(): void {
    this.clearRetryTimer();
    this.retryCountdown = this.retryDelay;
    this.maxRetryCountdown = this.retryDelay;
    this.retryDisabled = true;

    this.retryTimer = window.setInterval(() => {
      this.retryCountdown--;
      
      if (this.retryCountdown <= 0) {
        this.clearRetryTimer();
        this.retryDisabled = false;
        this.onRetry();
      }
    }, 1000);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }
    this.retryCountdown = 0;
    this.retryDisabled = false;
  }
}