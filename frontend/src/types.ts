// src/types.ts
export interface Alert {
  id: number;
  stock: string;
  alert_price: number;
  stock_price: number;
  alert_type: "rise" | "fall" | "pending";
  audio_url?: string; // optional audio URL
}
