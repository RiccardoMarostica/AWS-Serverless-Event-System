import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-container">
        <div class="logo">
          <h1>Event Notifications</h1>
        </div>
        <nav class="nav">
          <a href="#" class="nav-link">Home</a>
          <a href="#" class="nav-link">Subscribe</a>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background-color: #1976d2;
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .nav {
      display: flex;
      gap: 2rem;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.3s ease;
    }

    .nav-link:hover {
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .header-container {
        flex-direction: column;
        gap: 1rem;
      }

      .nav {
        gap: 1rem;
      }

      .logo h1 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class HeaderComponent {
}