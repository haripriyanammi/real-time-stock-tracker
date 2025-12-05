import express from "express";
import cors from "cors";//for react to call backend
import dotenv from "dotenv";
import mongoose from "mongoose";
import Ably from "ably";
import alertsRouter from "./routes/alerts.js";
// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/stocks";
const ABLY_KEY = process.env.ABLY_API_KEY ?? "";

const app = express();//starts the backend

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/alerts", alertsRouter);


// MongoDB connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // exit if DB fails
  });

// Ably realtime client
let ablyClient: Ably.Realtime | null = null;

if (ABLY_KEY) {
  ablyClient = new Ably.Realtime({ key: ABLY_KEY });

  ablyClient.connection.on("connected", () =>
    console.log("✅ Connected to Ably")
  );
  ablyClient.connection.on("failed", (err) =>
    console.error("❌ Ably connection failed:", err)
  );
} else {
  console.error(
    "⚠️ Ably API key is not set. Real-time features will be disabled."
  );
}

// Root route (fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.send("🚀 Server is running. Use /api/health for status.");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    ably: Boolean(ablyClient),
    db: mongoose.connection.readyState === 1 ? "connected" : "not ready",
  });
});

/*Alerts placeholder endpoint
//app.use("/api/alerts", (req, res) => {
  //res.status(501).json({ error: "Alerts API not implemented yet" });
});*/

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT} (PORT: ${PORT})`);
});

export { app, ablyClient };
