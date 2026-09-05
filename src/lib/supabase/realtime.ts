import { getAdminClient } from "./admin";

export async function broadcastRealtime(channelName: string, eventName: string, payload: any = {}) {
  try {
    const supabase = getAdminClient();
    const channel = supabase.channel(channelName);
    await channel.send({
      type: "broadcast",
      event: eventName,
      payload,
    });
    await supabase.removeChannel(channel);
  } catch (error) {
    console.warn(`[Realtime Broadcast] Channel ${channelName} failed:`, error);
  }
}
