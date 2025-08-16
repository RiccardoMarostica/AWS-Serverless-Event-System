import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/subscribe',
    pathMatch: 'full'
  },
  {
    path: 'subscribe',
    loadComponent: () => import('./components/subscription.component').then(m => m.SubscriptionComponent)
  },
  {
    path: '**',
    redirectTo: '/subscribe'
  }
];
