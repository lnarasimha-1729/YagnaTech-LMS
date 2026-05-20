import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Video,
  Award,
} from "lucide-react";
import {
  buildFeed,
  markFeedSeen,
  isSeen,
  type FeedItem,
} from "@/api/notificationsFeed";

/**
 * Notifications page — body of the dashboard's Notifications view
 * (reached via the header bell and the sidebar "Notifications" button).
 *
 * The feed is built by @/api/notificationsFeed (shared with the bell badge).
 * Opening this page marks every current item "seen", which clears the unread
 * count on the bell + sidebar button.
 */

type Severity = "success" | "warning" | "info";

const ICON = {
  pass: CheckCircle2,
  fail: AlertTriangle,
  mail: Mail,
  video: Video,
  award: Award,
} as const;

const SEVERITY_RING: Record<Severity, string> = {
  success: "bg-green-50 text-green-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-sky-50 text-sky-600",
};

const fmt = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Snapshot of which items were unseen WHEN the page opened — used so the
  // "New" tag still shows on this visit even though we mark them seen on load.
  const [unseenAtOpen, setUnseenAtOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    (async () => {
      const feed = await buildFeed();
      if (!alive) return;
      // Capture which were unseen before we mark them, so the badge clears
      // but this visit still highlights what was new.
      setUnseenAtOpen(new Set(feed.filter((f) => !isSeen(f.id)).map((f) => f.id)));
      setItems(feed);
      setLoading(false);
      // Opening the page = the student has now seen everything → clears the
      // unread badge on the bell and the sidebar button.
      markFeedSeen(feed);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          Loading your updates…
        </p>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <Bell className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No notifications yet
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Updates about your assessments, courses, live classes, and
            certificates will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((n) => {
            const Icon = ICON[n.iconKey];
            const isNew = unseenAtOpen.has(n.id);
            const clickable = Boolean(n.link);
            return (
              <li
                key={n.id}
                onClick={n.link ? () => navigate(n.link as string) : undefined}
                className={`flex items-start gap-3 py-4 ${
                  clickable ? "cursor-pointer hover:bg-gray-50" : ""
                } ${isNew ? "bg-green-50/40" : ""} ${
                  clickable || isNew ? "-mx-6 px-6" : ""
                }`}
              >
                <span
                  className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    SEVERITY_RING[n.severity]
                  }`}
                  aria-hidden
                >
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 m-0 flex items-center gap-2">
                    {n.title}
                    {isNew && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-green-600 text-white rounded px-1.5 py-0.5">
                        New
                      </span>
                    )}
                  </p>
                  {n.body && (
                    <p className="text-sm text-gray-600 mt-0.5 m-0">{n.body}</p>
                  )}
                  {n.when && (
                    <p className="text-xs text-gray-400 mt-1 m-0">
                      {fmt(n.when)}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
