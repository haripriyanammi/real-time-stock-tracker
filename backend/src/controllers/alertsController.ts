import type { Request, Response } from "express";
import mongoose from "mongoose";

import { getCurrentPrice } from "../services/priceServices.js";
import Stock from "../models/stocks.js";
import { publishAlert } from "../services/ablyService.js";
import { generateVoiceAlert } from "../services/voiceServices.js"; // ✅ Step 1: Import voice service

// Simple history model - stores individual price checks for a symbol.
const AlertHistorySchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true },
    checkedAt: { type: Date, default: () => new Date() },
    currentprice: { type: Number, required: true },
    targetprice: { type: Number, required: true },
    status: { type: String, enum: ["rise", "fall", "stable"], required: true },
    alertId: { type: mongoose.Schema.Types.ObjectId, required: false }, // reference to saved alert if any
  },
  { timestamps: false }
);

const AlertHistory =
  (mongoose.models.AlertHistory as mongoose.Model<any>) ||
  mongoose.model("AlertHistory", AlertHistorySchema);

/**
 * Create a new alert:
 * - validate input
 * - fetch live price
 * - decide status
 * - save alert (Stock model)
 * - record the check in AlertHistory
 * - generate voice alert + upload to S3
 * - publish to Ably (publishAlert)
 */
export const createAlert = async (req: Request, res: Response) => {
  try {
    // 1) Extract + validate
    const { symbol: rawSymbol, targetprice } = req.body;

    if (!rawSymbol || typeof rawSymbol !== "string") {
      return res
        .status(400)
        .json({ error: "symbol is required and must be a string" });
    }
    const symbol = rawSymbol.trim().toUpperCase();

    const tp = Number(targetprice);
    if (Number.isNaN(tp)) {
      return res
        .status(400)
        .json({ error: "targetprice is required and must be a number" });
    }

    // 2) Fetch live price
    const currentprice = await getCurrentPrice(symbol);
    if (typeof currentprice !== "number" || Number.isNaN(currentprice)) {
      return res.status(502).json({ error: "Failed to fetch current price" });
    }

    // 3) Decide status
    let status: "rise" | "fall" | "stable";
    if (currentprice > tp) status = "rise";
    else if (currentprice < tp) status = "fall";
    else status = "stable";

    // 4) Save alert to DB (reuse Stock model as alert record)
    let audioUrl: string | null = null; // ✅ declare first

    const newAlert = new Stock({
      symbol,
      targetprice: tp,
      currentprice,
      status,
      audio_url: audioUrl, // placeholder (null at first)
    });

    await newAlert.save();

    // 5) Record history
    try {
      await AlertHistory.create({
        symbol,
        currentprice,
        targetprice: tp,
        status,
        alertId: newAlert._id,
      });
    } catch (histErr) {
      console.warn("Failed to write alert history:", histErr);
    }

    // 6) Generate voice alert
    try {
      const rawMessage = `Stock ${symbol} is currently at ${currentprice}, compared to your target ${tp}. It is a ${status} alert.`;
      const { audioUrl: generatedUrl } = await generateVoiceAlert(
        rawMessage,
        symbol
      );
      audioUrl = generatedUrl;

      // Save audioUrl into DB
      (newAlert as any).audio_url = audioUrl;
      await newAlert.save();
    } catch (voiceErr) {
      console.error("Voice generation failed:", voiceErr);
    }

    // 7) Prepare payload
    const payload = {
      id: (newAlert._id as mongoose.Types.ObjectId).toString(),
      stock: symbol,
      alert_price: tp,
      stock_price: currentprice,
      alert_type: status,
      audio_url: audioUrl,
      createdAt: newAlert.createdAt ?? new Date(),
    };

    // 8) Publish via Ably
    publishAlert(symbol, payload);

    // 9) Respond
    return res.status(201).json({
      message: "Alert created successfully",
      alert: payload,
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all alerts (simple)
 */
export const getAlerts = async (_req: Request, res: Response) => {
  try {
    const alerts = await Stock.find().sort({ createdAt: -1 });
    return res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * (Bonus) Optional: endpoint to get history for a symbol
 */
export const getHistoryForSymbol = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    if (!symbol) return res.status(400).json({ error: "symbol required" });

    const history = await AlertHistory.find({
      symbol: symbol.toUpperCase(),
    }).sort({ checkedAt: -1 });

    return res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
