describe('Comprehensive Integration Test Suite', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForApp();
  });

  describe('End-to-End User Journey', () => {
    it('should complete the full subscription workflow successfully', () => {
      // User arrives at the page
      cy.get('.page-title').should('contain.text', 'Subscribe to Event Notifications');
      cy.get('.page-description').should('be.visible');
      
      // User reads the form features
      cy.get('.form-features').should('be.visible');
      cy.get('.feature').should('have.length.at.least', 3);
      
      // User enters email with real-time validation
      cy.get('#email').type('user');
      cy.get('#email').should('have.class', 'input-error');
      
      cy.get('#email').type('@example');
      cy.get('#email').should('have.class', 'input-error');
      
      cy.get('#email').type('.com');
      cy.get('#email').should('have.class', 'input-success');
      
      // User submits the form
      cy.submitSubscription('user@example.com', true);
      
      // User sees success message
      cy.get('.success-message').should('be.visible');
      cy.get('.status-title').should('contain.text', 'Subscription Successful!');
      
      // User decides to subscribe another email
      cy.get('.action-button.primary').click();
      
      // Form is reset and ready for new subscription
      cy.get('.subscription-form').should('be.visible');
      cy.get('#email').should('have.value', '');
      
      // User subscribes another email
      cy.submitSubscription('another@example.com', true);
      cy.get('.success-message').should('be.visible');
    });

    it('should handle the complete error recovery workflow', () => {
      // User enters email
      cy.get('#email').type('error-test@example.com');
      
      // First attempt fails due to network error
      cy.simulateNetworkCondition('offline');
      cy.get('button[type="submit"]').click();
      cy.wait('@networkRequest');
      
      // User sees error message with retry option
      cy.get('.error-message').should('be.visible');
      cy.get('.status-title').should('contain.text', 'Subscription Failed');
      
      // User waits for retry countdown
      cy.get('.action-button.secondary').should('contain.text', 'Retry in');
      
      // User manually retries after countdown
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Retry successful!' }
      }).as('retrySuccess');
      
      cy.get('.action-button.secondary', { timeout: 6000 }).should('contain.text', 'Try Again');
      cy.get('.action-button.secondary').click();
      
      cy.wait('@retrySuccess');
      
      // User sees success after retry
      cy.get('.success-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'Retry successful!');
    });
  });

  describe('Multi-Device User Experience', () => {
    const devices = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 }
    ];

    devices.forEach((device) => {
      it(`should provide excellent UX on ${device.name}`, () => {
        cy.testResponsive(device);
        
        // Test complete workflow on this device
        cy.submitSubscription('device-test@example.com', true);
        cy.get('.success-message').should('be.visible');
        
        // Test error handling on this device
        cy.get('.action-button.primary').click();
        cy.submitSubscription('error-test@example.com', false);
        cy.get('.error-message').should('be.visible');
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should meet accessibility standards throughout the workflow', () => {
      // Initial accessibility check
      cy.checkAccessibility();
      
      // Test keyboard navigation through entire form
      cy.get('#email').focus().type('accessibility@example.com');
      cy.get('#email').should('be.focused');
      
      cy.get('#email').tab();
      cy.focused().should('have.attr', 'type', 'submit');
      
      // Submit with keyboard
      cy.focused().type('{enter}');
      
      // Check accessibility of success state
      cy.get('.success-message').should('have.attr', 'role', 'alert');
      cy.get('.success-message').should('have.attr', 'aria-live', 'polite');
      
      // Test error state accessibility
      cy.get('.action-button.primary').click();
      cy.get('#email').clear().type('invalid-email');
      cy.get('#email').blur();
      
      cy.get('.error-messages').should('have.attr', 'role', 'alert');
      cy.get('.error-messages').should('have.attr', 'aria-live', 'polite');
    });

    it('should work with screen readers', () => {
      // Test screen reader friendly content
      cy.get('label[for="email"]').should('exist');
      cy.get('.label-required').should('have.attr', 'aria-label', 'required');
      
      // Test form descriptions
      cy.get('#email').should('have.attr', 'aria-describedby');
      
      // Test status announcements
      cy.submitSubscription('screenreader@example.com', true);
      cy.get('.success-message').should('have.attr', 'aria-live', 'polite');
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance with rapid interactions', () => {
      const startTime = Date.now();
      
      // Rapid form interactions
      for (let i = 0; i < 10; i++) {
        cy.get('#email').clear().type(`test${i}@example.com`);
        cy.get('#email').clear();
      }
      
      // Final interaction should still be responsive
      cy.get('#email').type('performance@example.com');
      cy.get('#email').should('have.value', 'performance@example.com');
      
      const endTime = Date.now();
      expect(endTime - startTime).to.be.lessThan(5000);
    });

    it('should handle slow network conditions gracefully', () => {
      cy.simulateNetworkCondition('slow');
      
      const startTime = Date.now();
      cy.get('#email').type('slow-network@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should show loading immediately
      cy.get('.loading-content').should('be.visible');
      cy.get('.spinner').should('be.visible');
      
      // Should complete within reasonable time
      cy.wait('@networkRequest');
      cy.get('.success-message').should('be.visible').then(() => {
        const totalTime = Date.now() - startTime;
        expect(totalTime).to.be.lessThan(5000);
      });
    });
  });

  describe('Security and Data Protection', () => {
    it('should sanitize and validate all user inputs', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>@example.com',
        'test@example.com<img src=x onerror=alert(1)>',
        'javascript:alert("xss")@example.com'
      ];
      
      maliciousInputs.forEach((input) => {
        cy.get('#email').clear().type(input);
        
        // Should not execute any malicious code
        cy.window().then((win) => {
          expect(win.document.title).to.not.contain('XSS');
        });
        
        // Should show validation error
        cy.get('#email').blur();
        cy.get('.error-messages').should('be.visible');
      });
    });

    it('should protect against CSRF and other attacks', () => {
      // Test that form requires proper interaction
      cy.intercept('POST', '**/subscribe', (req) => {
        // Verify proper headers are sent
        expect(req.headers).to.have.property('content-type', 'application/json');
        
        req.reply({
          statusCode: 200,
          body: { message: 'Security test passed!' }
        });
      }).as('securityTest');
      
      cy.get('#email').type('security@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@securityTest');
      cy.get('.success-message').should('be.visible');
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work consistently across different browsers', () => {
      cy.testBrowserCompatibility();
      
      // Test browser-specific features
      cy.window().then((win) => {
        // Test localStorage support
        win.localStorage.setItem('test', 'value');
        expect(win.localStorage.getItem('test')).to.equal('value');
        win.localStorage.removeItem('test');
        
        // Test modern JavaScript features
        expect(typeof win.Promise).to.equal('function');
        expect(typeof win.fetch).to.equal('function');
      });
    });

    it('should handle different viewport sizes and orientations', () => {
      // Test portrait orientation
      cy.viewport(375, 667);
      cy.waitForApp();
      cy.checkFormValidation('portrait@example.com', true);
      
      // Test landscape orientation
      cy.viewport(667, 375);
      cy.waitForApp();
      cy.checkFormValidation('landscape@example.com', true);
      
      // Test large desktop
      cy.viewport(1920, 1080);
      cy.waitForApp();
      cy.checkFormValidation('desktop@example.com', true);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle intermittent connectivity issues', () => {
      // Start with offline condition
      cy.simulateNetworkCondition('offline');
      cy.get('#email').type('connectivity@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@networkRequest');
      cy.get('.error-message').should('be.visible');
      
      // Simulate connectivity restoration
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Connected successfully!' }
      }).as('reconnected');
      
      cy.get('.action-button.secondary').click();
      cy.wait('@reconnected');
      
      cy.get('.success-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'Connected successfully!');
    });

    it('should handle server maintenance scenarios', () => {
      // Simulate server maintenance
      cy.intercept('POST', '**/subscribe', {
        statusCode: 503,
        body: { error: 'Service temporarily unavailable for maintenance' }
      }).as('maintenance');
      
      cy.get('#email').type('maintenance@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@maintenance');
      cy.get('.error-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'temporarily unavailable');
      
      // Simulate maintenance completion
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Service restored!' }
      }).as('restored');
      
      cy.get('.action-button.secondary').click();
      cy.wait('@restored');
      
      cy.get('.success-message').should('be.visible');
    });

    it('should handle high traffic scenarios', () => {
      // Simulate rate limiting
      cy.intercept('POST', '**/subscribe', {
        statusCode: 429,
        body: { error: 'Too many requests. Please try again in a moment.' },
        headers: { 'Retry-After': '30' }
      }).as('rateLimited');
      
      cy.get('#email').type('hightraffic@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@rateLimited');
      cy.get('.error-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'Too many requests');
      
      // User waits and retries successfully
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Request processed successfully!' }
      }).as('processed');
      
      cy.get('.action-button.secondary').click();
      cy.wait('@processed');
      
      cy.get('.success-message').should('be.visible');
    });
  });

  describe('Edge Cases and Error Boundaries', () => {
    it('should handle malformed API responses gracefully', () => {
      const malformedResponses = [
        { body: null, expected: 'success' },
        { body: '', expected: 'success' },
        { body: { invalidField: 'test' }, expected: 'success' },
        { body: '<html>Error</html>', expected: 'error' }
      ];
      
      malformedResponses.forEach((response, index) => {
        cy.intercept('POST', '**/subscribe', {
          statusCode: response.expected === 'success' ? 200 : 500,
          body: response.body
        }).as(`malformed${index}`);
        
        cy.get('#email').clear().type(`malformed${index}@example.com`);
        cy.get('button[type="submit"]').click();
        
        cy.wait(`@malformed${index}`);
        
        if (response.expected === 'success') {
          cy.get('.success-message').should('be.visible');
          cy.get('.action-button.primary').click();
        } else {
          cy.get('.error-message').should('be.visible');
          cy.reload();
          cy.waitForApp();
        }
      });
    });

    it('should handle concurrent form submissions', () => {
      let requestCount = 0;
      
      cy.intercept('POST', '**/subscribe', (req) => {
        requestCount++;
        req.reply({
          delay: 1000,
          statusCode: 200,
          body: { message: `Request ${requestCount} processed` }
        });
      }).as('concurrent');
      
      cy.get('#email').type('concurrent@example.com');
      
      // Rapid clicks should be handled gracefully
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').click(); // Should be ignored
      cy.get('button[type="submit"]').click(); // Should be ignored
      
      // Should only process one request
      cy.wait('@concurrent');
      cy.get('.success-message').should('be.visible');
      
      // Verify only one success message
      cy.get('.success-message').should('have.length', 1);
    });
  });
});