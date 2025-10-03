// worker/src/db.ts
import dotenv from "dotenv";
import mongoose from "mongoose";
import type { Alert, AlertHistory } from "./types.js";

dotenv.config();

// Read and validate env var immediately (fail fast)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is required in worker/.env");
}

/** Ensure a mongoose connection (idempotent) */
export async function connect(): Promise<void> {
  if (mongoose.connection.readyState === 1) return; // already connected
  // We validated MONGO_URI above, so this cast is safe
  await mongoose.connect(MONGO_URI as string, {
    // options are optional; kept minimal and explicit
    autoCreate: true,
    autoIndex: false,
  } as mongoose.ConnectOptions);
}

/** Schemas */
const AlertSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    status: { type: String },
    triggered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const HistorySchema = new mongoose.Schema(
  {
    alertId: { type: mongoose.Schema.Types.ObjectId, required: false },
    symbol: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    status: { type: String, required: true },
    checkedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

/** Models (guard against re-declaring models in watch/hot-reload) */
const AlertModel =
  (mongoose.models.Alert as mongoose.Model<any>) ||
  mongoose.model("Alert", AlertSchema);
const HistoryModel =
  (mongoose.models.History as mongoose.Model<any>) ||
  mongoose.model("History", HistorySchema);

/** Get all active (non-triggered) alerts */
export async function getAlerts(): Promise<Alert[]> {
  await connect();
  const docs = await AlertModel.find({ triggered: { $ne: true } }).lean().exec();
  // cast via unknown to satisfy strict TS checks (we ensure shapes match at runtime)
  return docs as unknown as Alert[];
}

/** Save a history record */
export async function saveHistory(history: AlertHistory): Promise<void> {
  await connect();
  await HistoryModel.create({
    alertId: history.alertId ?? undefined,
    symbol: history.symbol,
    targetPrice: history.targetPrice,
    currentPrice: history.currentPrice,
    status: history.status,
    checkedAt: history.checkedAt ? new Date(history.checkedAt) : new Date(),
  });
}

/** Get the most recent history record for a symbol (or null) */
export async function getLatestHistory(symbol: string): Promise<AlertHistory | null> {
  await connect();
  const doc = await HistoryModel.findOne({ symbol }).sort({ checkedAt: -1 }).lean().exec();
  return doc ? (doc as unknown as AlertHistory) : null;
}

/** Mark an alert as triggered */
export async function markAlertTriggered(alertId: string, payload?: Partial<Alert>): Promise<void> {
  await connect();
  if (!alertId) return;
  await AlertModel.findByIdAndUpdate(alertId, { triggered: true, ...(payload ?? {}) }).exec();
}
