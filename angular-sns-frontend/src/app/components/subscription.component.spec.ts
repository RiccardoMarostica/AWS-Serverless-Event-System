import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';

import { SubscriptionComponent } from './subscription.component';
import { ValidationService } from '../services/validation.service';
import { ApiService } from '../services/api.service';
import { LoadingService } from '../services/loading.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { ConnectivityService } from '../services/connectivity.service';
import { SubscriptionStatus } from '../models/subscription.model';

describe('SubscriptionComponent', () => {
    let component: SubscriptionComponent;
    let fixture: ComponentFixture<SubscriptionComponent>;
    let mockValidationService: jasmine.SpyObj<ValidationService>;
    let mockApiService: jasmine.SpyObj<ApiService>;
    let mockLoadingService: jasmine.SpyObj<LoadingService>;
    let mockErrorHandler: jasmine.SpyObj<ErrorHandlerService>;
    let mockConnectivity: jasmine.SpyObj<ConnectivityService>;

    beforeEach(async () => {
        const validationServiceSpy = jasmine.createSpyObj('ValidationService', [
            'getEmailValidators',
            'getErrorMessage',
            'getFieldErrorInfo',
            'validateEmailWithSuggestions'
        ]);
        const apiServiceSpy = jasmine.createSpyObj('ApiService', ['subscribe']);
        const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['setLoading']);
        const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError', 'clearError'], {
            error$: of(null)
        });
        const connectivitySpy = jasmine.createSpyObj('ConnectivityService', ['getCurrentStatus'], {
            connectivity$: of({
                isOnline: true,
                connectionType: 'wifi',
                lastChecked: new Date()
            })
        });

        await TestBed.configureTestingModule({
            imports: [SubscriptionComponent, ReactiveFormsModule, HttpClientTestingModule],
            providers: [
                { provide: ValidationService, useValue: validationServiceSpy },
                { provide: ApiService, useValue: apiServiceSpy },
                { provide: LoadingService, useValue: loadingServiceSpy },
                { provide: ErrorHandlerService, useValue: errorHandlerSpy },
                { provide: ConnectivityService, useValue: connectivitySpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SubscriptionComponent);
        component = fixture.componentInstance;
        mockValidationService = TestBed.inject(ValidationService) as jasmine.SpyObj<ValidationService>;
        mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
        mockErrorHandler = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
        mockConnectivity = TestBed.inject(ConnectivityService) as jasmine.SpyObj<ConnectivityService>;

        // Setup default mock returns
        mockValidationService.getEmailValidators.and.returnValue([]);
        mockValidationService.getErrorMessage.and.returnValue('Invalid email');
        mockValidationService.getFieldErrorInfo.and.returnValue({
            hasError: false,
            errorType: '',
            message: '',
            severity: 'error' as const,
            suggestions: []
        });
        mockValidationService.validateEmailWithSuggestions.and.returnValue({
            isValid: true,
            errors: [],
            suggestions: [],
            severity: 'info' as const
        });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form on ngOnInit', () => {
        component.ngOnInit();
        expect(component.subscriptionForm).toBeDefined();
        expect(component.subscriptionForm.get('email')).toBeDefined();
    });

    it('should call validation service for email validators', () => {
        component.ngOnInit();
        expect(mockValidationService.getEmailValidators).toHaveBeenCalled();
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should be invalid when email is empty', () => {
            component.subscriptionForm.get('email')?.setValue('');
            expect(component.subscriptionForm.invalid).toBe(true);
        });

        it('should be valid when email is correct', () => {
            component.subscriptionForm.get('email')?.setValue('test@example.com');
            expect(component.subscriptionForm.valid).toBe(true);
        });

        it('should show field as invalid when touched and has errors', () => {
            const emailControl = component.subscriptionForm.get('email');
            emailControl?.setValue('');
            emailControl?.markAsTouched();

            expect(component.isFieldInvalid('email')).toBe(true);
        });

        it('should not show field as invalid when not touched', () => {
            const emailControl = component.subscriptionForm.get('email');
            emailControl?.setValue('');

            expect(component.isFieldInvalid('email')).toBe(false);
        });

        it('should get error message from validation service', () => {
            const emailControl = component.subscriptionForm.get('email');
            emailControl?.setValue('');
            emailControl?.markAsTouched();
            
            // Set up the mock to return the expected error info
            mockValidationService.getFieldErrorInfo.and.returnValue({
                hasError: true,
                errorType: 'required',
                message: 'Invalid email',
                severity: 'error' as const,
                suggestions: []
            });

            const errorMessage = component.getFieldErrorMessage('email');
            expect(mockValidationService.getFieldErrorInfo).toHaveBeenCalled();
            expect(errorMessage).toBe('Invalid email');
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should not submit when form is invalid', () => {
            component.subscriptionForm.get('email')?.setValue('');
            component.onSubmit();

            expect(mockApiService.subscribe).not.toHaveBeenCalled();
        });

        it('should submit when form is valid', () => {
            mockApiService.subscribe.and.returnValue(of({ message: 'Success' }));

            component.subscriptionForm.get('email')?.setValue('test@example.com');
            component.onSubmit();

            expect(mockApiService.subscribe).toHaveBeenCalledWith('test@example.com');
        });

        it('should set loading state during submission', () => {
            // Use a Subject to control when the observable emits
            const subject = new Subject<any>();
            mockApiService.subscribe.and.returnValue(subject.asObservable());

            component.subscriptionForm.get('email')?.setValue('test@example.com');
            component.onSubmit();

            // The loading state should be set immediately
            expect(component.subscriptionState.status).toBe(SubscriptionStatus.LOADING);

            // Complete the observable
            subject.next({ message: 'Success' });
            subject.complete();
        });

        it('should set success state on successful submission', () => {
            const mockResponse = { message: 'Subscription successful' };
            mockApiService.subscribe.and.returnValue(of(mockResponse));

            component.subscriptionForm.get('email')?.setValue('test@example.com');
            component.onSubmit();

            expect(component.subscriptionState.status).toBe(SubscriptionStatus.SUCCESS);
            expect(component.subscriptionState.message).toBe('Subscription successful');
        });

        it('should reset form after successful submission', () => {
            mockApiService.subscribe.and.returnValue(of({ message: 'Success' }));

            component.subscriptionForm.get('email')?.setValue('test@example.com');
            component.onSubmit();

            expect(component.subscriptionForm.get('email')?.value).toBe(null);
        });

        it('should set error state on failed submission', () => {
            const mockError = { error: { message: 'Subscription failed' } };
            mockApiService.subscribe.and.returnValue(throwError(() => mockError));

            component.subscriptionForm.get('email')?.setValue('test@example.com');
            component.onSubmit();

            expect(component.subscriptionState.status).toBe(SubscriptionStatus.ERROR);
            expect(component.subscriptionState.error).toBe('Subscription failed');
        });

        it('should mark all fields as touched when form is invalid on submit', () => {
            component.subscriptionForm.get('email')?.setValue('');
            component.onSubmit();

            expect(component.subscriptionForm.get('email')?.touched).toBe(true);
        });
    });

    describe('Retry Functionality', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should start retry countdown for network errors', () => {
            component.subscriptionState = {
                status: SubscriptionStatus.ERROR,
                error: 'Network connection failed'
            };
            component.retryAttempts = 0;

            component.onRetry();

            expect(component.retryCountdown).toBeGreaterThan(0);
        });

        it('should not retry if max attempts reached', () => {
            component.subscriptionState = {
                status: SubscriptionStatus.ERROR,
                error: 'Network connection failed'
            };
            component.retryAttempts = component.maxRetryAttempts;

            const initialCountdown = component.retryCountdown;
            component.onRetry();

            expect(component.retryCountdown).toBe(initialCountdown);
        });

        it('should reset state on new subscription', () => {
            component.subscriptionState = {
                status: SubscriptionStatus.ERROR,
                error: 'Some error'
            };
            component.retryAttempts = 2;

            component.onNewSubscription();

            expect(component.subscriptionState.status).toBe(SubscriptionStatus.IDLE);
            expect(component.retryAttempts).toBe(0);
        });
    });

    describe('Real-time Validation', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should reset error state when user starts typing after error', () => {
            component.subscriptionState = {
                status: SubscriptionStatus.ERROR,
                error: 'Some error'
            };

            component.subscriptionForm.get('email')?.setValue('test@example.com');

            expect(component.subscriptionState.status).toBe(SubscriptionStatus.IDLE);
        });
    });

    describe('Template Integration', () => {
        beforeEach(() => {
            component.ngOnInit();
            fixture.detectChanges();
        });

        it('should render form elements', () => {
            const compiled = fixture.nativeElement;
            expect(compiled.querySelector('form')).toBeTruthy();
            expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
            expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
        });

        it('should disable submit button when form is invalid', () => {
            component.subscriptionForm.get('email')?.setValue('');
            fixture.detectChanges();

            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBe(true);
        });

        it('should enable submit button when form is valid', () => {
            component.subscriptionForm.get('email')?.setValue('test@example.com');
            fixture.detectChanges();

            const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
            expect(submitButton.disabled).toBe(false);
        });

        it('should show success message when subscription succeeds', () => {
            component.subscriptionState = {
                status: SubscriptionStatus.SUCCESS,
                message: 'Success!'
            };
            fixture.detectChanges();

            const successMessage = fixture.nativeElement.querySelector('.success-message');
            expect(successMessage).toBeTruthy();
            expect(successMessage.textContent).toContain('Success!');
        });

        it('should show error message when subscription fails', () => {
            component.subscriptionState = {
                status: SubscriptionStatus.ERROR,
                error: 'Failed!'
            };
            fixture.detectChanges();

            const errorMessage = fixture.nativeElement.querySelector('.error-message');
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.textContent).toContain('Failed!');
        });
    });
});