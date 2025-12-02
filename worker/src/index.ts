
import dotenv from "dotenv";
import { checkAlerts } from "./alertChecker.js"; // main work function (one cycle)

dotenv.config();

// Config: poll interval in seconds (default 30s)
const POLL_INTERVAL_SECONDS = Number(process.env.POLL_INTERVAL_SECONDS ?? 30);
const WORKER_NAME = process.env.WORKER_NAME ?? "price-worker";

let timer: NodeJS.Timeout | null = null;

/**
 * runOnce
 * Perform a single check cycle by calling checkAlerts() and catching errors.
 */
async function runOnce(): Promise<void> {
  try {
    console.log(`[${WORKER_NAME}] runOnce - starting check cycle`);
    await checkAlerts();
    console.log(`[${WORKER_NAME}] runOnce - finished check cycle`);
  } catch (err) {
    console.error(`[${WORKER_NAME}] runOnce - error during check cycle:`, err);
  }
}

/**
 * start
 * Immediately run one check and then schedule recurring runs using setInterval.
 */
function start(): void {
  console.log(`[${WORKER_NAME}] starting. poll interval = ${POLL_INTERVAL_SECONDS}s`);
  // Run immediately (don't await here so startup is not blocked)
  void runOnce();

  // Schedule repeated runs
  timer = setInterval(() => {
    // use void to intentionally ignore returned promise
    void runOnce();
  }, POLL_INTERVAL_SECONDS * 1000);
}

/**
 * shutdown
 * Stop the interval and exit cleanly. Optionally accepts a signal name for logging.
 */
function shutdown(signal?: string): void {
  console.log(
    `[${WORKER_NAME}] received shutdown${signal ? ` (${signal})` : ""} — stopping worker`
  );

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  // short delay to allow logs/IO flush
  setTimeout(() => {
    console.log(`[${WORKER_NAME}] shutdown complete`);
    process.exit(0);
  }, 100);
}

// handle signals for graceful shutdown
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// handle unexpected errors: log and shutdown
process.on("uncaughtException", (err) => {
  console.error(`[${WORKER_NAME}] uncaughtException`, err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error(`[${WORKER_NAME}] unhandledRejection`, reason);
});

// start the worker loop
start();
