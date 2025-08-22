import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  bundleSize: number;
  memoryUsage: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metricsSubject = new BehaviorSubject<Partial<PerformanceMetrics>>({});
  public metrics$ = this.metricsSubject.asObservable();

  constructor() {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor page load performance
      window.addEventListener('load', () => {
        this.measureLoadPerformance();
      });

      // Monitor Core Web Vitals
      this.observeWebVitals();
    }
  }

  private measureLoadPerformance(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    
    this.updateMetrics({ loadTime });
  }

  private observeWebVitals(): void {
    // First Contentful Paint
    this.observePerformanceEntry('paint', (entries) => {
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.updateMetrics({ firstContentfulPaint: fcp.startTime });
      }
    });

    // Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1];
      if (lcp) {
        this.updateMetrics({ largestContentfulPaint: lcp.startTime });
      }
    });

    // Cumulative Layout Shift
    this.observePerformanceEntry('layout-shift', (entries) => {
      let cls = 0;
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      });
      this.updateMetrics({ cumulativeLayoutShift: cls });
    });

    // First Input Delay
    this.observePerformanceEntry('first-input', (entries) => {
      const fid = entries[0] as any;
      if (fid && fid.processingStart) {
        this.updateMetrics({ firstInputDelay: fid.processingStart - fid.startTime });
      }
    });
  }

  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          callback(list.getEntries());
        });
        observer.observe({ type, buffered: true });
      } catch (e) {
        // PerformanceObserver not supported for this type
        console.warn(`PerformanceObserver not supported for type: ${type}`);
      }
    }
  }

  private updateMetrics(newMetrics: Partial<PerformanceMetrics>): void {
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({ ...currentMetrics, ...newMetrics });
  }

  public measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.updateMetrics({
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
      });
    }
  }

  public logPerformanceMetrics(): void {
    const metrics = this.metricsSubject.value;
    console.group('Performance Metrics');
    console.log('Load Time:', metrics.loadTime ? `${metrics.loadTime.toFixed(2)}ms` : 'N/A');
    console.log('First Contentful Paint:', metrics.firstContentfulPaint ? `${metrics.firstContentfulPaint.toFixed(2)}ms` : 'N/A');
    console.log('Largest Contentful Paint:', metrics.largestContentfulPaint ? `${metrics.largestContentfulPaint.toFixed(2)}ms` : 'N/A');
    console.log('Cumulative Layout Shift:', metrics.cumulativeLayoutShift ? metrics.cumulativeLayoutShift.toFixed(4) : 'N/A');
    console.log('First Input Delay:', metrics.firstInputDelay ? `${metrics.firstInputDelay.toFixed(2)}ms` : 'N/A');
    console.log('Memory Usage:', metrics.memoryUsage ? `${metrics.memoryUsage.toFixed(2)}MB` : 'N/A');
    console.groupEnd();
  }

  public getPerformanceReport(): Observable<Partial<PerformanceMetrics>> {
    return this.metrics$;
  }
}