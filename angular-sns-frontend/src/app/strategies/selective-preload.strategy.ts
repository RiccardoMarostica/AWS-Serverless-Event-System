import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Preload routes marked with preload: true in route data
    if (route.data && route.data['preload']) {
      console.log('Preloading route:', route.path);
      return load();
    }
    
    // Don't preload other routes
    return of(null);
  }
}