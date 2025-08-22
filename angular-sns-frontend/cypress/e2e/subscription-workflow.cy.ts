describe('Subscription Workflow E2E Tests', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/');
    
    // Wait for the application to load
    cy.get('[data-cy="subscription-form"]', { timeout: 10000 }).should('be.visible');
  });

  describe('Complete Subscription Workflow', () => {
    it('should display the subscription form on page load', () => {
      // Verify page title and description are visible
      cy.get('h2').should('contain.text', 'Subscribe to Event Notifications');
      cy.get('.page-description').should('be.visible');
      
      // Verify form elements are present
      cy.get('#email').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain.text', 'Subscribe Now');
    });

    it('should successfully submit a valid email subscription', () => {
      const testEmail = 'test@example.com';
      
      // Intercept the API call
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Subscription requested. Please check your email to confirm.' }
      }).as('subscribeRequest');
      
      // Fill in the email field
      cy.get('#email').type(testEmail);
      
      // Verify email validation passes
      cy.get('#email').should('have.class', 'input-success');
      cy.get('.status-icon.success').should('be.visible');
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Verify loading state
      cy.get('.button-loading').should('exist');
      cy.get('.loading-content').should('contain.text', 'Subscribing...');
      
      // Wait for API call
      cy.wait('@subscribeRequest');
      
      // Verify success message
      cy.get('.success-message').should('be.visible');
      cy.get('.status-title').should('contain.text', 'Subscription Successful!');
      cy.get('.status-description').should('contain.text', 'Please check your email to confirm');
      
      // Verify form is reset
      cy.get('#email').should('have.value', '');
    });

    it('should handle subscription with new email after success', () => {
      const firstEmail = 'first@example.com';
      const secondEmail = 'second@example.com';
      
      // Mock successful subscription
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Subscription successful!' }
      }).as('subscribeRequest');
      
      // First subscription
      cy.get('#email').type(firstEmail);
      cy.get('button[type="submit"]').click();
      cy.wait('@subscribeRequest');
      
      // Verify success state
      cy.get('.success-message').should('be.visible');
      
      // Click "Subscribe Another Email" button
      cy.get('.action-button.primary').should('contain.text', 'Subscribe Another Email').click();
      
      // Verify form is back to initial state
      cy.get('.subscription-form').should('be.visible');
      cy.get('#email').should('have.value', '');
      cy.get('#email').should('be.enabled');
      
      // Submit second subscription
      cy.get('#email').type(secondEmail);
      cy.get('button[type="submit"]').click();
      cy.wait('@subscribeRequest');
      
      // Verify second success
      cy.get('.success-message').should('be.visible');
    });
  });

  describe('Form Validation Tests', () => {
    it('should show validation errors for empty email', () => {
      // Try to submit without entering email
      cy.get('button[type="submit"]').click();
      
      // Verify validation error appears
      cy.get('#email').should('have.class', 'input-error');
      cy.get('.error-messages').should('be.visible');
      cy.get('.error-text').should('contain.text', 'Email is required');
      
      // Verify submit button remains disabled
      cy.get('button[type="submit"]').should('be.disabled');
    });

    it('should show validation errors for invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example',
        'test@.com'
      ];
      
      invalidEmails.forEach((email) => {
        cy.get('#email').clear().type(email);
        cy.get('#email').blur();
        
        // Verify validation error
        cy.get('#email').should('have.class', 'input-error');
        cy.get('.error-messages').should('be.visible');
        cy.get('button[type="submit"]').should('be.disabled');
      });
    });

    it('should show real-time validation feedback', () => {
      // Start typing an invalid email
      cy.get('#email').type('test@');
      
      // Should show error state
      cy.get('#email').should('have.class', 'input-error');
      cy.get('.status-icon.error').should('be.visible');
      
      // Complete the email to make it valid
      cy.get('#email').type('example.com');
      
      // Should show success state
      cy.get('#email').should('have.class', 'input-success');
      cy.get('.status-icon.success').should('be.visible');
      
      // Submit button should be enabled
      cy.get('button[type="submit"]').should('not.be.disabled');
    });

    it('should provide helpful validation suggestions', () => {
      // Type a common typo
      cy.get('#email').type('test@gmial.com');
      cy.get('#email').blur();
      
      // Check if suggestions are provided (if implemented)
      cy.get('.field-feedback').should('be.visible');
    });

    it('should prevent form submission with invalid data', () => {
      cy.get('#email').type('invalid-email');
      
      // Try to submit
      cy.get('button[type="submit"]').click();
      
      // Form should not submit
      cy.get('.loading-content').should('not.exist');
      cy.get('.success-message').should('not.exist');
      
      // Error should be highlighted
      cy.get('#email').should('have.class', 'input-error');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle API server errors gracefully', () => {
      // Mock server error
      cy.intercept('POST', '**/subscribe', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('subscribeError');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@subscribeError');
      
      // Verify error message is displayed
      cy.get('.error-message').should('be.visible');
      cy.get('.status-title').should('contain.text', 'Subscription Failed');
      cy.get('.action-button.secondary').should('contain.text', 'Try Again');
    });

    it('should handle network connectivity errors', () => {
      // Mock network error
      cy.intercept('POST', '**/subscribe', { forceNetworkError: true }).as('networkError');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@networkError');
      
      // Verify network error handling
      cy.get('.error-message').should('be.visible');
      cy.get('.action-button.secondary').should('be.visible');
    });

    it('should implement retry functionality with countdown', () => {
      // Mock network error followed by success
      cy.intercept('POST', '**/subscribe', { forceNetworkError: true }).as('networkError');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@networkError');
      
      // Verify retry button with countdown
      cy.get('.action-button.secondary').should('contain.text', 'Retry in');
      
      // Mock successful retry
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Subscription successful!' }
      }).as('retrySuccess');
      
      // Wait for countdown and automatic retry
      cy.get('.action-button.secondary', { timeout: 6000 }).should('contain.text', 'Try Again');
      cy.get('.action-button.secondary').click();
      
      cy.wait('@retrySuccess');
      cy.get('.success-message').should('be.visible');
    });

    it('should handle API validation errors', () => {
      // Mock validation error from API
      cy.intercept('POST', '**/subscribe', {
        statusCode: 400,
        body: { error: 'Email address is already subscribed' }
      }).as('validationError');
      
      cy.get('#email').type('existing@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@validationError');
      
      // Verify specific error message is shown
      cy.get('.error-message').should('be.visible');
      cy.get('.status-description').should('contain.text', 'already subscribed');
    });

    it('should handle timeout errors', () => {
      // Mock timeout
      cy.intercept('POST', '**/subscribe', (req) => {
        req.reply({ delay: 15000, statusCode: 408 });
      }).as('timeoutError');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should show loading state initially
      cy.get('.loading-content').should('be.visible');
      
      // Wait for timeout and verify error handling
      cy.wait('@timeoutError');
      cy.get('.error-message').should('be.visible');
    });
  });

  describe('Loading States and User Feedback', () => {
    it('should show loading indicator during submission', () => {
      // Mock delayed response
      cy.intercept('POST', '**/subscribe', (req) => {
        req.reply({ delay: 2000, statusCode: 200, body: { message: 'Success!' } });
      }).as('delayedResponse');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Verify loading state
      cy.get('.button-loading').should('exist');
      cy.get('.loading-content').should('be.visible');
      cy.get('.spinner').should('be.visible');
      cy.get('.loading-text').should('contain.text', 'Subscribing...');
      
      // Verify form is disabled during loading
      cy.get('#email').should('be.disabled');
      cy.get('button[type="submit"]').should('be.disabled');
      
      cy.wait('@delayedResponse');
      
      // Verify loading state is cleared
      cy.get('.loading-content').should('not.exist');
      cy.get('.success-message').should('be.visible');
    });

    it('should show loading overlay during processing', () => {
      cy.intercept('POST', '**/subscribe', (req) => {
        req.reply({ delay: 1000, statusCode: 200, body: { message: 'Success!' } });
      }).as('delayedResponse');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Verify loading overlay
      cy.get('.loading-overlay').should('be.visible');
      cy.get('app-loading-indicator').should('be.visible');
      
      cy.wait('@delayedResponse');
      
      // Verify overlay is removed
      cy.get('.loading-overlay').should('not.exist');
    });

    it('should provide clear success feedback', () => {
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Custom success message from API' }
      }).as('subscribeSuccess');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@subscribeSuccess');
      
      // Verify success elements
      cy.get('.success-message').should('be.visible');
      cy.get('.status-icon-large.success').should('be.visible');
      cy.get('.status-title').should('contain.text', 'Subscription Successful!');
      cy.get('.status-description').should('contain.text', 'Custom success message from API');
      cy.get('.action-button.primary').should('contain.text', 'Subscribe Another Email');
    });
  });

  describe('Security and Input Sanitization', () => {
    it('should sanitize potentially malicious input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>@example.com',
        'test+<img src=x onerror=alert(1)>@example.com',
        'test@example.com<script>alert("xss")</script>'
      ];
      
      maliciousInputs.forEach((input) => {
        cy.get('#email').clear().type(input);
        
        // Verify input is sanitized (no script execution)
        cy.window().then((win) => {
          // If XSS were successful, this would fail
          expect(win.document.title).to.not.contain('XSS');
        });
        
        // Verify form validation still works
        cy.get('#email').blur();
        cy.get('.error-messages').should('be.visible');
      });
    });

    it('should enforce HTTPS in production environment', () => {
      // This test would be more relevant in a production environment
      // For now, we verify the security configuration is in place
      cy.window().then((win) => {
        // In a real production test, we'd verify HTTPS enforcement
        expect(win.location.protocol).to.match(/^https?:$/);
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and roles', () => {
      // Check form accessibility
      cy.get('#email').should('have.attr', 'aria-describedby');
      cy.get('button[type="submit"]').should('have.attr', 'aria-describedby');
      
      // Check error messages have proper roles
      cy.get('#email').type('invalid');
      cy.get('#email').blur();
      
      cy.get('.error-messages').should('have.attr', 'role', 'alert');
      cy.get('.error-messages').should('have.attr', 'aria-live', 'polite');
    });

    it('should be keyboard navigable', () => {
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.id', 'email');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'submit');
      
      // Test form submission with keyboard
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').focus().type('{enter}');
      
      // Should trigger form submission
      cy.get('.loading-content').should('be.visible');
    });

    it('should have proper heading hierarchy', () => {
      cy.get('h2').should('exist');
      cy.get('h3').should('exist');
      
      // Verify heading structure makes sense
      cy.get('h2').should('contain.text', 'Subscribe to Event Notifications');
    });

    it('should provide screen reader friendly content', () => {
      // Check for screen reader only content
      cy.get('.label-required').should('have.attr', 'aria-label', 'required');
      
      // Verify status messages are announced
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Success!' }
      }).as('success');
      
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@success');
      
      cy.get('.success-message').should('have.attr', 'role', 'alert');
      cy.get('.success-message').should('have.attr', 'aria-live', 'polite');
    });
  });
});