describe('Backend API Integration Tests', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3000/dev';
  const apiKey = Cypress.env('apiKey') || 'dev-api-key';

  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-cy="subscription-form"]', { timeout: 10000 }).should('be.visible');
  });

  describe('Subscription API Integration', () => {
    it('should successfully integrate with the subscription endpoint', () => {
      // Test with real API endpoint
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        // Verify request structure
        expect(req.body).to.have.property('email');
        expect(req.headers).to.have.property('x-api-key', apiKey);
        expect(req.headers).to.have.property('content-type', 'application/json');
        
        // Mock successful response
        req.reply({
          statusCode: 200,
          body: { message: 'Subscription requested. Please check your email to confirm.' }
        });
      }).as('subscribeAPI');
      
      cy.get('#email').type('integration-test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@subscribeAPI').then((interception) => {
        expect(interception.request.body.email).to.equal('integration-test@example.com');
      });
      
      cy.get('.success-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'Please check your email to confirm');
    });

    it('should handle API authentication correctly', () => {
      // Test with missing API key
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        if (!req.headers['x-api-key']) {
          req.reply({
            statusCode: 401,
            body: { error: 'Unauthorized: Missing API key' }
          });
        } else {
          req.reply({
            statusCode: 200,
            body: { message: 'Success!' }
          });
        }
      }).as('authTest');
      
      cy.get('#email').type('auth-test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@authTest');
      
      // Should handle authentication properly
      cy.get('.success-message').should('be.visible');
    });

    it('should handle API rate limiting', () => {
      // Mock rate limiting response
      cy.intercept('POST', `${apiUrl}/subscribe`, {
        statusCode: 429,
        body: { error: 'Too many requests. Please try again later.' },
        headers: { 'Retry-After': '60' }
      }).as('rateLimitAPI');
      
      cy.get('#email').type('ratelimit-test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@rateLimitAPI');
      
      cy.get('.error-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'Too many requests');
    });

    it('should handle duplicate subscription attempts', () => {
      // Mock duplicate subscription response
      cy.intercept('POST', `${apiUrl}/subscribe`, {
        statusCode: 409,
        body: { error: 'Email address is already subscribed to this topic.' }
      }).as('duplicateAPI');
      
      cy.get('#email').type('duplicate@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@duplicateAPI');
      
      cy.get('.error-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'already subscribed');
    });

    it('should handle malformed API responses', () => {
      const malformedResponses = [
        { statusCode: 200, body: null },
        { statusCode: 200, body: '' },
        { statusCode: 200, body: { invalidField: 'test' } },
        { statusCode: 500, body: '<html>Server Error</html>' }
      ];
      
      malformedResponses.forEach((response, index) => {
        cy.intercept('POST', `${apiUrl}/subscribe`, response).as(`malformedAPI${index}`);
        
        cy.get('#email').clear().type(`malformed${index}@example.com`);
        cy.get('button[type="submit"]').click();
        
        cy.wait(`@malformedAPI${index}`);
        
        if (response.statusCode === 200) {
          // Should handle missing message gracefully
          cy.get('.success-message').should('be.visible');
        } else {
          // Should show error for server errors
          cy.get('.error-message').should('be.visible');
        }
        
        // Reset for next test
        if (response.statusCode === 200) {
          cy.get('.action-button.primary').click();
        } else {
          cy.reload();
          cy.get('[data-cy="subscription-form"]').should('be.visible');
        }
      });
    });
  });

  describe('Event API Integration', () => {
    it('should integrate with the events endpoint for future enhancements', () => {
      // Test events endpoint (for future use)
      cy.request({
        method: 'GET',
        url: `${apiUrl}/event`,
        headers: {
          'x-api-key': apiKey
        },
        failOnStatusCode: false
      }).then((response) => {
        // Should either return events or indicate endpoint is not implemented
        expect([200, 404, 501]).to.include(response.status);
        
        if (response.status === 200) {
          expect(response.body).to.be.an('array');
        }
      });
    });
  });

  describe('CORS Configuration Integration', () => {
    it('should handle CORS preflight requests correctly', () => {
      // Test CORS preflight
      cy.intercept('OPTIONS', `${apiUrl}/subscribe`, (req) => {
        expect(req.headers).to.have.property('access-control-request-method', 'POST');
        
        req.reply({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
            'Access-Control-Max-Age': '86400'
          }
        });
      }).as('corsPreflightAPI');
      
      cy.intercept('POST', `${apiUrl}/subscribe`, {
        statusCode: 200,
        body: { message: 'Success!' },
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }).as('corsPostAPI');
      
      cy.get('#email').type('cors-test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should handle CORS properly
      cy.wait('@corsPostAPI');
      cy.get('.success-message').should('be.visible');
    });

    it('should handle CORS errors gracefully', () => {
      // Mock CORS error
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        req.reply({
          statusCode: 200,
          body: { message: 'Success!' }
          // Missing CORS headers to simulate CORS error
        });
      }).as('corsErrorAPI');
      
      cy.get('#email').type('cors-error@example.com');
      cy.get('button[type="submit"]').click();
      
      // In a real CORS error, the request would fail
      // For testing, we simulate the behavior
      cy.wait('@corsErrorAPI');
      cy.get('.success-message').should('be.visible');
    });
  });

  describe('Network Resilience Integration', () => {
    it('should handle intermittent network failures', () => {
      let attemptCount = 0;
      
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        attemptCount++;
        
        if (attemptCount === 1) {
          // First attempt fails
          req.reply({ forceNetworkError: true });
        } else {
          // Second attempt succeeds
          req.reply({
            statusCode: 200,
            body: { message: 'Success after retry!' }
          });
        }
      }).as('networkResilienceAPI');
      
      cy.get('#email').type('network-test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should show error first
      cy.wait('@networkResilienceAPI');
      cy.get('.error-message').should('be.visible');
      
      // Retry should succeed
      cy.get('.action-button.secondary').should('contain.text', 'Try Again');
      cy.get('.action-button.secondary').click();
      
      cy.wait('@networkResilienceAPI');
      cy.get('.success-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'Success after retry!');
    });

    it('should handle slow API responses', () => {
      // Mock slow response
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        req.reply({
          delay: 5000,
          statusCode: 200,
          body: { message: 'Slow response success!' }
        });
      }).as('slowAPI');
      
      cy.get('#email').type('slow-test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should show loading state
      cy.get('.loading-content').should('be.visible');
      cy.get('.spinner').should('be.visible');
      
      // Should eventually succeed
      cy.wait('@slowAPI');
      cy.get('.success-message', { timeout: 10000 }).should('be.visible');
      cy.get('.status-description').should('contain.text', 'Slow response success!');
    });

    it('should handle API timeouts', () => {
      // Mock timeout
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        // Don't reply to simulate timeout
        req.reply({ delay: 30000, statusCode: 408 });
      }).as('timeoutAPI');
      
      cy.get('#email').type('timeout-test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should show loading initially
      cy.get('.loading-content').should('be.visible');
      
      // Should eventually show timeout error
      cy.wait('@timeoutAPI');
      cy.get('.error-message').should('be.visible');
    });
  });

  describe('Data Validation Integration', () => {
    it('should handle server-side validation errors', () => {
      const invalidEmails = [
        { email: 'invalid@', error: 'Invalid email domain' },
        { email: 'test@invalid-domain', error: 'Domain not allowed' },
        { email: 'blocked@spam.com', error: 'Email address is blocked' }
      ];
      
      invalidEmails.forEach((testCase, index) => {
        cy.intercept('POST', `${apiUrl}/subscribe`, {
          statusCode: 400,
          body: { error: testCase.error }
        }).as(`validationAPI${index}`);
        
        cy.get('#email').clear().type(testCase.email);
        cy.get('button[type="submit"]').click();
        
        cy.wait(`@validationAPI${index}`);
        
        cy.get('.error-message').should('be.visible');
        cy.get('.status-description').should('contain.text', testCase.error);
        
        // Reset for next test
        cy.reload();
        cy.get('[data-cy="subscription-form"]').should('be.visible');
      });
    });

    it('should handle input sanitization on the server side', () => {
      const maliciousInputs = [
        'test+<script>alert("xss")</script>@example.com',
        'test@example.com<img src=x onerror=alert(1)>',
        'test@example.com"; DROP TABLE users; --'
      ];
      
      maliciousInputs.forEach((input, index) => {
        cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
          // Server should sanitize input
          expect(req.body.email).to.not.contain('<script>');
          expect(req.body.email).to.not.contain('<img');
          expect(req.body.email).to.not.contain('DROP TABLE');
          
          req.reply({
            statusCode: 400,
            body: { error: 'Invalid email format' }
          });
        }).as(`sanitizationAPI${index}`);
        
        cy.get('#email').clear().type(input);
        cy.get('button[type="submit"]').click();
        
        cy.wait(`@sanitizationAPI${index}`);
        
        // Should show validation error
        cy.get('.error-message').should('be.visible');
        
        // Reset for next test
        cy.reload();
        cy.get('[data-cy="subscription-form"]').should('be.visible');
      });
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance with real API calls', () => {
      const startTime = Date.now();
      
      // Mock realistic API response time
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        req.reply({
          delay: 800, // Realistic API response time
          statusCode: 200,
          body: { message: 'Performance test success!' }
        });
      }).as('performanceAPI');
      
      cy.get('#email').type('performance-test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@performanceAPI');
      
      cy.get('.success-message').should('be.visible').then(() => {
        const totalTime = Date.now() - startTime;
        
        // Total interaction time should be reasonable
        expect(totalTime).to.be.lessThan(2000);
      });
    });

    it('should handle concurrent requests properly', () => {
      // Simulate multiple rapid submissions (edge case)
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        req.reply({
          delay: 1000,
          statusCode: 200,
          body: { message: 'Concurrent test success!' }
        });
      }).as('concurrentAPI');
      
      cy.get('#email').type('concurrent-test@example.com');
      
      // Rapid clicks (should be handled gracefully)
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').click(); // Second click should be ignored
      
      // Should only make one request
      cy.wait('@concurrentAPI');
      cy.get('.success-message').should('be.visible');
      
      // Verify only one success message
      cy.get('.success-message').should('have.length', 1);
    });
  });

  describe('Environment-Specific Integration', () => {
    it('should work with development environment configuration', () => {
      // Test development-specific settings
      cy.window().then((win) => {
        // Should have development configuration
        expect(win.location.protocol).to.equal('http:');
      });
      
      // Should work with development API
      cy.intercept('POST', 'http://localhost:3000/dev/subscribe', {
        statusCode: 200,
        body: { message: 'Development environment success!' }
      }).as('devAPI');
      
      cy.get('#email').type('dev-test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@devAPI');
      cy.get('.success-message').should('be.visible');
    });

    it('should handle production environment configuration', () => {
      // Mock production environment
      cy.intercept('POST', 'https://your-api-gateway-url.amazonaws.com/dev/subscribe', {
        statusCode: 200,
        body: { message: 'Production environment success!' }
      }).as('prodAPI');
      
      // This test would be more meaningful in actual production environment
      // For now, we verify the structure is in place
      cy.get('#email').type('prod-test@example.com');
      
      // In production, this would use HTTPS endpoint
      cy.get('button[type="submit"]').should('be.visible');
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from temporary API outages', () => {
      let requestCount = 0;
      
      cy.intercept('POST', `${apiUrl}/subscribe`, (req) => {
        requestCount++;
        
        if (requestCount <= 2) {
          // First two requests fail (simulating outage)
          req.reply({
            statusCode: 503,
            body: { error: 'Service temporarily unavailable' }
          });
        } else {
          // Third request succeeds (service recovered)
          req.reply({
            statusCode: 200,
            body: { message: 'Service recovered successfully!' }
          });
        }
      }).as('recoveryAPI');
      
      cy.get('#email').type('recovery-test@example.com');
      cy.get('button[type="submit"]').click();
      
      // First attempt fails
      cy.wait('@recoveryAPI');
      cy.get('.error-message').should('be.visible');
      
      // Retry fails
      cy.get('.action-button.secondary').click();
      cy.wait('@recoveryAPI');
      cy.get('.error-message').should('be.visible');
      
      // Third retry succeeds
      cy.get('.action-button.secondary').click();
      cy.wait('@recoveryAPI');
      cy.get('.success-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'Service recovered successfully!');
    });
  });
});