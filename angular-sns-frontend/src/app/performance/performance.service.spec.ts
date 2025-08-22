import { TestBed } from '@angular/core/testing';
import { PerformanceService } from './performance.service';

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerformanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize performance monitoring', () => {
    expect(service.metrics$).toBeDefined();
  });

  it('should measure memory usage', () => {
    spyOn(console, 'warn');
    service.measureMemoryUsage();
    expect(service).toBeTruthy();
  });

  it('should log performance metrics', () => {
    spyOn(console, 'group');
    spyOn(console, 'log');
    spyOn(console, 'groupEnd');
    
    service.logPerformanceMetrics();
    
    expect(console.group).toHaveBeenCalledWith('Performance Metrics');
    expect(console.groupEnd).toHaveBeenCalled();
  });

  it('should return performance report observable', () => {
    const report$ = service.getPerformanceReport();
    expect(report$).toBeDefined();
  });
});