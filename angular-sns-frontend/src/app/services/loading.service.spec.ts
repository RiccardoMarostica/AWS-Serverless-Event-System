import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with loading state as false', () => {
    expect(service.isLoading()).toBeFalsy();
  });

  it('should set loading state to true', () => {
    service.setLoading(true);
    expect(service.isLoading()).toBeTruthy();
  });

  it('should set loading state to false', () => {
    service.setLoading(true);
    service.setLoading(false);
    expect(service.isLoading()).toBeFalsy();
  });

  it('should handle multiple concurrent loading operations', () => {
    service.setLoading(true);
    service.setLoading(true);
    expect(service.isLoading()).toBeTruthy();

    service.setLoading(false);
    expect(service.isLoading()).toBeTruthy(); // Still loading due to second operation

    service.setLoading(false);
    expect(service.isLoading()).toBeFalsy(); // Now all operations are complete
  });

  it('should emit loading state changes', (done) => {
    let emissionCount = 0;
    const expectedStates = [false, true, false];

    service.isLoading$.subscribe(isLoading => {
      expect(isLoading).toBe(expectedStates[emissionCount]);
      emissionCount++;
      
      if (emissionCount === expectedStates.length) {
        done();
      }
    });

    service.setLoading(true);
    service.setLoading(false);
  });

  it('should reset loading state', () => {
    service.setLoading(true);
    service.setLoading(true);
    service.resetLoading();
    expect(service.isLoading()).toBeFalsy();
  });

  it('should provide showLoading helper that returns hide function', () => {
    const hideLoading = service.showLoading();
    expect(service.isLoading()).toBeTruthy();
    
    hideLoading();
    expect(service.isLoading()).toBeFalsy();
  });

  it('should emit loading count changes', (done) => {
    let emissionCount = 0;
    const expectedCounts = [0, 1, 2, 1, 0];

    service.loadingCount$.subscribe(count => {
      expect(count).toBe(expectedCounts[emissionCount]);
      emissionCount++;
      
      if (emissionCount === expectedCounts.length) {
        done();
      }
    });

    service.setLoading(true);
    service.setLoading(true);
    service.setLoading(false);
    service.setLoading(false);
  });

  it('should not allow negative loading count', () => {
    service.setLoading(false); // Should not go below 0
    expect(service.isLoading()).toBeFalsy();
    
    service.loadingCount$.subscribe(count => {
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});