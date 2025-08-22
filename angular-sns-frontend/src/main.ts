import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { PerformanceOptimizationUtil } from './app/utils/performance-optimization.util';

// Initialize performance optimizations before app bootstrap
PerformanceOptimizationUtil.initializeOptimizations();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
