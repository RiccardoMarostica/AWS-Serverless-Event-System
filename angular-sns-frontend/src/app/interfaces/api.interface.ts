export interface SubscriptionRequest {
  email: string;
}

export interface SubscriptionResponse {
  message: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}