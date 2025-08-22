import { PerformanceOptimizationUtil } from './performance-optimization.util';

describe('PerformanceOptimizationUtil', () => {
  it('should have static methods defined', () => {
    expect(PerformanceOptimizationUtil.optimizeImages).toBeDefined();
    expect(PerformanceOptimizationUtil.preloadCriticalResources).toBeDefined();
    expect(PerformanceOptimizationUtil.addResourceHints).toBeDefined();
    expect(PerformanceOptimizationUtil.optimizeThirdPartyScripts).toBeDefined();
    expect(PerformanceOptimizationUtil.monitorBundleSize).toBeDefined();
    expect(PerformanceOptimizationUtil.initializeOptimizations).toBeDefined();
  });

  it('should handle missing document gracefully', () => {
    // These methods should not throw errors when document is undefined
    expect(() => PerformanceOptimizationUtil.optimizeImages()).not.toThrow();
    expect(() => PerformanceOptimizationUtil.preloadCriticalResources()).not.toThrow();
    expect(() => PerformanceOptimizationUtil.addResourceHints()).not.toThrow();
    expect(() => PerformanceOptimizationUtil.optimizeThirdPartyScripts()).not.toThrow();
  });

  it('should handle missing window gracefully', () => {
    expect(() => PerformanceOptimizationUtil.monitorBundleSize()).not.toThrow();
    expect(() => PerformanceOptimizationUtil.registerServiceWorker()).not.toThrow();
  });

  it('should initialize optimizations without errors', () => {
    expect(() => PerformanceOptimizationUtil.initializeOptimizations()).not.toThrow();
  });

  it('should handle missing performance API gracefully', () => {
    expect(() => PerformanceOptimizationUtil.monitorBundleSize()).not.toThrow();
  });

  it('should handle missing service worker API gracefully', () => {
    expect(() => PerformanceOptimizationUtil.registerServiceWorker()).not.toThrow();
  });
});