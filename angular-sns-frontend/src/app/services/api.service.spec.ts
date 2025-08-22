import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiService } from './api.service';
import { SubscriptionResponse } from '../models/subscription.model';
import { Event } from '../models/event.model';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('subscribe', () => {
    it('should send subscription request with correct data', () => {
      const email = 'test@example.com';
      const mockResponse: SubscriptionResponse = {
        message: 'Subscription requested. Please check your email to confirm.'
      };

      service.subscribe(email).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subscribe`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email });
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      
      req.flush(mockResponse);
    });

    it('should handle 400 error with specific message correctly', () => {
      const email = 'invalid-email';
      const errorResponse = { error: 'Invalid email format' };

      service.subscribe(email).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(400);
          expect(error.error.error).toBe('Invalid email format');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subscribe`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 400 error with generic message correctly', () => {
      const email = 'invalid-email';

      service.subscribe(email).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subscribe`);
      req.flush({}, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle network error correctly', () => {
      const email = 'test@example.com';

      service.subscribe(email).subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subscribe`);
      req.error(new ErrorEvent('Network error', {
        message: 'Connection failed'
      }));
    });

    it('should handle 500 server error correctly', () => {
      const email = 'test@example.com';

      service.subscribe(email).subscribe({
        next: () => fail('should have failed with server error'),
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subscribe`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getEvents', () => {
    it('should fetch events successfully', () => {
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Test Event',
          description: 'Test Description',
          date: '2024-01-01',
          location: 'Test Location'
        }
      ];

      service.getEvents().subscribe(events => {
        expect(events).toEqual(mockEvents);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/event`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      
      req.flush(mockEvents);
    });

    it('should handle events fetch error', () => {
      service.getEvents().subscribe({
        next: () => fail('should have failed with error'),
        error: (error) => {
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/event`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });
  });
});