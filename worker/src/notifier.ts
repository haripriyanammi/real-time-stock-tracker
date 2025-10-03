import Ably from "ably";

const client = new Ably.Realtime(process.env.ABLY_API_KEY!);

export async function notify(channelName: string, message: any): Promise<void> {
  const channel = client.channels.get(channelName);
  await channel.publish("alert-created", message);
  console.log(`[Notifier] Published to ${channelName}:`, message);
}
