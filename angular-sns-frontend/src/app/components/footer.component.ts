import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer" role="contentinfo">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="footer-logo">
              <span class="footer-icon">📧</span>
              <span class="footer-title">Event Notifications</span>
            </div>
            <p class="footer-description">
              Stay updated with the latest events and notifications.
            </p>
          </div>
          
          <div class="footer-links-section">
            <div class="footer-links-group">
              <h4 class="footer-links-title">Quick Links</h4>
              <nav class="footer-links" aria-label="Footer navigation">
                <a href="#" class="footer-link">Home</a>
                <a href="#subscribe" class="footer-link">Subscribe</a>
                <a href="#" class="footer-link">About</a>
              </nav>
            </div>
            
            <div class="footer-links-group">
              <h4 class="footer-links-title">Legal</h4>
              <nav class="footer-links" aria-label="Legal links">
                <a href="#" class="footer-link">Privacy Policy</a>
                <a href="#" class="footer-link">Terms of Service</a>
                <a href="#" class="footer-link">Contact</a>
              </nav>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="footer-copyright">
            &copy; {{ currentYear }} Event Notifications. All rights reserved.
          </p>
          <div class="footer-social">
            <span class="footer-social-text">Follow us:</span>
            <a href="#" class="footer-social-link" aria-label="Twitter">
              <span class="social-icon">🐦</span>
            </a>
            <a href="#" class="footer-social-link" aria-label="LinkedIn">
              <span class="social-icon">💼</span>
            </a>
            <a href="#" class="footer-social-link" aria-label="GitHub">
              <span class="social-icon">🐙</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: linear-gradient(135deg, var(--gray-900) 0%, var(--gray-800) 100%);
      color: var(--gray-300);
      margin-top: auto;
      padding: var(--spacing-2xl) 0 var(--spacing-xl);
      border-top: 4px solid var(--primary-color);
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-md);
    }

    .footer-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    /* Footer brand section */
    .footer-brand {
      text-align: center;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }

    .footer-icon {
      font-size: var(--font-size-2xl);
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .footer-title {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: white;
      letter-spacing: -0.025em;
    }

    .footer-description {
      color: var(--gray-400);
      font-size: var(--font-size-base);
      margin: 0;
      max-width: 400px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* Footer links section */
    .footer-links-section {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-xl);
      text-align: center;
    }

    .footer-links-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .footer-links-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: white;
      margin: 0 0 var(--spacing-sm) 0;
    }

    .footer-links {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .footer-link {
      color: var(--gray-400);
      text-decoration: none;
      font-size: var(--font-size-base);
      transition: all 0.3s ease;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--border-radius-md);
      display: inline-block;
    }

    .footer-link:hover {
      color: var(--primary-light);
      background-color: rgba(255, 255, 255, 0.05);
      transform: translateY(-1px);
    }

    .footer-link:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Footer bottom section */
    .footer-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      padding-top: var(--spacing-xl);
      border-top: 1px solid var(--gray-700);
      text-align: center;
    }

    .footer-copyright {
      margin: 0;
      color: var(--gray-500);
      font-size: var(--font-size-sm);
    }

    .footer-social {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .footer-social-text {
      color: var(--gray-500);
      font-size: var(--font-size-sm);
      margin-right: var(--spacing-sm);
    }

    .footer-social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: var(--gray-800);
      border-radius: 50%;
      text-decoration: none;
      transition: all 0.3s ease;
      border: 1px solid var(--gray-700);
    }

    .footer-social-link:hover {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .footer-social-link:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .social-icon {
      font-size: var(--font-size-lg);
    }

    /* Tablet styles */
    @media (min-width: 576px) {
      .footer-links {
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
        gap: var(--spacing-lg);
      }

      .footer-social {
        gap: var(--spacing-lg);
      }
    }

    @media (min-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr 1fr;
        text-align: left;
      }

      .footer-brand {
        text-align: left;
      }

      .footer-logo {
        justify-content: flex-start;
      }

      .footer-description {
        margin: 0;
      }

      .footer-links-section {
        grid-template-columns: 1fr 1fr;
        text-align: left;
      }

      .footer-links {
        align-items: flex-start;
      }

      .footer-bottom {
        flex-direction: row;
        justify-content: space-between;
        text-align: left;
      }
    }

    @media (min-width: 992px) {
      .footer {
        padding: var(--spacing-3xl) 0 var(--spacing-2xl);
      }

      .footer-container {
        padding: 0 var(--spacing-xl);
      }

      .footer-content {
        grid-template-columns: 2fr 1fr;
        gap: var(--spacing-2xl);
      }

      .footer-links-section {
        gap: var(--spacing-2xl);
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .footer {
        background: var(--gray-900);
        border-top-color: white;
      }

      .footer-link:hover {
        background-color: white;
        color: var(--gray-900);
      }

      .footer-social-link:hover {
        background-color: white;
        color: var(--gray-900);
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .footer-link,
      .footer-social-link {
        transition: none;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}