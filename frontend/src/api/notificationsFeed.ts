/**
 * Notifications feed — shared aggregation + unread tracking.
 *
 * There is no notifications backend. The feed is built client-side from
 * existing student-flow data (assessments, program request, live classes,
 * certificates). This module is the single source of truth used by BOTH:
 *   - NotificationsPage  — renders the full feed
 *   - the bell badge     — needs only the unread count
 *
 * "Unread" is tracked in localStorage: each feed item has a stable id; the
 * ids the student has already seen are stored, and unread = feed ids not in
 * that set. Opening the Notifications page marks every current id seen.
 * This is per-device (localStorage), not synced across devices.
 */

import { getProfile } from "./authApi";
import { getMyProgramRequest } from "./programRequestApi";
import { getUserProgress } from "./userProgressApi";
import { listMyCertificates } from "./course/courseApi";
import { listLiveClasses } from "@/zoom-live-class/player/liveClassApi";

// Pass mark — kept in sync with Programspage.tsx / Assesments.jsx.
export const PASS_THRESHOLD = 50;

export type Severity = "success" | "warning" | "info";

export interface FeedItem {
  id: string;
  iconKey: "pass" | "fail" | "mail" | "video" | "award";
  severity: Severity;
  title: string;
  body?: string;
  when?: string; // ISO date, optional
  link?: string; // optional in-app destination
}

// localStorage key for the per-user set of seen feed-item ids. Scoped by the
// student's userId so two accounts on one browser don't share seen-state.
const seenKey = () => {
  const uid = localStorage.getItem("userId") || "anon";
  return `notif_seen_${uid}`;
};

const readSeen = (): Set<string> => {
  try {
    const raw = localStorage.getItem(seenKey());
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
};

const writeSeen = (ids: string[]) => {
  try {
    localStorage.setItem(seenKey(), JSON.stringify([...new Set(ids)]));
  } catch {
    /* storage full / disabled — non-fatal */
  }
};

/**
 * Build the notifications feed by aggregating existing student-flow data.
 * Each source is fetched independently; a failing source is skipped so the
 * feed degrades gracefully rather than going blank.
 */
export async function buildFeed(): Promise<FeedItem[]> {
  const feed: FeedItem[] = [];

  // 1. Pre / post-assessment — only once actually TAKEN (score != null).
  try {
    const res = await getProfile();
    const data: any = res?.data ?? {};

    if (data.preScore != null) {
      const pre = Number(data.preScore);
      const passed = pre >= PASS_THRESHOLD;
      feed.push({
        id: "pre-assessment",
        iconKey: passed ? "pass" : "fail",
        severity: passed ? "success" : "warning",
        title: passed ? "Pre-assessment passed" : "Pre-assessment not passed yet",
        body: passed
          ? `You scored ${pre}% — programs are now unlocked. Head to My Courses to begin.`
          : `You scored ${pre}%. Retake the pre-assessment to unlock programs.`,
      });
    }
    if (data.postScore != null) {
      const post = Number(data.postScore);
      const passed = post >= PASS_THRESHOLD;
      feed.push({
        id: "post-assessment",
        iconKey: passed ? "pass" : "fail",
        severity: passed ? "success" : "warning",
        title: passed ? "Post-assessment passed" : "Post-assessment not passed yet",
        body: passed
          ? `You scored ${post}% — you're eligible for your certificate.`
          : `You scored ${post}%. Pass the post-assessment to earn your certificate.`,
      });
    }
  } catch {
    /* skip assessment section */
  }

  // 2. Program request received.
  try {
    const request: any = await getMyProgramRequest();
    if (request && request.program) {
      feed.push({
        id: `program-request-${request.id ?? "x"}`,
        iconKey: "mail",
        severity: "info",
        title: "Program invitation received",
        body: `An admin invited you to "${request.program}". Open My Courses to accept or decline.`,
        when: request.created_at,
        link: "/dashboard?tab=courses",
      });
    }
  } catch {
    /* skip program-request section */
  }

  // 3. Live classes scheduled on enrolled courses (upcoming/live only).
  try {
    const progress: any = await getUserProgress();
    const rows: any[] = progress?.rows ?? [];
    const courseIds = [
      ...new Set(
        rows.filter((r) => r.enrolled && r.course_id).map((r) => r.course_id)
      ),
    ];
    const perCourse = await Promise.all(
      courseIds.map((cid) =>
        listLiveClasses(cid)
          .then((r: any) => r.live_classes || [])
          .catch(() => [])
      )
    );
    for (const list of perCourse) {
      for (const lc of list) {
        if (lc.status === "completed" || lc.status === "finished") continue;
        feed.push({
          id: `live-class-${lc.id}`,
          iconKey: "video",
          severity: "info",
          title: "Live class scheduled",
          body:
            `"${lc.class_topic}"` +
            (lc.host?.name ? ` with ${lc.host.name}` : "") +
            ". Join from the course player's Live class tab.",
          when: lc.class_date_and_time,
        });
      }
    }
  } catch {
    /* skip live-class section */
  }

  // 4. Certificates earned.
  try {
    const res: any = await listMyCertificates();
    const certs: any[] = res?.certificates ?? [];
    for (const c of certs) {
      feed.push({
        id: `certificate-${c.id ?? c.identifier}`,
        iconKey: "award",
        severity: "success",
        title: "Certificate earned",
        body: `You earned a certificate${
          c.course?.title ? ` for "${c.course.title}"` : ""
        }.`,
        when: c.created_at,
        link: "/dashboard?tab=certificates",
      });
    }
  } catch {
    /* skip certificate section */
  }

  // Newest first when a date is known; undated items keep insertion order.
  feed.sort((a, b) => {
    const ta = a.when ? new Date(a.when).getTime() : 0;
    const tb = b.when ? new Date(b.when).getTime() : 0;
    return tb - ta;
  });
  return feed;
}

/** Number of feed items the student hasn't seen yet. */
export async function getUnreadCount(): Promise<number> {
  try {
    const feed = await buildFeed();
    const seen = readSeen();
    return feed.filter((f) => !seen.has(f.id)).length;
  } catch {
    return 0;
  }
}

/** Mark every id in the given feed as seen — called when the page is opened. */
export function markFeedSeen(feed: FeedItem[]): void {
  writeSeen(feed.map((f) => f.id));
}

/** True if an item id has already been seen — for per-row "new" styling. */
export function isSeen(id: string): boolean {
  return readSeen().has(id);
}
