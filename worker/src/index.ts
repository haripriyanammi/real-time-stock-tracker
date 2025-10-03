// worker/src/index.ts
import dotenv from "dotenv";
dotenv.config();

import { checkAlerts } from "./alertChecker.js";


const POLL_INTERVAL_SECONDS = Number(process.env.POLL_INTERVAL ?? "30");
const WORKER_NAME = process.env.WORKER_NAME ?? "price-worker";

let timer: NodeJS.Timeout | null = null;

async function runOnce(): Promise<void> {
  try {
    console.log(`[${WORKER_NAME}] runOnce - starting check cycle`);
    await checkAlerts();
    console.log(`[${WORKER_NAME}] runOnce - finished check cycle`);
  } catch (err) {
    console.error(`[${WORKER_NAME}] runOnce - error during check cycle:`, err);
  }
}

function start(): void {
  console.log(`[${WORKER_NAME}] starting. poll interval = ${POLL_INTERVAL_SECONDS}s`);
  // run immediately, then schedule repeated runs
  void runOnce();
  timer = setInterval(() => void runOnce(), POLL_INTERVAL_SECONDS * 1000);
}

function shutdown(signal?: string): void {
  console.log(`[${WORKER_NAME}] received shutdown${signal ? ` (${signal})` : ""} — stopping worker`);
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  // allow any pending logs to flush, then exit
  setTimeout(() => {
    console.log(`[${WORKER_NAME}] shutdown complete`);
    process.exit(0);
  }, 100);
}

/* graceful handlers */
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error(`[${WORKER_NAME}] uncaughtException`, err);
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error(`[${WORKER_NAME}] unhandledRejection`, reason);
});

/* start worker */
start();
