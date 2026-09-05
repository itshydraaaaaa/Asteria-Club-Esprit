"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionState =
  | "CONNECTING"
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CHANNEL_ERROR"
  | "CLOSED"
  | "OFFLINE";

interface UseRealtimeOptions {
  channelName: string;
  table: string;
  broadcastEvent?: string;
  onUpdate: () => void;
  pollingFallbackMs?: number;
}

export function useRealtimeSubscription({
  channelName,
  table,
  broadcastEvent,
  onUpdate,
  pollingFallbackMs = 15000,
}: UseRealtimeOptions) {
  const [status, setStatus] = useState<ConnectionState>("CONNECTING");
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const startPollingFallback = () => {
      if (pollingIntervalRef.current) return;
      pollingIntervalRef.current = setInterval(() => {
        if (isMounted && navigator.onLine) {
          onUpdateRef.current();
        }
      }, pollingFallbackMs);
    };

    const stopPollingFallback = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    const subscribeChannel = () => {
      if (!isMounted) return;

      if (!navigator.onLine) {
        setStatus("OFFLINE");
        return;
      }

      setStatus("CONNECTING");

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Add timestamp to channel name to ensure isolation across reconnects
      const channel = supabase.channel(`${channelName}_${Date.now()}`);
      channelRef.current = channel;

      channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            if (isMounted) onUpdateRef.current();
          }
        );

      if (broadcastEvent) {
        channel.on("broadcast", { event: broadcastEvent }, () => {
          if (isMounted) onUpdateRef.current();
        });
      }

      channel.subscribe((subscriptionStatus) => {
        if (!isMounted) return;

        switch (subscriptionStatus) {
          case "SUBSCRIBED":
            setStatus("SUBSCRIBED");
            retryCountRef.current = 0;
            stopPollingFallback();
            break;

          case "TIMED_OUT":
            setStatus("TIMED_OUT");
            scheduleRetry();
            break;

          case "CHANNEL_ERROR":
            setStatus("CHANNEL_ERROR");
            scheduleRetry();
            break;

          case "CLOSED":
            setStatus("CLOSED");
            break;
        }
      });
    };

    const scheduleRetry = () => {
      if (!isMounted) return;

      if (retryCountRef.current < 3) {
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        retryCountRef.current += 1;
        retryTimeoutRef.current = setTimeout(() => {
          if (isMounted) subscribeChannel();
        }, delay);
      } else {
        // Fall back to HTTP polling if WebSocket fails repeatedly
        startPollingFallback();
      }
    };

    const handleOnline = () => {
      if (!isMounted) return;
      retryCountRef.current = 0;
      onUpdateRef.current();
      subscribeChannel();
    };

    const handleOffline = () => {
      if (!isMounted) return;
      setStatus("OFFLINE");
      stopPollingFallback();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    subscribeChannel();

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      stopPollingFallback();

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, table, broadcastEvent, pollingFallbackMs]);

  return { status };
}
