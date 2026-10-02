import { useEffect, useRef } from "react";

export default function useAdminPolling(refresh, intervalMs = 15000) {
  const refreshRef = useRef(refresh);
  const inFlightRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState === "hidden" || inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await refreshRef.current();
      } finally {
        inFlightRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") poll();
    };

    const timer = window.setInterval(poll, intervalMs);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs]);
}
