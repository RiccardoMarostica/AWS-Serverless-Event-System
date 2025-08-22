import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerformanceService, PerformanceMetrics } from '../performance/performance.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="performance-dashboard">
      <h2>Performance Dashboard</h2>
      <div class="metrics-grid">
        <div class="metric-card" *ngFor="let metric of metricsArray">
          <h3>{{ metric.label }}</h3>
          <div class="metric-value" [class]="getMetricClass(metric.key, metric.value)">
            {{ metric.value }}
          </div>
          <div class="metric-status">{{ getMetricStatus(metric.key, metric.value) }}</div>
        </div>
      </div>
      <div class="actions">
        <button (click)="refreshMetrics()" class="refresh-btn">Refresh Metrics</button>
        <button (click)="logMetrics()" class="log-btn">Log to Console</button>
      </div>
    </div>
  `,
  styles: [`
    .performance-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }

    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }

    .metric-card h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }

    .metric-value.good { color: #4CAF50; }
    .metric-value.warning { color: #FF9800; }
    .metric-value.poor { color: #F44336; }

    .metric-status {
      font-size: 12px;
      color: #666;
    }

    .actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 30px;
    }

    .refresh-btn, .log-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .refresh-btn {
      background: #2196F3;
      color: white;
    }

    .log-btn {
      background: #4CAF50;
      color: white;
    }

    .refresh-btn:hover, .log-btn:hover {
      opacity: 0.9;
    }
  `]
})
export class PerformanceDashboardComponent implements OnInit, OnDestroy {
  metrics: Partial<PerformanceMetrics> = {};
  metricsArray: Array<{key: string, label: string, value: string}> = [];
  private subscription?: Subscription;

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    this.subscription = this.performanceService.getPerformanceReport().subscribe(
      metrics => {
        this.metrics = metrics;
        this.updateMetricsArray();
      }
    );
    this.refreshMetrics();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateMetricsArray(): void {
    this.metricsArray = [
      {
        key: 'loadTime',
        label: 'Load Time',
        value: this.metrics.loadTime ? `${this.metrics.loadTime.toFixed(0)}ms` : 'N/A'
      },
      {
        key: 'firstContentfulPaint',
        label: 'First Contentful Paint',
        value: this.metrics.firstContentfulPaint ? `${this.metrics.firstContentfulPaint.toFixed(0)}ms` : 'N/A'
      },
      {
        key: 'largestContentfulPaint',
        label: 'Largest Contentful Paint',
        value: this.metrics.largestContentfulPaint ? `${this.metrics.largestContentfulPaint.toFixed(0)}ms` : 'N/A'
      },
      {
        key: 'cumulativeLayoutShift',
        label: 'Cumulative Layout Shift',
        value: this.metrics.cumulativeLayoutShift ? this.metrics.cumulativeLayoutShift.toFixed(4) : 'N/A'
      },
      {
        key: 'firstInputDelay',
        label: 'First Input Delay',
        value: this.metrics.firstInputDelay ? `${this.metrics.firstInputDelay.toFixed(0)}ms` : 'N/A'
      },
      {
        key: 'memoryUsage',
        label: 'Memory Usage',
        value: this.metrics.memoryUsage ? `${this.metrics.memoryUsage.toFixed(1)}MB` : 'N/A'
      }
    ];
  }

  getMetricClass(key: string, value: string): string {
    if (value === 'N/A') return '';

    const numValue = parseFloat(value);
    
    switch (key) {
      case 'loadTime':
      case 'firstContentfulPaint':
        return numValue < 1000 ? 'good' : numValue < 2500 ? 'warning' : 'poor';
      case 'largestContentfulPaint':
        return numValue < 2500 ? 'good' : numValue < 4000 ? 'warning' : 'poor';
      case 'cumulativeLayoutShift':
        return numValue < 0.1 ? 'good' : numValue < 0.25 ? 'warning' : 'poor';
      case 'firstInputDelay':
        return numValue < 100 ? 'good' : numValue < 300 ? 'warning' : 'poor';
      case 'memoryUsage':
        return numValue < 50 ? 'good' : numValue < 100 ? 'warning' : 'poor';
      default:
        return '';
    }
  }

  getMetricStatus(key: string, value: string): string {
    const className = this.getMetricClass(key, value);
    switch (className) {
      case 'good': return 'Good';
      case 'warning': return 'Needs Improvement';
      case 'poor': return 'Poor';
      default: return 'No Data';
    }
  }

  refreshMetrics(): void {
    this.performanceService.measureMemoryUsage();
  }

  logMetrics(): void {
    this.performanceService.logPerformanceMetrics();
  }
}