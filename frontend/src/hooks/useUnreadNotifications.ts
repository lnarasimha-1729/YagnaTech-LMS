import { useEffect, useState } from "react";
import { getUnreadCount } from "@/api/notificationsFeed";

/**
 * Unread-notifications count for the bell / sidebar badge.
 *
 * Recomputes the derived feed and counts items not yet marked seen in
 * localStorage. Refreshes:
 *   - on mount
 *   - when the window regains focus (catches a class scheduled while away)
 *   - when the tab is shown again (visibilitychange)
 *
 * Opening the Notifications page calls markFeedSeen(), which on the next
 * refresh drops the count to 0.
 */
export function useUnreadNotifications(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      getUnreadCount().then((n) => {
        if (alive) setCount(n);
      });
    };

    refresh();

    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return count;
}
