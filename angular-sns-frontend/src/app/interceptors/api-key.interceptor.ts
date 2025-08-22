import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { SecurityService } from '../services/security.service';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  
  constructor(private securityService: SecurityService) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only add API key to requests going to our API
    if (req.url.startsWith(environment.apiUrl)) {
      // Validate API key before adding it to requests
      if (!this.securityService.validateApiKey()) {
        console.error('Invalid API key detected, blocking request');
        return throwError(() => new Error('Invalid API key configuration'));
      }
      
      // Validate secure environment for API requests
      if (environment.production && !this.securityService.validateSecureContext()) {
        console.error('Insecure context detected in production, blocking request');
        return throwError(() => new Error('Insecure context - HTTPS required'));
      }
      
      const apiReq = req.clone({
        setHeaders: {
          'x-api-key': environment.apiKey,
          // Add additional security headers
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      return next.handle(apiReq);
    }
    
    return next.handle(req);
  }
}