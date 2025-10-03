export interface Alert {
  _id?: string;
  symbol: string;
  targetPrice: number;
  status?: "rise" | "fall" | "stable" | string;
  triggered?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AlertHistory {
  _id?: string;
  alertId?: string;
  symbol: string;
  targetPrice: number;
  currentPrice: number;
  status: "rise" | "fall" | "stable";
  checkedAt: string | Date;
  createdAt?: string | Date;
}

export interface NotificationPayload {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  status: "rise" | "fall" | "stable";
  prevPrice?: number | null;
  triggeredAt?: string | Date;
  historyId?: string;
}
