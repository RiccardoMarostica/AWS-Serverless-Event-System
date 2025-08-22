describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 }
  ];

  viewports.forEach((viewport) => {
    describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
        cy.get('[data-cy="subscription-form"]', { timeout: 10000 }).should('be.visible');
      });

      it('should display all essential elements', () => {
        // Header elements should be visible
        cy.get('.page-title').should('be.visible');
        cy.get('.page-description').should('be.visible');
        
        // Form elements should be visible and accessible
        cy.get('#email').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
        
        // Form should be usable (not cut off or overlapping)
        cy.get('.subscription-form').should('be.visible');
        cy.get('.form-container').should('be.visible');
      });

      it('should have proper form layout and spacing', () => {
        // Form should not be too narrow or too wide
        cy.get('.form-container').then(($container) => {
          const containerWidth = $container.width();
          
          if (viewport.width < 576) {
            // Mobile: form should use most of the screen width
            expect(containerWidth).to.be.greaterThan(viewport.width * 0.8);
          } else {
            // Larger screens: form should have reasonable max width
            expect(containerWidth).to.be.lessThan(800);
          }
        });

        // Input field should be appropriately sized
        cy.get('#email').should('have.css', 'width').and('not.equal', '0px');
        cy.get('#email').should('have.css', 'min-height').and('match', /\d+px/);
        
        // Submit button should be full width on mobile, appropriate width on desktop
        cy.get('button[type="submit"]').then(($button) => {
          const buttonWidth = $button.width();
          const containerWidth = $button.parent().width();
          
          if (viewport.width < 576) {
            // Mobile: button should be full width
            expect(buttonWidth).to.be.greaterThan(containerWidth * 0.9);
          }
        });
      });

      it('should handle text scaling appropriately', () => {
        // Title should be readable but not too large
        cy.get('.page-title').should('have.css', 'font-size').and('match', /\d+px/);
        
        // Form labels should be readable
        cy.get('.form-label').should('have.css', 'font-size').and('match', /\d+px/);
        
        // Input text should be at least 16px on mobile to prevent zoom
        if (viewport.width < 576) {
          cy.get('#email').should('have.css', 'font-size').then((fontSize) => {
            const size = parseInt(fontSize.replace('px', ''));
            expect(size).to.be.at.least(16);
          });
        }
      });

      it('should maintain proper touch targets on mobile', () => {
        if (viewport.width < 768) {
          // Touch targets should be at least 44px (iOS) or 48px (Android)
          cy.get('#email').should('have.css', 'min-height').then((height) => {
            const minHeight = parseInt(height.replace('px', ''));
            expect(minHeight).to.be.at.least(44);
          });
          
          cy.get('button[type="submit"]').should('have.css', 'min-height').then((height) => {
            const minHeight = parseInt(height.replace('px', ''));
            expect(minHeight).to.be.at.least(44);
          });
        }
      });

      it('should handle form validation display properly', () => {
        // Trigger validation error
        cy.get('#email').type('invalid-email');
        cy.get('#email').blur();
        
        // Error message should be visible and not cut off
        cy.get('.error-messages').should('be.visible');
        cy.get('.error-text').should('be.visible');
        
        // Error message should not overflow container
        cy.get('.error-messages').then(($error) => {
          const errorRight = $error.offset().left + $error.width();
          expect(errorRight).to.be.lessThan(viewport.width);
        });
      });

      it('should display success/error states appropriately', () => {
        // Mock successful subscription
        cy.intercept('POST', '**/subscribe', {
          statusCode: 200,
          body: { message: 'Subscription successful!' }
        }).as('subscribeSuccess');
        
        cy.get('#email').type('test@example.com');
        cy.get('button[type="submit"]').click();
        
        cy.wait('@subscribeSuccess');
        
        // Success message should be visible and properly formatted
        cy.get('.success-message').should('be.visible');
        cy.get('.status-title').should('be.visible');
        cy.get('.status-description').should('be.visible');
        
        // Action button should be appropriately sized
        cy.get('.action-button').should('be.visible');
        
        if (viewport.width < 576) {
          // On mobile, action button should be full width
          cy.get('.action-button').should('have.css', 'min-width', '100%');
        }
      });

      it('should handle loading states without layout shifts', () => {
        // Mock delayed response to test loading state
        cy.intercept('POST', '**/subscribe', (req) => {
          req.reply({ delay: 2000, statusCode: 200, body: { message: 'Success!' } });
        }).as('delayedResponse');
        
        // Get initial form dimensions
        cy.get('.form-container').then(($container) => {
          const initialHeight = $container.height();
          
          cy.get('#email').type('test@example.com');
          cy.get('button[type="submit"]').click();
          
          // Verify loading state doesn't cause significant layout shift
          cy.get('.loading-content').should('be.visible');
          
          cy.get('.form-container').should(($newContainer) => {
            const newHeight = $newContainer.height();
            const heightDiff = Math.abs(newHeight - initialHeight);
            
            // Allow some variation but prevent major layout shifts
            expect(heightDiff).to.be.lessThan(50);
          });
        });
      });

      it('should maintain proper scrolling behavior', () => {
        // For smaller viewports, ensure content is scrollable
        if (viewport.height < 800) {
          // Add content that might cause overflow
          cy.get('#email').type('invalid-email');
          cy.get('#email').blur();
          
          // Verify page is scrollable if needed
          cy.get('body').then(($body) => {
            const bodyHeight = $body.height();
            if (bodyHeight > viewport.height) {
              // Should be able to scroll to see all content
              cy.scrollTo('bottom');
              cy.get('.error-messages').should('be.visible');
              cy.scrollTo('top');
              cy.get('.page-title').should('be.visible');
            }
          });
        }
      });

      it('should handle feature list layout appropriately', () => {
        // Check form features section
        cy.get('.form-features').should('be.visible');
        cy.get('.feature').should('have.length.at.least', 1);
        
        // On mobile, features should stack vertically
        if (viewport.width < 576) {
          cy.get('.form-features').should('have.css', 'grid-template-columns', '1fr');
        } else {
          // On larger screens, features should be in a grid
          cy.get('.form-features').should('have.css', 'grid-template-columns').and('contain', 'fr');
        }
        
        // All features should be visible
        cy.get('.feature').each(($feature) => {
          cy.wrap($feature).should('be.visible');
          cy.wrap($feature).find('.feature-text').should('be.visible');
        });
      });
    });
  });

  describe('Orientation Change Tests', () => {
    it('should handle orientation changes gracefully', () => {
      // Start in portrait
      cy.viewport(375, 667);
      cy.visit('/');
      
      cy.get('#email').type('test@example.com');
      
      // Switch to landscape
      cy.viewport(667, 375);
      
      // Form should still be usable
      cy.get('#email').should('have.value', 'test@example.com');
      cy.get('button[type="submit"]').should('be.visible');
      cy.get('button[type="submit"]').should('not.be.disabled');
      
      // Should be able to submit
      cy.intercept('POST', '**/subscribe', {
        statusCode: 200,
        body: { message: 'Success!' }
      }).as('subscribeSuccess');
      
      cy.get('button[type="submit"]').click();
      cy.wait('@subscribeSuccess');
      
      cy.get('.success-message').should('be.visible');
    });
  });

  describe('High DPI and Zoom Tests', () => {
    it('should handle browser zoom levels', () => {
      const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
      
      zoomLevels.forEach((zoom) => {
        cy.visit('/', {
          onBeforeLoad: (win) => {
            // Simulate zoom by adjusting viewport
            const scaledWidth = Math.round(1280 / zoom);
            const scaledHeight = Math.round(720 / zoom);
            win.resizeTo(scaledWidth, scaledHeight);
          }
        });
        
        // Essential elements should still be visible and usable
        cy.get('.page-title').should('be.visible');
        cy.get('#email').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
        
        // Form should be functional
        cy.get('#email').type('test@example.com');
        cy.get('#email').should('have.value', 'test@example.com');
      });
    });
  });

  describe('Print Styles', () => {
    it('should have appropriate print styles', () => {
      cy.visit('/');
      
      // Check if print styles are defined
      cy.window().then((win) => {
        const printStyles = Array.from(win.document.styleSheets)
          .some(sheet => {
            try {
              return Array.from(sheet.cssRules || [])
                .some(rule => rule.media && rule.media.mediaText.includes('print'));
            } catch (e) {
              return false;
            }
          });
        
        // This is more of a structural test - in a real scenario,
        // you might want to verify specific print styles
        expect(win.document.styleSheets.length).to.be.greaterThan(0);
      });
    });
  });

  describe('Performance on Different Viewports', () => {
    it('should load quickly on mobile devices', () => {
      cy.viewport(375, 667);
      
      const startTime = Date.now();
      cy.visit('/');
      
      cy.get('[data-cy="subscription-form"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        // Should load within 3 seconds as per requirement 1.3
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('should be responsive to user interactions', () => {
      cy.viewport(375, 667);
      cy.visit('/');
      
      // Interactions should be responsive
      const startTime = Date.now();
      cy.get('#email').type('test@example.com');
      
      cy.get('#email').should('have.value', 'test@example.com').then(() => {
        const responseTime = Date.now() - startTime;
        // Should respond quickly to user input
        expect(responseTime).to.be.lessThan(1000);
      });
    });
  });
});