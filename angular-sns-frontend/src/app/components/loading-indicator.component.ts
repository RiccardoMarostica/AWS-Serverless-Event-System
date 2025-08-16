import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-indicator" [class.inline]="inline" *ngIf="show">
      <div class="spinner" [class.small]="size === 'small'" [class.large]="size === 'large'"></div>
      <span class="loading-text" *ngIf="text">{{ text }}</span>
    </div>
  `,
  styles: [`
    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
    }

    .loading-indicator.inline {
      display: inline-flex;
      padding: 0;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner.small {
      width: 16px;
      height: 16px;
      border-width: 2px;
    }

    .spinner.large {
      width: 32px;
      height: 32px;
      border-width: 4px;
    }

    .loading-text {
      color: #666;
      font-size: 0.9rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoadingIndicatorComponent {
  @Input() show: boolean = true;
  @Input() text: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() inline: boolean = false;
}