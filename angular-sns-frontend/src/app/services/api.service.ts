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
    // Let the global error handler categorize and handle the error
    console.error('API Error:', error);
    
    // Return the original error to maintain error details
    return throwError(() => error);
  }
}