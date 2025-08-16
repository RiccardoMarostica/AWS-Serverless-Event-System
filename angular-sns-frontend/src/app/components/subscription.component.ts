import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, timer } from 'rxjs';

import { ValidationService } from '../services/validation.service';
import { ApiService } from '../services/api.service';
import { LoadingService } from '../services/loading.service';
import { LoadingIndicatorComponent } from './loading-indicator.component';
import { SubscriptionStatus, SubscriptionState } from '../models/subscription.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingIndicatorComponent],
  template: `
    <div class="subscription-container">
      <h2>Subscribe to Event Notifications</h2>
      <p class="description">Enter your email address to receive notifications about upcoming events.</p>
      
      <form [formGroup]="subscriptionForm" (ngSubmit)="onSubmit()" class="subscription-form">
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="form-input"
            [class.error]="isFieldInvalid('email')"
            placeholder="Enter your email address"
            autocomplete="email"
          />
          
          <div class="error-messages" *ngIf="isFieldInvalid('email')">
            <span class="error-message">{{ getFieldErrorMessage('email') }}</span>
          </div>
        </div>

        <button 
          type="submit" 
          class="submit-button"
          [disabled]="subscriptionForm.invalid || subscriptionState.status === 'loading'"
          [class.loading]="subscriptionState.status === 'loading'"
        >
          <span *ngIf="subscriptionState.status !== 'loading'">Subscribe</span>
          <span *ngIf="subscriptionState.status === 'loading'" class="loading-text">
            <span class="spinner"></span>
            Subscribing...
          </span>
        </button>
      </form>

      <!-- Loading Indicator -->
      <app-loading-indicator 
        *ngIf="subscriptionState.status === 'loading'"
        [show]="true"
        text="Processing your subscription..."
        size="large">
      </app-loading-indicator>

      <!-- Success Message -->
      <div *ngIf="subscriptionState.status === 'success'" class="success-message">
        <div class="success-icon">✓</div>
        <h3>Subscription Successful!</h3>
        <p>{{ subscriptionState.message || 'Please check your email to confirm your subscription.' }}</p>
        <button type="button" class="success-button" (click)="onNewSubscription()">
          Subscribe Another Email
        </button>
      </div>

      <!-- Error Message -->
      <div *ngIf="subscriptionState.status === 'error'" class="error-message-container">
        <div class="error-icon">⚠</div>
        <h3>Subscription Failed</h3>
        <p>{{ subscriptionState.error || 'An error occurred while processing your subscription. Please try again.' }}</p>
        
        <!-- Retry with countdown -->
        <div class="retry-section">
          <button 
            type="button" 
            class="retry-button" 
            (click)="onRetry()"
            [disabled]="retryCountdown > 0"
          >
            <span *ngIf="retryCountdown === 0">Try Again</span>
            <span *ngIf="retryCountdown > 0">Retry in {{ retryCountdown }}s</span>
          </button>
          
          <div class="retry-info" *ngIf="retryAttempts > 0">
            <small>Attempt {{ retryAttempts + 1 }} of {{ maxRetryAttempts }}</small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subscription-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #333;
      margin-bottom: 0.5rem;
      text-align: center;
      font-size: 1.8rem;
    }

    .description {
      color: #666;
      font-size: 1rem;
      text-align: center;
      margin-bottom: 2rem;
    }

    .subscription-form {
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .form-input.error {
      border-color: #dc3545;
    }

    .error-messages {
      margin-top: 0.5rem;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      display: block;
    }

    .submit-button {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s ease;
      position: relative;
      min-height: 48px;
    }

    .submit-button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .submit-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .submit-button.loading {
      background-color: #6c757d;
    }

    .loading-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .success-message {
      text-align: center;
      padding: 2rem;
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      color: #155724;
    }

    .success-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #28a745;
    }

    .success-message h3 {
      margin: 0 0 1rem 0;
      color: #155724;
    }

    .success-message p {
      margin: 0;
      color: #155724;
    }

    .error-message-container {
      text-align: center;
      padding: 2rem;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      color: #721c24;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #dc3545;
    }

    .error-message-container h3 {
      margin: 0 0 1rem 0;
      color: #721c24;
    }

    .error-message-container p {
      margin: 0 0 1.5rem 0;
      color: #721c24;
    }

    .retry-button {
      padding: 0.5rem 1rem;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.3s ease;
    }

    .retry-button:hover:not(:disabled) {
      background-color: #c82333;
    }

    .retry-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .success-button {
      padding: 0.5rem 1rem;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.3s ease;
      margin-top: 1rem;
    }

    .success-button:hover {
      background-color: #218838;
    }

    .retry-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .retry-info {
      color: #6c757d;
      font-size: 0.8rem;
    }

    @media (max-width: 768px) {
      .subscription-container {
        margin: 1rem;
        padding: 1.5rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      .form-input {
        font-size: 16px; /* Prevents zoom on iOS */
      }
    }
  `]
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  subscriptionForm!: FormGroup;
  subscriptionState: SubscriptionState = {
    status: SubscriptionStatus.IDLE
  };

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
    private loadingService: LoadingService
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
      .subscribe(() => {
        // Reset error state when user starts typing after an error
        if (this.subscriptionState.status === SubscriptionStatus.ERROR) {
          this.subscriptionState = { status: SubscriptionStatus.IDLE };
        }
      });
  }

  onSubmit(): void {
    if (this.subscriptionForm.valid) {
      const email = this.subscriptionForm.get('email')?.value;
      this.submitSubscription(email);
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
      return this.validationService.getErrorMessage(field.errors);
    }
    return '';
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