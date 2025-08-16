import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only add API key to requests going to our API
    if (req.url.startsWith(environment.apiUrl)) {
      const apiReq = req.clone({
        setHeaders: {
          'x-api-key': environment.apiKey
        }
      });
      return next.handle(apiReq);
    }
    
    return next.handle(req);
  }
}