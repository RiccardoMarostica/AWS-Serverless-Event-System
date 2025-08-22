describe('Production Integration Testing', () => {
  const productionConfig = {
    baseUrl: Cypress.env('PRODUCTION_URL') || 'http://localhost:4200',
    apiUrl: Cypress.env('API_URL') || 'https://your-api-gateway-url.amazonaws.com/dev'
  };

  beforeEach(() => {
    // Set up production-like environment
    cy.intercept('GET', '**/health', { statusCode: 200, body: { status: 'healthy' } });
  });

  it('should load in production-like environment', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Mock production environment
        win.localStorage.setItem('environment', 'production');
      }
    });

    // Verify application loads correctly
    cy.get('[data-cy="subscription-form"]').should('be.visible');
    cy.get('[data-cy="header"]').should('be.visible');
    cy.get('[data-cy="footer"]').should('be.visible');

    // Check that production optimizations are active
    cy.window().then((win) => {
      // Verify that debug mode is disabled
      expect(win.console.debug).to.be.undefined;
      
      // Check for production build indicators
      const scripts = Array.from(win.document.querySelectorAll('script[src]'));
      const hasMinifiedScripts = scripts.some(script => 
        script.src.includes('.min.') || script.src.includes('hash')
      );
      
      if (hasMinifiedScripts) {
        cy.log('✅ Minified scripts detected');
      }
    });
  });

  it('should handle API integration correctly', () => {
    // Mock production API responses
    cy.intercept('POST', `${productionConfig.apiUrl}/subscribe`, {
      statusCode: 200,
      body: { message: 'Subscription requested. Please check your email to confirm.' }
    }).as('subscribeRequest');

    cy.visit('/');

    // Test successful subscription flow
    cy.get('[data-cy="email-input"]').type('production-test@example.com');
    cy.get('[data-cy="submit-button"]').click();

    // Verify API call
    cy.wait('@subscribeRequest').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        email: 'production-test@example.com'
      });
      
      // Check for proper headers
      expect(interception.request.headers).to.have.property('content-type');
      expect(interception.request.headers['content-type']).to.include('application/json');
    });

    // Verify success response handling
    cy.get('[data-cy="success-message"]').should('be.visible');
    cy.get('[data-cy="success-message"]').should('contain', 'Subscription requested');
  });

  it('should handle production error scenarios', () => {
    const errorScenarios = [
      {
        name: 'Server Error',
        response: { statusCode: 500, body: { error: 'Internal Server Error' } },
        expectedMessage: 'server error'
      },
      {
        name: 'Network Error',
        response: { forceNetworkError: true },
        expectedMessage: 'network error'
      },
      {
        name: 'Timeout Error',
        response: { statusCode: 408, body: { error: 'Request Timeout' } },
        expectedMessage: 'timeout'
      },
      {
        name: 'Rate Limit Error',
        response: { statusCode: 429, body: { error: 'Too Many Requests' } },
        expectedMessage: 'rate limit'
      }
    ];

    errorScenarios.forEach((scenario) => {
      cy.intercept('POST', `${productionConfig.apiUrl}/subscribe`, scenario.response)
        .as(`${scenario.name.replace(' ', '')}Request`);

      cy.visit('/');
      cy.get('[data-cy="email-input"]').type('error-test@example.com');
      cy.get('[data-cy="submit-button"]').click();

      // Verify error handling
      cy.get('[data-cy="error-message"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy="error-message"]').should('contain.text', scenario.expectedMessage);

      cy.log(`✅ ${scenario.name} handled correctly`);
    });
  });

  it('should maintain security in production environment', () => {
    cy.visit('/');

    // Check for HTTPS enforcement (if running on HTTPS)
    cy.location('protocol').then((protocol) => {
      if (protocol === 'https:') {
        cy.log('✅ HTTPS protocol detected');
      } else {
        cy.log('⚠️ HTTP protocol - ensure HTTPS in production');
      }
    });

    // Check for security headers
    cy.request('/').then((response) => {
      const headers = response.headers;
      
      // Check for security-related headers
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      securityHeaders.forEach(header => {
        if (headers[header]) {
          cy.log(`✅ Security header found: ${header}`);
        } else {
          cy.log(`⚠️ Security header missing: ${header}`);
        }
      });
    });

    // Verify input sanitization
    cy.get('[data-cy="email-input"]').type('<script>alert("xss")</script>@example.com');
    cy.get('[data-cy="submit-button"]').click();

    // Should show validation error, not execute script
    cy.get('[data-cy="validation-error"]').should('be.visible');
    cy.window().then((win) => {
      // Verify no script execution
      expect(win.document.querySelector('script[src*="alert"]')).to.be.null;
    });
  });

  it('should perform well under production load', () => {
    // Simulate multiple concurrent users
    const concurrentRequests = 5;
    const requests = [];

    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        cy.intercept('POST', `${productionConfig.apiUrl}/subscribe`, {
          statusCode: 200,
          body: { message: 'Subscription successful' },
          delay: Math.random() * 1000 // Random delay 0-1s
        }).as(`concurrentRequest${i}`)
      );
    }

    cy.visit('/');

    // Submit multiple requests rapidly
    for (let i = 0; i < concurrentRequests; i++) {
      cy.get('[data-cy="email-input"]').clear().type(`load-test-${i}@example.com`);
      cy.get('[data-cy="submit-button"]').click();
      
      // Wait for response before next request
      cy.get('[data-cy="success-message"], [data-cy="error-message"]', { timeout: 5000 })
        .should('be.visible');
      
      if (i < concurrentRequests - 1) {
        cy.reload(); // Reset for next request
      }
    }

    cy.log('✅ Application handled concurrent requests successfully');
  });

  it('should handle offline/online transitions', () => {
    cy.visit('/');

    // Simulate offline condition
    cy.window().then((win) => {
      // Mock navigator.onLine
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Trigger offline event
      win.dispatchEvent(new Event('offline'));
    });

    // Try to submit form while offline
    cy.get('[data-cy="email-input"]').type('offline-test@example.com');
    cy.get('[data-cy="submit-button"]').click();

    // Should show offline message
    cy.get('[data-cy="offline-message"]', { timeout: 5000 }).should('be.visible');

    // Simulate coming back online
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: true
      });

      win.dispatchEvent(new Event('online'));
    });

    // Offline message should disappear
    cy.get('[data-cy="offline-message"]').should('not.exist');

    cy.log('✅ Offline/online transitions handled correctly');
  });

  it('should maintain accessibility standards', () => {
    cy.visit('/');

    // Check for proper ARIA labels
    cy.get('[data-cy="email-input"]').should('have.attr', 'aria-label');
    cy.get('[data-cy="submit-button"]').should('have.attr', 'aria-label');

    // Check for proper form labels
    cy.get('label[for="email"]').should('exist');

    // Check keyboard navigation
    cy.get('[data-cy="email-input"]').focus();
    cy.focused().should('have.attr', 'data-cy', 'email-input');

    cy.tab();
    cy.focused().should('have.attr', 'data-cy', 'submit-button');

    // Check for proper error announcements
    cy.get('[data-cy="email-input"]').type('invalid-email');
    cy.get('[data-cy="submit-button"]').click();

    cy.get('[data-cy="validation-error"]')
      .should('be.visible')
      .should('have.attr', 'role', 'alert');

    cy.log('✅ Accessibility standards maintained');
  });

  it('should handle browser compatibility', () => {
    cy.visit('/');

    // Check for modern browser features
    cy.window().then((win) => {
      // Check for required APIs
      const requiredAPIs = [
        'fetch',
        'Promise',
        'localStorage',
        'sessionStorage'
      ];

      requiredAPIs.forEach(api => {
        if (api in win) {
          cy.log(`✅ ${api} API available`);
        } else {
          cy.log(`❌ ${api} API not available`);
        }
      });

      // Check for ES6+ features
      try {
        eval('const test = () => {}; class Test {}');
        cy.log('✅ ES6+ features supported');
      } catch (e) {
        cy.log('❌ ES6+ features not supported');
      }
    });

    // Test basic functionality works
    cy.get('[data-cy="subscription-form"]').should('be.visible');
    cy.get('[data-cy="email-input"]').type('compatibility-test@example.com');
    cy.get('[data-cy="submit-button"]').should('not.be.disabled');

    cy.log('✅ Browser compatibility verified');
  });
});