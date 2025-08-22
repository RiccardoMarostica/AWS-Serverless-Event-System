import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, timer } from 'rxjs';
import { map, startWith, switchMap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface ConnectivityStatus {
  isOnline: boolean;
  connectionType: string;
  lastChecked: Date;
  latency?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private connectivitySubject = new BehaviorSubject<ConnectivityStatus>({
    isOnline: navigator.onLine,
    connectionType: this.getConnectionType(),
    lastChecked: new Date()
  });

  public readonly connectivity$ = this.connectivitySubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeConnectivityMonitoring();
  }

  private initializeConnectivityMonitoring(): void {
    // Monitor browser online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    merge(online$, offline$)
      .pipe(startWith(navigator.onLine))
      .subscribe(isOnline => {
        this.updateConnectivityStatus(isOnline);
      });

    // Periodic connectivity check every 30 seconds when online
    timer(0, 30000)
      .pipe(
        switchMap(() => this.performConnectivityCheck()),
        catchError(() => {
          // If connectivity check fails, assume offline
          this.updateConnectivityStatus(false);
          return [];
        })
      )
      .subscribe();
  }

  private performConnectivityCheck(): Observable<boolean> {
    const startTime = Date.now();
    
    // Try to fetch a small resource to test connectivity
    // Using a HEAD request to minimize data usage
    return this.http.head('/favicon.ico', { 
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => {
        const latency = Date.now() - startTime;
        this.updateConnectivityStatus(true, latency);
        return true;
      }),
      catchError(() => {
        this.updateConnectivityStatus(false);
        return [false];
      })
    );
  }

  private updateConnectivityStatus(isOnline: boolean, latency?: number): void {
    const status: ConnectivityStatus = {
      isOnline,
      connectionType: this.getConnectionType(),
      lastChecked: new Date(),
      latency
    };

    this.connectivitySubject.next(status);
  }

  private getConnectionType(): string {
    // Check if the browser supports the Network Information API
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }

    return 'unknown';
  }

  getCurrentStatus(): ConnectivityStatus {
    return this.connectivitySubject.value;
  }

  isOnline(): boolean {
    return this.connectivitySubject.value.isOnline;
  }

  getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    const status = this.getCurrentStatus();
    
    if (!status.isOnline) {
      return 'offline';
    }

    if (!status.latency) {
      return 'good'; // Default when latency is unknown
    }

    if (status.latency < 100) {
      return 'excellent';
    } else if (status.latency < 500) {
      return 'good';
    } else {
      return 'poor';
    }
  }

  getConnectionMessage(): string {
    const status = this.getCurrentStatus();
    const quality = this.getConnectionQuality();

    if (!status.isOnline) {
      return 'You are currently offline. Please check your internet connection.';
    }

    switch (quality) {
      case 'excellent':
        return 'Excellent connection quality.';
      case 'good':
        return 'Good connection quality.';
      case 'poor':
        return 'Poor connection quality. Some features may be slower.';
      default:
        return 'Connected to the internet.';
    }
  }
}