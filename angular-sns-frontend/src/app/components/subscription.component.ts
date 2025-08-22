import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, timer } from 'rxjs';

import { ValidationService } from '../services/validation.service';
import { ApiService } from '../services/api.service';
import { LoadingService } from '../services/loading.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { ConnectivityService } from '../services/connectivity.service';
import { SanitizationService } from '../services/sanitization.service';
import { LoadingIndicatorComponent } from './loading-indicator.component';
import { ErrorDisplayComponent } from './error-display.component';
import { SubscriptionStatus, SubscriptionState } from '../models/subscription.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingIndicatorComponent, ErrorDisplayComponent],
  template: `
    <div class="subscription-container" id="subscribe">
      <!-- Global Error Display -->
      <app-error-display
        [showActions]="true"
        [showConnectivityStatus]="true"
        [showDebugInfo]="false"
        [autoRetry]="true"
        [retryDelay]="3"
        (retry)="onGlobalRetry()"
        (dismiss)="onErrorDismiss()"
        (getHelp)="onGetHelp()">
      </app-error-display>

      <!-- Page header -->
      <div class="page-header">
        <h2 class="page-title">
          <span class="title-icon">📧</span>
          Subscribe to Event Notifications
        </h2>
        <p class="page-description">
          Enter your email address to receive notifications about upcoming events. 
          Stay informed and never miss an important update.
        </p>
      </div>
      
      <!-- Subscription form -->
      <div class="form-container" [class.form-loading]="subscriptionState.status === 'loading'">
        <form 
          [formGroup]="subscriptionForm" 
          (ngSubmit)="onSubmit()" 
          class="subscription-form"
          novalidate
        >
          <div class="form-group">
            <label for="email" class="form-label">
              <span class="label-text">Email Address</span>
              <span class="label-required" aria-label="required">*</span>
            </label>
            
            <div class="input-wrapper">
              <div class="input-icon">
                <span class="icon">✉️</span>
              </div>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                [class.input-error]="isFieldInvalid('email')"
                [class.input-success]="subscriptionForm.get('email')?.valid && subscriptionForm.get('email')?.touched"
                placeholder="your.email@example.com"
                autocomplete="email"
                autocapitalize="none"
                spellcheck="false"
                [attr.aria-describedby]="isFieldInvalid('email') ? 'email-error' : null"
                [attr.aria-invalid]="isFieldInvalid('email')"
              />
              <div class="input-status" *ngIf="subscriptionForm.get('email')?.touched">
                <span 
                  class="status-icon success" 
                  *ngIf="subscriptionForm.get('email')?.valid"
                  aria-label="Valid email"
                >✓</span>
                <span 
                  class="status-icon error" 
                  *ngIf="isFieldInvalid('email')"
                  aria-label="Invalid email"
                >⚠</span>
              </div>
            </div>
            
            <div 
              class="error-messages" 
              *ngIf="isFieldInvalid('email')"
              id="email-error"
              role="alert"
              aria-live="polite"
            >
              <div class="error-message" [class.error-warning]="fieldErrorInfo.severity === 'warning'">
                <span class="error-icon">{{ fieldErrorInfo.severity === 'warning' ? '⚠' : '⚠' }}</span>
                <div class="error-content">
                  <span class="error-text">{{ fieldErrorInfo.message }}</span>
                  <div class="error-suggestions" *ngIf="fieldErrorInfo.suggestions && fieldErrorInfo.suggestions.length > 0">
                    <ul class="suggestions-list">
                      <li *ngFor="let suggestion of fieldErrorInfo.suggestions" class="suggestion-item">
                        {{ suggestion }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Real-time validation feedback -->
            <div class="field-feedback" *ngIf="subscriptionForm.get('email')?.value && !isFieldInvalid('email')">
              <div class="validation-feedback" *ngIf="emailValidationInfo.suggestions.length > 0">
                <div class="feedback-content" [class.feedback-warning]="emailValidationInfo.severity === 'warning'">
                  <span class="feedback-icon">{{ emailValidationInfo.severity === 'warning' ? '💡' : 'ℹ️' }}</span>
                  <div class="feedback-text">
                    <div *ngFor="let suggestion of emailValidationInfo.suggestions" class="suggestion">
                      {{ suggestion }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="field-hint" *ngIf="!isFieldInvalid('email') && emailValidationInfo.suggestions.length === 0">
              We'll send you a confirmation email to verify your subscription.
            </div>
          </div>

          <button 
            type="submit" 
            class="submit-button"
            [disabled]="subscriptionForm.invalid || subscriptionState.status === 'loading'"
            [class.button-loading]="subscriptionState.status === 'loading'"
            [attr.aria-describedby]="subscriptionState.status === 'loading' ? 'loading-text' : null"
          >
            <span *ngIf="subscriptionState.status !== 'loading'" class="button-content">
              <span class="button-icon">📧</span>
              Subscribe Now
            </span>
            <span 
              *ngIf="subscriptionState.status === 'loading'" 
              class="loading-content"
              id="loading-text"
            >
              <span class="spinner" aria-hidden="true"></span>
              <span class="loading-text">Subscribing...</span>
            </span>
          </button>
        </form>

        <!-- Form features -->
        <div class="form-features">
          <div class="feature">
            <span class="feature-icon">🔒</span>
            <span class="feature-text">Your email is secure and private</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📱</span>
            <span class="feature-text">Mobile-friendly notifications</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🚫</span>
            <span class="feature-text">Unsubscribe anytime</span>
          </div>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div 
        *ngIf="subscriptionState.status === 'loading'" 
        class="loading-overlay"
        role="status"
        aria-live="polite"
        aria-label="Processing subscription"
      >
        <app-loading-indicator 
          [show]="true"
          text="Processing your subscription..."
          size="large">
        </app-loading-indicator>
      </div>

      <!-- Success Message -->
      <div 
        *ngIf="subscriptionState.status === 'success'" 
        class="status-message success-message"
        role="alert"
        aria-live="polite"
      >
        <div class="status-icon-large success">
          <span class="icon-bg"></span>
          <span class="icon">✓</span>
        </div>
        <div class="status-content">
          <h3 class="status-title">Subscription Successful!</h3>
          <p class="status-description">
            {{ subscriptionState.message || 'Please check your email to confirm your subscription. You should receive a confirmation email within the next few minutes.' }}
          </p>
          <div class="status-actions">
            <button 
              type="button" 
              class="action-button primary" 
              (click)="onNewSubscription()"
            >
              <span class="button-icon">➕</span>
              Subscribe Another Email
            </button>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div 
        *ngIf="subscriptionState.status === 'error'" 
        class="status-message error-message"
        role="alert"
        aria-live="polite"
      >
        <div class="status-icon-large error">
          <span class="icon-bg"></span>
          <span class="icon">⚠</span>
        </div>
        <div class="status-content">
          <h3 class="status-title">Subscription Failed</h3>
          <p class="status-description">
            {{ subscriptionState.error || 'An error occurred while processing your subscription. Please check your internet connection and try again.' }}
          </p>
          
          <!-- Retry with countdown -->
          <div class="status-actions">
            <button 
              type="button" 
              class="action-button secondary" 
              (click)="onRetry()"
              [disabled]="retryCountdown > 0"
              [attr.aria-describedby]="retryCountdown > 0 ? 'retry-countdown' : null"
            >
              <span *ngIf="retryCountdown === 0" class="button-content">
                <span class="button-icon">🔄</span>
                Try Again
              </span>
              <span *ngIf="retryCountdown > 0" class="button-content" id="retry-countdown">
                <span class="button-icon">⏱️</span>
                Retry in {{ retryCountdown }}s
              </span>
            </button>
            
            <div class="retry-info" *ngIf="retryAttempts > 0">
              <small class="retry-text">
                Attempt {{ retryAttempts + 1 }} of {{ maxRetryAttempts }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subscription-container {
      max-width: 800px;
      margin: 0 auto;
      padding: var(--spacing-md);
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--spacing-2xl);
      padding: var(--spacing-xl) 0;
    }

    .page-title {
      font-size: var(--font-size-3xl);
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: var(--spacing-md);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }

    .title-icon {
      font-size: var(--font-size-4xl);
    }

    .page-description {
      font-size: var(--font-size-lg);
      color: var(--gray-600);
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }

    .form-container {
      background: #ffffff;
      border-radius: var(--border-radius-xl);
      box-shadow: var(--shadow-xl);
      padding: var(--spacing-2xl);
      margin-bottom: var(--spacing-2xl);
      border: 1px solid var(--gray-200);
      border-top: 4px solid var(--primary-color);
      position: relative;
    }

    .form-container.form-loading {
      pointer-events: none;
      opacity: 0.7;
    }

    .form-group {
      margin-bottom: var(--spacing-xl);
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-md);
      color: var(--gray-800);
      font-weight: 600;
    }

    .label-required {
      color: var(--secondary-color);
      font-weight: 700;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: var(--spacing-md);
      z-index: 2;
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      padding: var(--spacing-md) var(--spacing-3xl);
      border: 2px solid var(--gray-300);
      border-radius: var(--border-radius-lg);
      font-size: var(--font-size-lg);
      transition: all 0.3s ease;
      background-color: #ffffff;
      box-sizing: border-box;
      min-height: 56px;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
    }

    .form-input.input-error {
      border-color: var(--secondary-color);
      background-color: #fef2f2;
    }

    .form-input.input-success {
      border-color: var(--success-color);
      background-color: #f0fdf4;
    }

    .input-status {
      position: absolute;
      right: var(--spacing-md);
      z-index: 2;
    }

    .status-icon {
      font-size: var(--font-size-lg);
      font-weight: 700;
    }

    .status-icon.success { color: var(--success-color); }
    .status-icon.error { color: var(--secondary-color); }

    .error-messages {
      margin-top: var(--spacing-md);
    }

    .error-message {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      color: var(--secondary-color);
      font-size: var(--font-size-sm);
      font-weight: 500;
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--border-radius-md);
    }

    .error-message.error-warning {
      color: #92400e;
      background-color: #fffbeb;
      border-color: #fcd34d;
    }

    .error-content {
      flex: 1;
    }

    .error-text {
      display: block;
      margin-bottom: var(--spacing-xs);
    }

    .error-suggestions {
      margin-top: var(--spacing-xs);
    }

    .suggestions-list {
      margin: 0;
      padding-left: var(--spacing-md);
      list-style-type: disc;
    }

    .suggestion-item {
      font-size: var(--font-size-xs);
      color: rgba(153, 27, 27, 0.8);
      margin-bottom: var(--spacing-xs);
    }

    .error-message.error-warning .suggestion-item {
      color: rgba(146, 64, 14, 0.8);
    }

    .field-feedback {
      margin-top: var(--spacing-md);
    }

    .validation-feedback {
      margin-bottom: var(--spacing-sm);
    }

    .feedback-content {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: var(--border-radius-md);
      font-size: var(--font-size-sm);
      color: #0369a1;
    }

    .feedback-content.feedback-warning {
      background-color: #fffbeb;
      border-color: #fcd34d;
      color: #92400e;
    }

    .feedback-icon {
      flex-shrink: 0;
      font-size: var(--font-size-base);
    }

    .feedback-text {
      flex: 1;
    }

    .suggestion {
      margin-bottom: var(--spacing-xs);
    }

    .field-hint {
      margin-top: var(--spacing-md);
      color: var(--gray-600);
      font-size: var(--font-size-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--gray-100);
      border-radius: var(--border-radius-md);
      border-left: 3px solid var(--primary-color);
    }

    .submit-button {
      width: 100%;
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius-lg);
      font-size: var(--font-size-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 64px;
      box-shadow: var(--shadow-md);
    }

    .submit-button:hover:not(:disabled) {
      background: var(--primary-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .submit-button:disabled {
      background: var(--gray-500);
      cursor: not-allowed;
    }

    .button-content, .loading-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .form-features {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-xl);
      border-top: 1px solid var(--gray-200);
    }

    .feature {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background-color: var(--gray-50);
      border-radius: var(--border-radius-lg);
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal);
      border-radius: var(--border-radius-xl);
    }

    .status-message {
      background: #ffffff;
      border-radius: var(--border-radius-xl);
      box-shadow: var(--shadow-xl);
      padding: var(--spacing-2xl);
      text-align: center;
      border: 1px solid var(--gray-200);
    }

    .status-icon-large {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      margin-bottom: var(--spacing-xl);
      border-radius: 50%;
      position: relative;
    }

    .status-icon-large .icon {
      font-size: var(--font-size-4xl);
      font-weight: 700;
      z-index: 1;
    }

    .status-icon-large.success .icon { color: var(--success-color); }
    .status-icon-large.error .icon { color: var(--secondary-color); }

    .status-title {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      margin-bottom: var(--spacing-md);
      color: var(--gray-900);
    }

    .status-description {
      font-size: var(--font-size-base);
      line-height: 1.6;
      color: var(--gray-600);
      margin-bottom: var(--spacing-xl);
    }

    .status-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
    }

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-xl);
      border: none;
      border-radius: var(--border-radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 200px;
      min-height: 48px;
    }

    .action-button.primary {
      background: var(--success-color);
      color: white;
    }

    .action-button.secondary {
      background: var(--secondary-color);
      color: white;
    }

    .action-button:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .action-button:disabled {
      background: var(--gray-500);
      cursor: not-allowed;
    }

    /* Responsive */
    @media (min-width: 576px) {
      .form-features { grid-template-columns: repeat(3, 1fr); }
      .status-actions { flex-direction: row; }
    }

    @media (max-width: 575.98px) {
      .subscription-container { padding: var(--spacing-sm); }
      .form-container { padding: var(--spacing-lg); }
      .page-title { font-size: var(--font-size-2xl); flex-direction: column; }
      .form-input { font-size: 16px; }
      .action-button { min-width: 100%; }
    }
  `]
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  subscriptionForm!: FormGroup;
  subscriptionState: SubscriptionState = {
    status: SubscriptionStatus.IDLE
  };

  // Enhanced error handling
  fieldErrorInfo: any = { hasError: false, errorType: '', message: '', severity: 'error', suggestions: [] };
  emailValidationInfo: any = { isValid: true, errors: [], suggestions: [], severity: 'info' };

  // Retry functionality
  retryAttempts = 0;
  maxRetryAttempts = 3;
  retryCountdown = 0;
  private retryDelays = [1, 3, 5]; // seconds for each retry attempt

  private destroy$ = new Subject<void>();
  private lastSubmittedEmail = '';

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationService,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private errorHandler: ErrorHandlerService,
    private connectivity: ConnectivityService,
    private sanitizationService: SanitizationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.subscriptionForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        ...this.validationService.getEmailValidators()
      ]]
    });

    // Subscribe to form value changes for real-time validation feedback
    this.subscriptionForm.get('email')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((email) => {
        // Reset error state when user starts typing after an error
        if (this.subscriptionState.status === SubscriptionStatus.ERROR) {
          this.subscriptionState = { status: SubscriptionStatus.IDLE };
        }

        // Update real-time validation feedback
        this.updateValidationFeedback(email);
      });
  }

  onSubmit(): void {
    if (this.subscriptionForm.valid) {
      const rawEmail = this.subscriptionForm.get('email')?.value;
      
      // Sanitize input before processing
      const sanitizedEmail = this.sanitizationService.sanitizeEmail(rawEmail);
      
      // Validate that the sanitized input is safe
      if (!this.sanitizationService.validateInputSafety(sanitizedEmail)) {
        this.subscriptionState = {
          status: SubscriptionStatus.ERROR,
          error: 'Invalid input detected. Please enter a valid email address.'
        };
        return;
      }
      
      this.submitSubscription(sanitizedEmail);
    } else {
      this.markFormGroupTouched();
    }
  }

  private submitSubscription(email: string): void {
    this.lastSubmittedEmail = email;
    this.subscriptionState = { status: SubscriptionStatus.LOADING };
    this.loadingService.setLoading(true);

    this.apiService.subscribe(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingService.setLoading(false);
          this.subscriptionState = {
            status: SubscriptionStatus.SUCCESS,
            message: response.message
          };
          this.resetForm();
          this.resetRetryState();
        },
        error: (error) => {
          this.loadingService.setLoading(false);
          this.handleSubscriptionError(error);
          // Also let the global error handler process the error
          this.errorHandler.handleError(error);
        }
      });
  }

  onRetry(): void {
    if (this.retryAttempts < this.maxRetryAttempts && this.retryCountdown === 0) {
      const delay = this.retryDelays[this.retryAttempts] || 5;
      this.startRetryCountdown(delay);
    }
  }

  onNewSubscription(): void {
    this.subscriptionState = { status: SubscriptionStatus.IDLE };
    this.resetRetryState();
    this.resetForm();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.subscriptionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.subscriptionForm.get(fieldName);
    if (field && field.errors) {
      this.fieldErrorInfo = this.validationService.getFieldErrorInfo(field.errors);
      return this.fieldErrorInfo.message;
    }
    return '';
  }

  onGlobalRetry(): void {
    if (this.lastSubmittedEmail) {
      this.submitSubscription(this.lastSubmittedEmail);
    }
  }

  onErrorDismiss(): void {
    this.errorHandler.clearError();
  }

  onGetHelp(): void {
    // In a real application, this could open a help modal or redirect to support
    const helpMessage = `
      If you're experiencing issues with subscription:
      
      1. Check your internet connection
      2. Verify your email address is correct
      3. Try again in a few minutes
      4. Contact support if the problem persists
      
      Error details have been logged for troubleshooting.
    `;
    
    alert(helpMessage);
  }

  private updateValidationFeedback(email: string): void {
    if (email) {
      this.emailValidationInfo = this.validationService.validateEmailWithSuggestions(email);
    } else {
      this.emailValidationInfo = { isValid: true, errors: [], suggestions: [], severity: 'info' };
    }

    // Update field error info for current validation state
    const field = this.subscriptionForm.get('email');
    if (field && field.errors) {
      this.fieldErrorInfo = this.validationService.getFieldErrorInfo(field.errors);
    } else {
      this.fieldErrorInfo = { hasError: false, errorType: '', message: '', severity: 'error', suggestions: [] };
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.subscriptionForm.controls).forEach(key => {
      const control = this.subscriptionForm.get(key);
      control?.markAsTouched();
    });
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again later.';
  }

  private handleSubscriptionError(error: any): void {
    const errorMessage = this.getErrorMessage(error);
    const isNetworkError = this.isNetworkError(error);
    
    this.subscriptionState = {
      status: SubscriptionStatus.ERROR,
      error: errorMessage
    };

    // Only allow retry for network errors and if we haven't exceeded max attempts
    if (isNetworkError && this.retryAttempts < this.maxRetryAttempts) {
      // Auto-retry for network errors with exponential backoff
      const delay = this.retryDelays[this.retryAttempts] || 5;
      this.startRetryCountdown(delay);
    } else {
      // Reset retry attempts for non-network errors or when max attempts reached
      this.resetRetryState();
    }
  }

  private isNetworkError(error: any): boolean {
    // Check for network-related errors
    return error?.message?.includes('Network connection failed') ||
           error?.message?.includes('Network error') ||
           error?.status === 0 ||
           error?.name === 'TimeoutError';
  }

  private startRetryCountdown(seconds: number): void {
    this.retryCountdown = seconds;
    
    const countdown$ = timer(0, 1000).pipe(
      takeUntil(this.destroy$)
    );

    countdown$.subscribe(() => {
      this.retryCountdown--;
      
      if (this.retryCountdown <= 0) {
        // Automatically retry when countdown reaches 0
        this.retryAttempts++;
        this.submitSubscription(this.lastSubmittedEmail);
      }
    });
  }

  private resetRetryState(): void {
    this.retryAttempts = 0;
    this.retryCountdown = 0;
  }

  private resetForm(): void {
    this.subscriptionForm.reset();
    this.subscriptionForm.markAsUntouched();
    this.subscriptionForm.markAsPristine();
  }
}