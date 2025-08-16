import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="subscription-container">
      <h2>Subscribe to Event Notifications</h2>
      <p>Subscription form will be implemented in a future task.</p>
    </div>
  `,
  styles: [`
    .subscription-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
      text-align: center;
    }

    h2 {
      color: #333;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      font-size: 1rem;
    }
  `]
})
export class SubscriptionComponent {
}