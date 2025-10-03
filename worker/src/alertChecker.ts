import type { Alert, AlertHistory } from "./types.js";
import { getAlerts, getLatestHistory, saveHistory, markAlertTriggered } from "./db.js";
import { fetchPrice } from "./priceFetcher.js";
import { notify } from "./notifier.js" ;


export async function checkAlerts(): Promise<void> {
  // 1) Get active alerts from the database
  const alerts: Alert[] = await getAlerts();

  // if no alerts to process, exit early
  if (!alerts || alerts.length === 0) return;

  // Optional delay between price fetches to respect rate limits.
  // Configure PRICE_FETCH_DELAY_MS in worker .env (default 0).
  const DELAY_MS = Number(process.env.PRICE_FETCH_DELAY_MS ?? 0);

  // Process alerts sequentially (safer for rate-limited APIs)
  for (const alert of alerts) {
    // normalize fields
    const alertId = alert._id ? String(alert._id) : undefined;
    const symbol = alert.symbol;
    const targetPrice = Number(alert.targetPrice);

    try {
      // 2.a) Fetch current live price for the symbol
      const currentPrice = await fetchPrice(symbol);

      // 2.b) Load previous history (latest saved price) if any
      const previousHistory = await getLatestHistory(symbol);
      const previousPrice: number | null = previousHistory ? Number(previousHistory.currentPrice) : null;

      // 2.c) Decide status: "rise", "fall", or "stable"
      // If we have a previous price, compare current vs previous to get movement.
      // If we don't have a previous price, fall back to comparing current vs target.
      let status: "rise" | "fall" | "stable";
      if (previousPrice === null) {
        if (currentPrice > targetPrice) status = "rise";
        else if (currentPrice < targetPrice) status = "fall";
        else status = "stable";
      } else {
        if (currentPrice > previousPrice) status = "rise";
        else if (currentPrice < previousPrice) status = "fall";
        else status = "stable";
      }
     const alertId = alert._id ? String(alert._id) : ""; // always string
      // 2.d) Save the check into history (so next run has previousPrice)
      const historyRecord: AlertHistory = {
        alertId: alertId,
        symbol,
        targetPrice,
        currentPrice,
        status,
        checkedAt: new Date(),
      };
      await saveHistory(historyRecord);

      // 2.e) Crossing detection (core alert trigger logic)
      // Only detect crossing if we have a previousPrice to compare against.
      // Upward cross: previous < target && current >= target
      // Downward cross: previous > target && current <= target
      let crossed = false;
      let crossDirection: "up" | "down" | null = null;

      if (previousPrice !== null) {
        if (previousPrice < targetPrice && currentPrice >= targetPrice) {
          crossed = true;
          crossDirection = "up";
        } else if (previousPrice > targetPrice && currentPrice <= targetPrice) {
          crossed = true;
          crossDirection = "down";
        }
      }

      // 2.f) If crossing detected: mark alert triggered and notify frontend
      if (crossed) {
        // mark the alert as triggered in DB so it won't be checked again
        if (alertId) {
          await markAlertTriggered(alertId, { status, updatedAt: new Date() } as Partial<Alert>);
        }

        // build notification payload (compact and serializable)
        const payload = {
          alertId,
          symbol,
          targetPrice,
          prevPrice: previousPrice,
          currentPrice,
          status,
          direction: crossDirection,
          triggeredAt: new Date().toISOString(),
        };

        // send payload to notifier (notifier should handle delivery to frontend and optionally audio)
        try {
        await notify("alerts", payload);
        } catch (notifyErr) {
          // don't crash worker loop if notify fails — log and continue
          console.error(`[ALERT CHECKER] notify failed for ${symbol}`, notifyErr);
        }
      }

      // 2.g) Rate limit delay between symbols (if configured)
      if (DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    } catch (err) {
      // per-alert error handling: log error and continue with next alert
      console.error(`[ALERT CHECKER] error processing ${symbol}:`, err);
    }
  }
}
