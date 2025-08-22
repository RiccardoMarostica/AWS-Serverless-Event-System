// ***********************************************
// Custom commands for Angular SNS Frontend E2E tests
// ***********************************************

// Command to fill and submit subscription form
Cypress.Commands.add('submitSubscription', (email: string, shouldSucceed: boolean = true) => {
  if (shouldSucceed) {
    cy.intercept('POST', '**/subscribe', {
      statusCode: 200,
      body: { message: 'Subscription successful!' }
    }).as('subscribeRequest');
  } else {
    cy.intercept('POST', '**/subscribe', {
      statusCode: 400,
      body: { error: 'Subscription failed' }
    }).as('subscribeRequest');
  }
  
  cy.get('#email').clear().type(email);
  cy.get('button[type="submit"]').click();
  cy.wait('@subscribeRequest');
});

// Command to check form validation state
Cypress.Commands.add('checkFormValidation', (email: string, shouldBeValid: boolean) => {
  cy.get('#email').clear().type(email);
  cy.get('#email').blur();
  
  if (shouldBeValid) {
    cy.get('#email').should('have.class', 'input-success');
    cy.get('.status-icon.success').should('be.visible');
    cy.get('button[type="submit"]').should('not.be.disabled');
  } else {
    cy.get('#email').should('have.class', 'input-error');
    cy.get('.error-messages').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');
  }
});

// Command to wait for application to be ready
Cypress.Commands.add('waitForApp', () => {
  cy.get('[data-cy="subscription-form"]', { timeout: 10000 }).should('be.visible');
  cy.get('#email').should('be.visible');
  cy.get('button[type="submit"]').should('be.visible');
});

// Command to reset form state
Cypress.Commands.add('resetForm', () => {
  cy.get('#email').clear();
  cy.get('.success-message').should('not.exist');
  cy.get('.error-message').should('not.exist');
});

// Command to test responsive behavior
Cypress.Commands.add('testResponsive', (viewport: { width: number, height: number }) => {
  cy.viewport(viewport.width, viewport.height);
  cy.waitForApp();
  
  // Verify essential elements are visible
  cy.get('.page-title').should('be.visible');
  cy.get('#email').should('be.visible');
  cy.get('button[type="submit"]').should('be.visible');
  
  // Test form functionality
  cy.checkFormValidation('test@example.com', true);
});

// Command to simulate network conditions
Cypress.Commands.add('simulateNetworkCondition', (condition: 'slow' | 'offline' | 'timeout') => {
  switch (condition) {
    case 'slow':
      cy.intercept('POST', '**/subscribe', (req) => {
        req.reply({ delay: 3000, statusCode: 200, body: { message: 'Slow success!' } });
      }).as('networkRequest');
      break;
    case 'offline':
      cy.intercept('POST', '**/subscribe', { forceNetworkError: true }).as('networkRequest');
      break;
    case 'timeout':
      cy.intercept('POST', '**/subscribe', (req) => {
        req.reply({ delay: 15000, statusCode: 408 });
      }).as('networkRequest');
      break;
  }
});

// Command for accessibility testing
Cypress.Commands.add('checkAccessibility', () => {
  // Check ARIA attributes
  cy.get('#email').should('have.attr', 'aria-describedby');
  cy.get('.error-messages').should('have.attr', 'role', 'alert');
  cy.get('.success-message').should('have.attr', 'role', 'alert');
  
  // Check keyboard navigation
  cy.get('body').tab();
  cy.focused().should('have.id', 'email');
  
  cy.focused().tab();
  cy.focused().should('have.attr', 'type', 'submit');
  
  // Check labels
  cy.get('label[for="email"]').should('exist');
  cy.get('.label-required').should('have.attr', 'aria-label', 'required');
});

// Command to test cross-browser compatibility
Cypress.Commands.add('testBrowserCompatibility', () => {
  // Test modern JavaScript features
  cy.window().then((win) => {
    expect(win.Promise).to.exist;
    expect(win.fetch).to.exist;
    expect(win.localStorage).to.exist;
  });
  
  // Test CSS features
  cy.get('.form-features').should('have.css', 'display', 'grid');
  cy.get('.page-title').should('have.css', 'display', 'flex');
  
  // Test form functionality
  cy.checkFormValidation('test@example.com', true);
  cy.submitSubscription('test@example.com', true);
  cy.get('.success-message').should('be.visible');
});

declare global {
  namespace Cypress {
    interface Chainable {
      submitSubscription(email: string, shouldSucceed?: boolean): Chainable<void>
      checkFormValidation(email: string, shouldBeValid: boolean): Chainable<void>
      waitForApp(): Chainable<void>
      resetForm(): Chainable<void>
      testResponsive(viewport: { width: number, height: number }): Chainable<void>
      simulateNetworkCondition(condition: 'slow' | 'offline' | 'timeout'): Chainable<void>
      checkAccessibility(): Chainable<void>
      testBrowserCompatibility(): Chainable<void>
    }
  }
}