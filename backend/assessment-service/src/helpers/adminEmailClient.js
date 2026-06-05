// Thin client around admin-service's POST /api/internal/email/enqueue. The
// queue + SMTP transport live in admin-service; this service only needs to
// fire-and-forget the request from the registration controller.
//
// Behavior is deliberately tolerant: an empty config, a 5xx response, a
// timeout — none of these block or fail the caller. The registration must
// succeed regardless of email side-channel health.

const REQUEST_TIMEOUT_MS = 5_000;

// Returns a promise that resolves regardless of outcome — callers should not
// await this from within a critical path. Logs are best-effort.
export async function enqueueEmail({ template, data, to, userId, batchId }) {
    // Default to the Docker Compose service name (admin-service listens on 8007
    // internally), NOT localhost — under Docker, localhost is THIS container, so
    // an unset ADMIN_SERVICE_URL would silently drop every email. Warn on
    // fallback so misconfiguration surfaces in logs instead of vanishing.
    let adminUrl = (process.env.ADMIN_SERVICE_URL || '').replace(/\/+$/, '');
    if (!adminUrl) {
        adminUrl = 'http://admin-service:8007';
        console.warn(`[admin-email] ADMIN_SERVICE_URL unset — defaulting to ${adminUrl}`);
    }
    const secret = process.env.INTERNAL_API_SECRET || '';
    if (!secret) {
        console.warn('[admin-email] INTERNAL_API_SECRET unset — skipping email enqueue');
        return;
    }
    if (!template || !to) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(`${adminUrl}/api/internal/email/enqueue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Secret': secret,
            },
            body: JSON.stringify({ template, data, to, userId, batchId }),
            signal: controller.signal,
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.warn(`[admin-email] enqueue ${template} → ${res.status}: ${text.slice(0, 200)}`);
        }
    } catch (err) {
        // AbortError on timeout, network errors when admin-service is down,
        // etc. All are non-fatal here — the registration already saved.
        console.warn(`[admin-email] enqueue ${template} failed: ${err.message}`);
    } finally {
        clearTimeout(timer);
    }
}
