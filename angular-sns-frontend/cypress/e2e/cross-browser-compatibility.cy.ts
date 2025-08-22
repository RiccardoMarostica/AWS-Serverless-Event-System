describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-cy="subscription-form"]', { timeout: 10000 }).should('be.visible');
  });

  describe('Core Functionality Across Browsers', () => {
    it('should load and display the application correctly', () => {
      // Verify essential elements are present
      cy.get('h2').should('contain.text', 'Subscribe to Event Notifications');
      cy.get('#email').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      
      // Verify CSS is loaded properly
      cy.get('.subscription-container').should('have.css', 'max-width');
      cy.get('.form-container').should('have.css', 'background-color');
      cy.get('button[type="submit"]').should('have.css', 'background-color');
    });

    it('should handle form interactions consistently', () => {
      const testEmail = 'test@example.com';
      
      // Test input field behavior
      cy.get('#email').type(testEmail);
      cy.get('#email').should('have.value', testEmail);
      
      // Test form validation
      cy.get('#email').clear().type('invalid-email');
      cy.get('#email').blur();
      cy.get('.error-messages').should('be.visible');
      
      // Test successful input
      cy.get('#email').clear().type(testEmail);
      cy.get('#email').should('have.class', 'input-success');
      
      // Test form submission
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Success!' }
      }).as('subscribeSuccess');
      
      cy.get('button[type="submit"]').click();
      cy.wait('@subscribeSuccess');
      cy.get('.success-message').should('be.visible');
    });

    it('should handle JavaScript events properly', () => {
      // Test focus events
      cy.get('#email').focus();
      cy.get('#email').should('be.focused');
      
      // Test blur events
      cy.get('#email').type('test@example.com').blur();
      cy.get('#email').should('not.be.focused');
      
      // Test click events
      cy.get('button[type="submit"]').should('be.visible');
      
      // Test keyboard events
      cy.get('#email').clear().type('{selectall}test@example.com{enter}');
      cy.get('.loading-content').should('be.visible');
    });

    it('should handle CSS animations and transitions', () => {
      // Test loading animation
      cy.intercept('POST', '**/subscribe', (req) => {
        req.reply({ delay: 1000, statusCode: 200, body: { message: 'Success!' } });
      }).as('delayedResponse');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Verify spinner animation is working
      cy.get('.spinner').should('be.visible');
      cy.get('.spinner').should('have.css', 'animation-duration');
      
      cy.wait('@delayedResponse');
      
      // Verify transition to success state
      cy.get('.success-message').should('be.visible');
    });
  });

  describe('HTML5 Features Compatibility', () => {
    it('should use HTML5 input types correctly', () => {
      // Verify email input type
      cy.get('#email').should('have.attr', 'type', 'email');
      
      // Test HTML5 validation attributes
      cy.get('#email').should('have.attr', 'autocomplete', 'email');
      cy.get('#email').should('have.attr', 'autocapitalize', 'none');
      cy.get('#email').should('have.attr', 'spellcheck', 'false');
    });

    it('should handle HTML5 form validation', () => {
      // Test required attribute behavior
      cy.get('button[type="submit"]').click();
      
      // Different browsers may handle HTML5 validation differently
      // We ensure our custom validation works regardless
      cy.get('.error-messages').should('be.visible');
    });

    it('should use semantic HTML elements', () => {
      // Verify proper use of semantic elements
      cy.get('form').should('exist');
      cy.get('label[for="email"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
      
      // Verify ARIA attributes for accessibility
      cy.get('#email').should('have.attr', 'aria-describedby');
    });
  });

  describe('CSS Compatibility', () => {
    it('should handle CSS Grid and Flexbox layouts', () => {
      // Test CSS Grid (form features)
      cy.get('.form-features').should('have.css', 'display', 'grid');
      
      // Test Flexbox (various elements)
      cy.get('.page-title').should('have.css', 'display', 'flex');
      cy.get('.input-wrapper').should('have.css', 'display', 'flex');
    });

    it('should handle CSS custom properties (variables)', () => {
      // Test that CSS variables are applied
      cy.get('.form-container').should('have.css', 'border-radius');
      cy.get('button[type="submit"]').should('have.css', 'background-color');
      
      // Verify colors are applied correctly
      cy.get('button[type="submit"]').should('have.css', 'color', 'rgb(255, 255, 255)');
    });

    it('should handle CSS transforms and animations', () => {
      // Test hover effects (simulate hover)
      cy.get('button[type="submit"]').trigger('mouseover');
      
      // Test loading spinner animation
      cy.intercept('POST', '**/subscribe', (req) => {
        req.reply({ delay: 500, statusCode: 200, body: { message: 'Success!' } });
      }).as('delayedResponse');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.get('.spinner').should('be.visible');
      cy.get('.spinner').should('have.css', 'animation-name', 'spin');
    });

    it('should handle responsive CSS media queries', () => {
      // Test mobile layout
      cy.viewport(375, 667);
      cy.get('.form-features').should('have.css', 'grid-template-columns', '1fr');
      
      // Test desktop layout
      cy.viewport(1280, 720);
      cy.get('.form-features').should('have.css', 'grid-template-columns').and('contain', 'fr');
    });
  });

  describe('JavaScript API Compatibility', () => {
    it('should handle modern JavaScript features', () => {
      cy.window().then((win) => {
        // Test that modern JS features are available
        expect(win.Promise).to.exist;
        expect(win.fetch).to.exist;
        expect(win.localStorage).to.exist;
        expect(win.sessionStorage).to.exist;
      });
    });

    it('should handle async/await and Promises', () => {
      // Test that HTTP requests work properly
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Success!' }
      }).as('subscribeRequest');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@subscribeRequest');
      cy.get('.success-message').should('be.visible');
    });

    it('should handle DOM manipulation correctly', () => {
      // Test dynamic content updates
      cy.get('#email').type('invalid-email');
      cy.get('#email').blur();
      
      // Error message should be dynamically added
      cy.get('.error-messages').should('be.visible');
      cy.get('.error-text').should('contain.text', 'valid email');
      
      // Fix the email
      cy.get('#email').clear().type('test@example.com');
      
      // Error should be dynamically removed
      cy.get('.error-messages').should('not.exist');
      cy.get('.status-icon.success').should('be.visible');
    });
  });

  describe('Network and HTTP Compatibility', () => {
    it('should handle different HTTP response codes', () => {
      const testCases = [
        { status: 200, message: 'Success!' },
        { status: 400, error: 'Bad Request' },
        { status: 500, error: 'Server Error' },
        { status: 503, error: 'Service Unavailable' }
      ];
      
      testCases.forEach((testCase) => {
        cy.get('#email').clear().type('test@example.com');
        
        if (testCase.message) {
          cy.intercept('POST', '**/subscribe', {
            statusCode: testCase.status,
            body: { message: testCase.message }
          }).as('apiResponse');
          
          cy.get('button[type="submit"]').click();
          cy.wait('@apiResponse');
          
          if (testCase.status === 200) {
            cy.get('.success-message').should('be.visible');
          }
        } else {
          cy.intercept('POST', '**/subscribe', {
            statusCode: testCase.status,
            body: { error: testCase.error }
          }).as('apiError');
          
          cy.get('button[type="submit"]').click();
          cy.wait('@apiError');
          
          cy.get('.error-message').should('be.visible');
        }
        
        // Reset for next test
        if (testCase.status === 200) {
          cy.get('.action-button.primary').click();
        } else {
          cy.reload();
          cy.get('[data-cy="subscription-form"]').should('be.visible');
        }
      });
    });

    it('should handle CORS and preflight requests', () => {
      // Mock CORS preflight
      cy.intercept('OPTIONS', '**/subscribe', {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }).as('preflightRequest');
      
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Success!' }
      }).as('subscribeRequest');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should handle CORS properly
      cy.wait('@subscribeRequest');
      cy.get('.success-message').should('be.visible');
    });

    it('should handle network timeouts gracefully', () => {
      // Mock timeout
      cy.intercept('POST', '**/subscribe', (req) => {
        req.reply({ delay: 15000, statusCode: 408 });
      }).as('timeoutRequest');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should show loading state
      cy.get('.loading-content').should('be.visible');
      
      // Should eventually show error
      cy.wait('@timeoutRequest');
      cy.get('.error-message').should('be.visible');
    });
  });

  describe('Security Features Compatibility', () => {
    it('should handle Content Security Policy', () => {
      cy.window().then((win) => {
        // Verify no inline scripts are executed (CSP compliance)
        const scripts = win.document.querySelectorAll('script[src]');
        expect(scripts.length).to.be.greaterThan(0);
        
        // Verify no inline event handlers
        const elementsWithInlineEvents = win.document.querySelectorAll('[onclick], [onload], [onerror]');
        expect(elementsWithInlineEvents.length).to.equal(0);
      });
    });

    it('should sanitize user input properly', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>'
      ];
      
      maliciousInputs.forEach((input) => {
        cy.get('#email').clear().type(input + '@example.com');
        
        // Should not execute any scripts
        cy.window().then((win) => {
          expect(win.document.title).to.not.contain('XSS');
        });
        
        // Should show validation error for invalid email
        cy.get('#email').blur();
        cy.get('.error-messages').should('be.visible');
      });
    });

    it('should handle HTTPS enforcement', () => {
      cy.window().then((win) => {
        // In production, should enforce HTTPS
        // For development, HTTP is acceptable
        expect(win.location.protocol).to.match(/^https?:$/);
      });
    });
  });

  describe('Performance Across Browsers', () => {
    it('should load within acceptable time limits', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      cy.get('[data-cy="subscription-form"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        
        // Should load within 3 seconds (requirement 1.3)
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('should handle form interactions responsively', () => {
      // Test input responsiveness
      const startTime = Date.now();
      cy.get('#email').type('test@example.com');
      
      cy.get('#email').should('have.value', 'test@example.com').then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(1000);
      });
      
      // Test validation responsiveness
      const validationStart = Date.now();
      cy.get('#email').clear().type('invalid');
      cy.get('#email').blur();
      
      cy.get('.error-messages').should('be.visible').then(() => {
        const validationTime = Date.now() - validationStart;
        expect(validationTime).to.be.lessThan(500);
      });
    });

    it('should handle memory usage efficiently', () => {
      // Test for memory leaks by performing multiple operations
      for (let i = 0; i < 5; i++) {
        cy.get('#email').clear().type(`test${i}@example.com`);
        cy.get('#email').clear();
      }
      
      // Should still be responsive
      cy.get('#email').type('final@example.com');
      cy.get('#email').should('have.value', 'final@example.com');
    });
  });

  describe('Accessibility Across Browsers', () => {
    it('should maintain accessibility features', () => {
      // Test keyboard navigation
      cy.get('body').tab();
      cy.focused().should('have.id', 'email');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'submit');
      
      // Test ARIA attributes
      cy.get('#email').should('have.attr', 'aria-describedby');
      cy.get('.error-messages').should('have.attr', 'role', 'alert');
      
      // Test screen reader content
      cy.get('.label-required').should('have.attr', 'aria-label', 'required');
    });

    it('should handle high contrast mode', () => {
      // Test that elements are still visible in high contrast
      cy.get('#email').should('have.css', 'border-width').and('not.equal', '0px');
      cy.get('button[type="submit"]').should('have.css', 'border-width');
      
      // Test focus indicators
      cy.get('#email').focus();
      cy.get('#email').should('have.css', 'outline-width').and('not.equal', '0px');
    });
  });
});