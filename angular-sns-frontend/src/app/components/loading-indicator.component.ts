import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="loading-indicator" 
      [class.inline]="inline"
      [class.centered]="!inline"
      *ngIf="show"
      role="status"
      [attr.aria-label]="text || 'Loading'"
    >
      <div class="spinner-container">
        <div 
          class="spinner" 
          [class.small]="size === 'small'" 
          [class.large]="size === 'large'"
          [class.pulse]="variant === 'pulse'"
          [class.dots]="variant === 'dots'"
          aria-hidden="true"
        ></div>
        <div 
          *ngIf="variant === 'dots'" 
          class="dots-spinner"
          aria-hidden="true"
        >
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
      <span class="loading-text" *ngIf="text">{{ text }}</span>
      <span class="sr-only">{{ text || 'Loading content, please wait' }}</span>
    </div>
  `,
  styles: [`
    .loading-indicator {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      animation: fadeIn 0.3s ease-out;
    }

    .loading-indicator.inline {
      display: inline-flex;
      padding: 0;
      gap: var(--spacing-sm);
    }

    .loading-indicator.centered {
      justify-content: center;
      flex-direction: column;
      text-align: center;
      padding: var(--spacing-xl);
    }

    .spinner-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Default spinner */
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid var(--gray-200);
      border-top: 3px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      flex-shrink: 0;
    }

    .spinner.small {
      width: 16px;
      height: 16px;
      border-width: 2px;
    }

    .spinner.large {
      width: 40px;
      height: 40px;
      border-width: 4px;
    }

    /* Pulse variant */
    .spinner.pulse {
      border: none;
      background-color: var(--primary-color);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .spinner.pulse.small {
      width: 12px;
      height: 12px;
    }

    .spinner.pulse.large {
      width: 32px;
      height: 32px;
    }

    /* Dots variant */
    .spinner.dots {
      display: none;
    }

    .dots-spinner {
      display: flex;
      gap: var(--spacing-xs);
      align-items: center;
    }

    .dot {
      width: 8px;
      height: 8px;
      background-color: var(--primary-color);
      border-radius: 50%;
      animation: dotPulse 1.4s ease-in-out infinite both;
    }

    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    .dot:nth-child(3) { animation-delay: 0s; }

    .loading-indicator.large .dot {
      width: 12px;
      height: 12px;
    }

    .loading-indicator.small .dot {
      width: 6px;
      height: 6px;
    }

    .loading-text {
      color: var(--gray-600);
      font-size: var(--font-size-sm);
      font-weight: 500;
      margin: 0;
    }

    .loading-indicator.large .loading-text {
      font-size: var(--font-size-base);
      margin-top: var(--spacing-md);
    }

    .loading-indicator.small .loading-text {
      font-size: var(--font-size-xs);
    }

    .loading-indicator.centered .loading-text {
      margin-top: var(--spacing-md);
    }

    /* Animations */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 1;
      }
      40% {
        transform: scale(1);
        opacity: 0.5;
      }
    }

    @keyframes dotPulse {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 575.98px) {
      .loading-indicator.centered {
        padding: var(--spacing-lg);
      }

      .spinner.large {
        width: 32px;
        height: 32px;
        border-width: 3px;
      }

      .loading-text {
        font-size: var(--font-size-xs);
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .spinner {
        border-top-color: var(--gray-900);
        border-color: var(--gray-400);
      }

      .spinner.pulse,
      .dot {
        background-color: var(--gray-900);
      }

      .loading-text {
        color: var(--gray-900);
        font-weight: 600;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .spinner,
      .spinner.pulse,
      .dot,
      .loading-indicator {
        animation: none;
      }

      .spinner {
        border-top-color: var(--primary-color);
        border-left-color: var(--primary-color);
      }

      .spinner.pulse,
      .dot {
        opacity: 0.7;
        transform: scale(1);
      }
    }

    /* Dark mode support (if implemented) */
    @media (prefers-color-scheme: dark) {
      .spinner {
        border-color: var(--gray-600);
        border-top-color: var(--primary-light);
      }

      .loading-text {
        color: var(--gray-300);
      }
    }
  `]
})
export class LoadingIndicatorComponent {
  @Input() show: boolean = true;
  @Input() text: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() inline: boolean = false;
  @Input() variant: 'spinner' | 'pulse' | 'dots' = 'spinner';
}