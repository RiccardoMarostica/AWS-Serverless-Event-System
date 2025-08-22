import { environment } from '../../environments/environment';

export class PerformanceOptimizationUtil {
  
  /**
   * Optimize images by adding loading="lazy" and proper sizing
   */
  static optimizeImages(): void {
    if (typeof document !== 'undefined') {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
        if (!img.hasAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
      });
    }
  }

  /**
   * Preload critical resources
   */
  static preloadCriticalResources(): void {
    if (typeof document !== 'undefined') {
      const criticalResources = [
        { href: '/assets/fonts/main.woff2', as: 'font', type: 'font/woff2' },
        { href: environment.apiUrl, as: 'fetch' }
      ];

      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;
        if (resource.type) {
          link.type = resource.type;
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      });
    }
  }

  /**
   * Optimize third-party scripts loading
   */
  static optimizeThirdPartyScripts(): void {
    if (typeof document !== 'undefined') {
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        if (!script.hasAttribute('async') && !script.hasAttribute('defer')) {
          // Add defer to non-critical scripts
          script.setAttribute('defer', '');
        }
      });
    }
  }

  /**
   * Implement resource hints for better performance
   */
  static addResourceHints(): void {
    if (typeof document !== 'undefined') {
      const hints = [
        { rel: 'dns-prefetch', href: new URL(environment.apiUrl).origin },
        { rel: 'preconnect', href: new URL(environment.apiUrl).origin }
      ];

      hints.forEach(hint => {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        document.head.appendChild(link);
      });
    }
  }

  /**
   * Optimize CSS delivery
   */
  static optimizeCSSDelivery(): void {
    if (typeof document !== 'undefined') {
      // Add critical CSS inline and load non-critical CSS asynchronously
      const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
      nonCriticalCSS.forEach(link => {
        const linkElement = link as HTMLLinkElement;
        linkElement.media = 'print';
        linkElement.onload = () => {
          linkElement.media = 'all';
        };
      });
    }
  }

  /**
   * Implement service worker for caching (if available)
   */
  static registerServiceWorker(): void {
    if ('serviceWorker' in navigator && environment.production) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  /**
   * Monitor and optimize bundle size
   */
  static monitorBundleSize(): void {
    if (!environment.production && 'performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && resource.transferSize
      );
      
      const totalJSSize = jsResources.reduce((total, resource) => 
        total + (resource.transferSize || 0), 0
      );
      
      console.group('Bundle Size Analysis');
      console.log(`Total JS Size: ${(totalJSSize / 1024).toFixed(2)} KB`);
      jsResources.forEach(resource => {
        console.log(`${resource.name}: ${((resource.transferSize || 0) / 1024).toFixed(2)} KB`);
      });
      console.groupEnd();
    }
  }

  /**
   * Optimize form performance
   */
  static optimizeFormPerformance(): void {
    if (typeof document !== 'undefined') {
      // Debounce form inputs to reduce validation calls
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        let timeout: any;
        input.addEventListener('input', () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            // Trigger validation after user stops typing
            input.dispatchEvent(new Event('validate'));
          }, 300);
        });
      });
    }
  }

  /**
   * Initialize all performance optimizations
   */
  static initializeOptimizations(): void {
    if (typeof window !== 'undefined') {
      // Run optimizations after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.runOptimizations();
        });
      } else {
        this.runOptimizations();
      }
    }
  }

  private static runOptimizations(): void {
    this.preloadCriticalResources();
    this.addResourceHints();
    this.optimizeImages();
    this.optimizeThirdPartyScripts();
    this.optimizeCSSDelivery();
    this.optimizeFormPerformance();
    this.registerServiceWorker();
    
    // Monitor bundle size in development
    if (!environment.production) {
      setTimeout(() => {
        this.monitorBundleSize();
      }, 2000);
    }
  }
}