import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ApiKeyInterceptor } from './api-key.interceptor';
import { environment } from '../../environments/environment';

describe('ApiKeyInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ApiKeyInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add API key header to requests to API URL', () => {
    const testUrl = `${environment.apiUrl}/test`;
    
    httpClient.get(testUrl).subscribe();

    const req = httpMock.expectOne(testUrl);
    expect(req.request.headers.get('x-api-key')).toBe(environment.apiKey);
    
    req.flush({});
  });

  it('should not add API key header to external requests', () => {
    const externalUrl = 'https://external-api.com/test';
    
    httpClient.get(externalUrl).subscribe();

    const req = httpMock.expectOne(externalUrl);
    expect(req.request.headers.get('x-api-key')).toBeNull();
    
    req.flush({});
  });

  it('should preserve existing headers when adding API key', () => {
    const testUrl = `${environment.apiUrl}/test`;
    const customHeaders = { 'Custom-Header': 'custom-value' };
    
    httpClient.get(testUrl, { headers: customHeaders }).subscribe();

    const req = httpMock.expectOne(testUrl);
    expect(req.request.headers.get('x-api-key')).toBe(environment.apiKey);
    expect(req.request.headers.get('Custom-Header')).toBe('custom-value');
    
    req.flush({});
  });
});