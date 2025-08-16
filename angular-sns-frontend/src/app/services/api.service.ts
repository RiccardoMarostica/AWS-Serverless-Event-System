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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly requestTimeout = 30000; // 30 seconds

  constructor(private http: HttpClient) {
    // Validate API configuration on service initialization
    if (!ApiConfigUtil.validateConfig()) {
      console.warn('API configuration is incomplete. Please check environment settings.');
    }
  }

  /**
   * Subscribe user to SNS topic
   * @param email User email address
   * @returns Observable with subscription response
   */
  subscribe(email: string): Observable<SubscriptionResponse> {
    const request: SubscriptionRequest = { email };
    const headers = this.getHeaders();

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
    const headers = this.getHeaders();

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
   * Handle HTTP errors
   * @param error HttpErrorResponse
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your email address.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please try again later.';
          break;
        case 403:
          errorMessage = 'Access forbidden. Please contact support.';
          break;
        case 404:
          errorMessage = 'Service not found. Please try again later.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait and try again.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Network connection failed. Please check your internet connection.';
          break;
        default:
          errorMessage = `Server error (${error.status}): ${error.message}`;
      }

      // Try to extract error message from response body
      if (error.error && typeof error.error === 'object') {
        if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.error) {
          errorMessage = error.error.error;
        }
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}