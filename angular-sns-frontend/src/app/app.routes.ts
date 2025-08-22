import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/subscribe',
    pathMatch: 'full'
  },
  {
    path: 'subscribe',
    loadComponent: () => import('./components/subscription.component').then(m => m.SubscriptionComponent),
    data: { preload: true } // Preload this critical route
  },
  {
    path: 'performance',
    loadComponent: () => import('./components/performance-dashboard.component').then(m => m.PerformanceDashboardComponent),
    data: { preload: false } // Lazy load performance dashboard
  },
  {
    path: '**',
    redirectTo: '/subscribe'
  }
];
