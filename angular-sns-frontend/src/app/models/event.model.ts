export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
}

export interface EventResponse {
  events: Event[];
  total: number;
}