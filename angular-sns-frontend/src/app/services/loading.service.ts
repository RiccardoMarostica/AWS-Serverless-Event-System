import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCountSubject = new BehaviorSubject<number>(0);

  /**
   * Observable that emits the current loading state
   */
  public readonly isLoading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Observable that emits the current loading count (for multiple concurrent operations)
   */
  public readonly loadingCount$: Observable<number> = this.loadingCountSubject.asObservable();

  /**
   * Set the loading state
   * @param loading - Whether the application is in a loading state
   */
  setLoading(loading: boolean): void {
    const currentCount = this.loadingCountSubject.value;
    
    if (loading) {
      const newCount = currentCount + 1;
      this.loadingCountSubject.next(newCount);
      this.loadingSubject.next(true);
    } else {
      const newCount = Math.max(0, currentCount - 1);
      this.loadingCountSubject.next(newCount);
      this.loadingSubject.next(newCount > 0);
    }
  }

  /**
   * Get the current loading state
   * @returns Current loading state
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Reset loading state to false
   */
  resetLoading(): void {
    this.loadingCountSubject.next(0);
    this.loadingSubject.next(false);
  }

  /**
   * Show loading for a specific operation
   * @returns Function to hide loading for this operation
   */
  showLoading(): () => void {
    this.setLoading(true);
    return () => this.setLoading(false);
  }
}