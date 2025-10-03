// backend/src/services/realtime.ts

import Ably from "ably";
import type { Message } from "ably";
import dotenv from "dotenv";

dotenv.config();

/**
 * Ably API key setup
 */
const ABLY_KEY = process.env.ABLY_API_KEY ?? process.env.ABLY_KEY ?? "";

/**
 * Single global Ably client instance
 */
let ablyClient: Ably.Realtime | null = null;

if (ABLY_KEY) {
  ablyClient = new Ably.Realtime({ key: ABLY_KEY });
  console.log("✅ Ably client initialized");
} else {
  console.warn("⚠️ Ably API key not found. Publish/subscribe will be no-ops.");
}

/**
 * Publish a message to a channel (Promise-based API).
 *
 * @param channelName - Ably channel name
 * @param eventName   - Event/message name
 * @param data        - Data payload
 */
export async function publish(
  channelName: string,
  eventName: string,
  data: unknown
): Promise<void> {
  if (!ablyClient) {
    console.warn("Ably not initialized — skipping publish", {
      channelName,
      eventName,
    });
    return;
  }

  const channel = ablyClient.channels.get(channelName);

  try {
    await channel.publish(eventName, data);
    // Optional debug log
    // console.log(`📤 Published "${eventName}" to channel "${channelName}"`);
  } catch (err) {
    console.error(
      `❌ Ably publish error on ${channelName}/${eventName}:`,
      err
    );
    throw err;
  }
}

/**
 * Subscribe to messages from a channel.
 *
 * @param channelName - Ably channel name
 * @param onMessage   - Handler for incoming messages
 * @returns Unsubscribe function (call to stop listening)
 */
export function subscribe(
  channelName: string,
  onMessage: (message: Message) => void
): (() => void) | null {
  if (!ablyClient) {
    console.warn("Ably not initialized. Cannot subscribe:", channelName);
    return null;
  }

  const channel = ablyClient.channels.get(channelName);
  const handler = (msg: Message) => onMessage(msg);

  channel.subscribe(handler);

  return () => {
    try {
      channel.unsubscribe(handler);
    } catch {
      /* ignore unsubscribe errors */
    }
  };
}
