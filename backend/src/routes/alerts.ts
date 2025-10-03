import {Router } from "express";
import {createAlert,getAlerts,getHistoryForSymbol} from "../controllers/alertsController.js";

const router = Router();

// Create a new alert
router.post("/", createAlert);

// Get all alerts
router.get("/", getAlerts);

// Get alert history for a specific symbol
router.get("/history/:symbol", getHistoryForSymbol);

export default router;