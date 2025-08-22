import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { 
  SubscriptionRequest, 
  SubscriptionResponse 
} from '../models/subscription.model';
import { Event, EventResponse } from '../models/event.model';
import { ApiConfigUtil } from '../utils/api-config.util';
import { SecurityService } from './security.service';
import { SanitizationService } from './sanitization.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly requestTimeout = 30000; // 30 seconds

  constructor(
    private http: HttpClient,
    private securityService: SecurityService,
    private sanitizationService: SanitizationService
  ) {
    // Validate API configuration on service initialization
    if (!ApiConfigUtil.validateConfig()) {
      console.warn('API configuration is incomplete. Please check environment settings.');
    }
    
    // Validate security configuration
    if (!this.securityService.validateApiKey()) {
      console.error('API key validation failed');
    }
    
    if (!this.securityService.isSecureEnvironment()) {
      console.warn('Application is not running in a secure environment');
    }
  }

  /**
   * Subscribe user to SNS topic
   * @param email User email address
   * @returns Observable with subscription response
   */
  subscribe(email: string): Observable<SubscriptionResponse> {
    // Validate secure environment before making API calls
    if (!this.securityService.isSecureEnvironment()) {
      return throwError(() => new Error('Insecure environment detected. Cannot proceed with API request.'));
    }
    
    // Sanitize and validate input
    const sanitizedEmail = this.sanitizationService.sanitizeEmail(email);
    if (!this.sanitizationService.validateInputSafety(sanitizedEmail)) {
      return throwError(() => new Error('Invalid input detected'));
    }
    
    const request: SubscriptionRequest = { email: sanitizedEmail };
    const headers = this.getSecureHeaders();

    return this.http.post<SubscriptionResponse>(
      ApiConfigUtil.getEndpointUrl('/subscribe'),
      request,
      { headers }
    ).pipe(
      timeout(this.requestTimeout),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get available events (for future enhancement)
   * @returns Observable with events list
   */
  getEvents(): Observable<Event[]> {
    // Validate secure environment before making API calls
    if (!this.securityService.isSecureEnvironment()) {
      return throwError(() => new Error('Insecure environment detected. Cannot proceed with API request.'));
    }
    
    const headers = this.getSecureHeaders();

    return this.http.get<Event[]>(
      ApiConfigUtil.getEndpointUrl('/event'),
      { headers }
    ).pipe(
      timeout(this.requestTimeout),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get HTTP headers for requests
   * @returns HttpHeaders with required headers
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get secure HTTP headers for requests including security headers
   * @returns HttpHeaders with security headers
   */
  private getSecureHeaders(): HttpHeaders {
    const baseHeaders = {
      'Content-Type': 'application/json'
    };
    
    // Add security headers
    const securityHeaders = this.securityService.getSecurityHeaders();
    
    return new HttpHeaders({
      ...baseHeaders,
      ...securityHeaders
    });
  }

  /**
   * Handle HTTP errors
   * @param error HttpErrorResponse
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    // Sanitize error data before logging to prevent sensitive information leakage
    const sanitizedError = this.securityService.sanitizeForLogging(error);
    console.error('API Error:', sanitizedError);
    
    // Return the original error to maintain error details
    return throwError(() => error);
  }
}