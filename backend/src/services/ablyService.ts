import Ably from "ably";
import dotenv from "dotenv";

dotenv.config();

const ABLY_KEY = process.env.ABLY_API_KEY;
if (!ABLY_KEY) {
  throw new Error("ABLY_API_KEY is missing in environment variables");
}

const ablyClient = new Ably.Realtime({ key: ABLY_KEY });

// a channel for alerts
const channel = ablyClient.channels.get("alerts");

// publish an update to the channel
export const publishAlert = (symbol: string, payload: any) => {
  // publish event name frontend subscribes to
  channel.publish("alert-created", payload);
};


// publish a system message to the channel (optional)
export const publishSystemMessage = (message: string) => {
  channel.publish("system", { message });
};

export { ablyClient, channel };
