export interface SubscriptionRequest {
  email: string;
}

export interface SubscriptionResponse {
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export enum SubscriptionStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface SubscriptionState {
  status: SubscriptionStatus;
  message?: string;
  error?: string;
}