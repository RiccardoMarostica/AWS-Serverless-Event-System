describe('Performance Testing', () => {
  beforeEach(() => {
    // Clear cache and cookies for consistent testing
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should load the application within performance budget', () => {
    const startTime = Date.now();
    
    cy.visit('/');
    
    // Wait for the subscription form to be visible
    cy.get('[data-cy="subscription-form"]', { timeout: 10000 }).should('be.visible');
    
    const loadTime = Date.now() - startTime;
    
    // Assert load time is under 3 seconds (requirement 1.3)
    expect(loadTime).to.be.lessThan(3000);
    
    cy.log(`Application loaded in ${loadTime}ms`);
  });

  it('should have good Core Web Vitals', () => {
    cy.visit('/');
    
    // Wait for page to fully load
    cy.get('[data-cy="subscription-form"]').should('be.visible');
    
    // Check performance metrics
    cy.window().then((win) => {
      // First Contentful Paint should be under 1.8s
      cy.wrap(win.performance.getEntriesByType('paint')).then((paintEntries: any[]) => {
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          expect(fcp.startTime).to.be.lessThan(1800);
          cy.log(`First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`);
        }
      });
      
      // Check for layout shifts
      if ('PerformanceObserver' in win) {
        let cls = 0;
        const observer = new win.PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        });
        
        try {
          observer.observe({ type: 'layout-shift', buffered: true });
          
          // CLS should be under 0.1
          cy.wait(2000).then(() => {
            expect(cls).to.be.lessThan(0.1);
            cy.log(`Cumulative Layout Shift: ${cls.toFixed(4)}`);
          });
        } catch (e) {
          cy.log('Layout shift measurement not supported');
        }
      }
    });
  });

  it('should be responsive on different screen sizes', () => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/');
      
      // Check that form is visible and usable
      cy.get('[data-cy="subscription-form"]').should('be.visible');
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="submit-button"]').should('be.visible');
      
      // Check that form elements are properly sized
      cy.get('[data-cy="email-input"]').then($input => {
        const inputWidth = $input.width();
        expect(inputWidth).to.be.greaterThan(200); // Minimum usable width
      });
      
      cy.log(`${viewport.name} (${viewport.width}x${viewport.height}) - Layout OK`);
    });
  });

  it('should handle form interactions with good responsiveness', () => {
    cy.visit('/');
    
    // Measure form interaction responsiveness
    const interactions = [
      { action: 'type', selector: '[data-cy="email-input"]', value: 'test@example.com' },
      { action: 'clear', selector: '[data-cy="email-input"]' },
      { action: 'type', selector: '[data-cy="email-input"]', value: 'invalid-email' }
    ];

    interactions.forEach((interaction, index) => {
      const startTime = Date.now();
      
      if (interaction.action === 'type') {
        cy.get(interaction.selector).type(interaction.value!);
      } else if (interaction.action === 'clear') {
        cy.get(interaction.selector).clear();
      }
      
      // Wait for any validation to complete
      cy.wait(100);
      
      const responseTime = Date.now() - startTime;
      
      // Form interactions should respond within 100ms
      expect(responseTime).to.be.lessThan(100);
      
      cy.log(`Interaction ${index + 1} response time: ${responseTime}ms`);
    });
  });

  it('should load resources efficiently', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      // Check resource loading performance
      const resources = win.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Check that critical resources load quickly
      const criticalResources = resources.filter(resource => 
        resource.name.includes('main.js') || 
        resource.name.includes('styles.css') ||
        resource.name.includes('polyfills.js')
      );
      
      criticalResources.forEach(resource => {
        const loadTime = resource.responseEnd - resource.fetchStart;
        expect(loadTime).to.be.lessThan(2000); // Critical resources under 2s
        cy.log(`${resource.name}: ${loadTime.toFixed(2)}ms`);
      });
      
      // Check total number of requests (should be reasonable)
      expect(resources.length).to.be.lessThan(20);
      cy.log(`Total resources loaded: ${resources.length}`);
    });
  });

  it('should handle network conditions gracefully', () => {
    // Simulate slow network
    cy.intercept('POST', '**/subscribe', (req) => {
      req.reply((res) => {
        res.delay(2000); // 2 second delay
        res.send({ message: 'Subscription successful' });
      });
    });

    cy.visit('/');
    
    // Fill and submit form
    cy.get('[data-cy="email-input"]').type('test@example.com');
    
    const submitStartTime = Date.now();
    cy.get('[data-cy="submit-button"]').click();
    
    // Loading indicator should appear immediately
    cy.get('[data-cy="loading-indicator"]').should('be.visible');
    
    // Check that loading state is responsive
    cy.get('[data-cy="submit-button"]').should('be.disabled');
    
    // Wait for response
    cy.get('[data-cy="success-message"]', { timeout: 5000 }).should('be.visible');
    
    const totalTime = Date.now() - submitStartTime;
    cy.log(`Form submission with slow network: ${totalTime}ms`);
  });

  it('should maintain performance with multiple form submissions', () => {
    cy.visit('/');
    
    // Perform multiple form submissions to test for memory leaks
    for (let i = 0; i < 5; i++) {
      cy.get('[data-cy="email-input"]').clear().type(`test${i}@example.com`);
      cy.get('[data-cy="submit-button"]').click();
      
      // Wait for response (success or error)
      cy.get('[data-cy="success-message"], [data-cy="error-message"]', { timeout: 5000 })
        .should('be.visible');
      
      // Reset form for next iteration
      cy.reload();
    }
    
    // Check memory usage if available
    cy.window().then((win) => {
      if ('memory' in win.performance) {
        const memory = (win.performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        // Memory usage should be reasonable (under 100MB)
        expect(memoryUsage).to.be.lessThan(100);
        cy.log(`Memory usage after multiple submissions: ${memoryUsage.toFixed(2)}MB`);
      }
    });
  });

  it('should have optimized bundle sizes', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      const resources = win.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(resource => resource.name.includes('.js'));
      
      let totalJSSize = 0;
      jsResources.forEach(resource => {
        if (resource.transferSize) {
          totalJSSize += resource.transferSize;
        }
      });
      
      // Total JS bundle should be under 500KB (compressed)
      expect(totalJSSize).to.be.lessThan(500 * 1024);
      cy.log(`Total JS bundle size: ${(totalJSSize / 1024).toFixed(2)}KB`);
      
      // Individual chunks should be reasonably sized
      jsResources.forEach(resource => {
        if (resource.transferSize) {
          expect(resource.transferSize).to.be.lessThan(200 * 1024); // 200KB max per chunk
        }
      });
    });
  });
});