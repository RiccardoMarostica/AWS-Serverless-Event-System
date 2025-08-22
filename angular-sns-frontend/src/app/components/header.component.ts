import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header" role="banner">
      <div class="header-container">
        <div class="logo">
          <h1 class="logo-text">
            <span class="logo-icon">📧</span>
            Event Notifications
          </h1>
        </div>
        
        <!-- Mobile menu button -->
        <button 
          class="mobile-menu-btn d-md-none" 
          type="button"
          [attr.aria-expanded]="isMobileMenuOpen"
          aria-controls="main-nav"
          aria-label="Toggle navigation menu"
          (click)="toggleMobileMenu()"
        >
          <span class="hamburger-line" [class.active]="isMobileMenuOpen"></span>
          <span class="hamburger-line" [class.active]="isMobileMenuOpen"></span>
          <span class="hamburger-line" [class.active]="isMobileMenuOpen"></span>
        </button>
        
        <nav 
          id="main-nav" 
          class="nav" 
          [class.nav-open]="isMobileMenuOpen"
          role="navigation"
          aria-label="Main navigation"
        >
          <a href="#" class="nav-link" (click)="closeMobileMenu()">
            <span class="nav-icon">🏠</span>
            Home
          </a>
          <a href="#subscribe" class="nav-link" (click)="closeMobileMenu()">
            <span class="nav-icon">✉️</span>
            Subscribe
          </a>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      padding: var(--spacing-md) 0;
      box-shadow: var(--shadow-lg);
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      backdrop-filter: blur(10px);
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }

    .logo {
      flex-shrink: 0;
    }

    .logo-text {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      letter-spacing: -0.025em;
    }

    .logo-icon {
      font-size: var(--font-size-2xl);
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    /* Mobile menu button */
    .mobile-menu-btn {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-md);
      transition: background-color 0.3s ease;
    }

    .mobile-menu-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .mobile-menu-btn:focus {
      outline: 2px solid rgba(255, 255, 255, 0.5);
      outline-offset: 2px;
    }

    .hamburger-line {
      width: 20px;
      height: 2px;
      background-color: white;
      margin: 2px 0;
      transition: all 0.3s ease;
      transform-origin: center;
    }

    .hamburger-line.active:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .hamburger-line.active:nth-child(2) {
      opacity: 0;
    }

    .hamburger-line.active:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }

    /* Navigation */
    .nav {
      display: flex;
      gap: var(--spacing-xl);
      align-items: center;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
      font-size: var(--font-size-base);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--border-radius-md);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      position: relative;
    }

    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      width: 0;
      height: 2px;
      background: white;
      transition: all 0.3s ease;
      transform: translateX(-50%);
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    .nav-link:hover::after {
      width: 80%;
    }

    .nav-link:focus {
      outline: 2px solid rgba(255, 255, 255, 0.5);
      outline-offset: 2px;
    }

    .nav-icon {
      font-size: var(--font-size-sm);
    }

    /* Mobile navigation */
    @media (max-width: 767.98px) {
      .nav {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--primary-dark);
        flex-direction: column;
        padding: var(--spacing-lg) var(--spacing-md);
        box-shadow: var(--shadow-lg);
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        gap: var(--spacing-md);
      }

      .nav.nav-open {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .nav-link {
        width: 100%;
        justify-content: flex-start;
        padding: var(--spacing-md);
        border-radius: var(--border-radius-lg);
        font-size: var(--font-size-lg);
      }

      .nav-link::after {
        display: none;
      }

      .nav-link:hover {
        background-color: rgba(255, 255, 255, 0.15);
        transform: translateX(4px);
      }

      .logo-text {
        font-size: var(--font-size-lg);
      }

      .logo-icon {
        font-size: var(--font-size-xl);
      }
    }

    /* Tablet styles */
    @media (min-width: 768px) and (max-width: 991.98px) {
      .nav {
        gap: var(--spacing-lg);
      }

      .nav-link {
        font-size: var(--font-size-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
      }
    }

    /* Desktop styles */
    @media (min-width: 992px) {
      .header {
        padding: var(--spacing-lg) 0;
      }

      .header-container {
        padding: 0 var(--spacing-xl);
      }

      .logo-text {
        font-size: var(--font-size-2xl);
      }

      .nav {
        gap: var(--spacing-2xl);
      }

      .nav-link {
        font-size: var(--font-size-lg);
        padding: var(--spacing-md) var(--spacing-lg);
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .header {
        background: var(--primary-color);
        border-bottom: 2px solid white;
      }

      .nav-link:hover {
        background-color: white;
        color: var(--primary-color);
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .nav-link,
      .hamburger-line,
      .nav {
        transition: none;
      }
    }
  `]
})
export class HeaderComponent {
  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}