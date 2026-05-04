// Best-effort video duration detection for the lesson Add/Edit forms.
// Strategy per source:
//   - YouTube: requires VITE_YOUTUBE_API_KEY in env. If missing, returns null.
//   - Vimeo:   uses public oEmbed (no key needed).
//   - .mp4 / direct file URL: loads it into a hidden <video> and reads duration.
// Anything we can't determine returns null so the caller leaves the field for manual entry.

const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

export const formatHHMMSS = (totalSeconds) => {
    const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
};

// Convert YouTube "PT1H2M3S" -> seconds. Missing parts default to 0.
const isoDurationToSeconds = (iso) => {
    const m = String(iso || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!m) return 0;
    return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
};

const youtubeIdFrom = (url) => {
    const u = String(url || '');
    const watch = u.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (watch) return watch[1];
    const short = u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (short) return short[1];
    const embed = u.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
    if (embed) return embed[1];
    return null;
};

const vimeoIdFrom = (url) => {
    const m = String(url || '').match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : null;
};

const isDirectVideoUrl = (url) => /\.(mp4|webm|ogg|m4v|mov)(\?|$)/i.test(String(url || ''));

const fetchYouTubeDuration = async (videoId) => {
    const key = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!key) return null;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const iso = data?.items?.[0]?.contentDetails?.duration;
    if (!iso) return null;
    return formatHHMMSS(isoDurationToSeconds(iso));
};

const fetchVimeoDuration = async (videoId) => {
    const oembed = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${videoId}`)}`;
    const res = await fetch(oembed);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Number.isFinite(data?.duration)) return null;
    return formatHHMMSS(data.duration);
};

const fetchDirectFileDuration = (url) =>
    new Promise((resolve) => {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.muted = true;
        v.crossOrigin = 'anonymous';

        const cleanup = () => {
            v.removeAttribute('src');
            try { v.load(); } catch { /* noop */ }
        };

        const timeoutId = setTimeout(() => { cleanup(); resolve(null); }, 8000);
        v.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            const seconds = v.duration;
            cleanup();
            if (!Number.isFinite(seconds) || seconds <= 0) return resolve(null);
            resolve(formatHHMMSS(seconds));
        };
        v.onerror = () => { clearTimeout(timeoutId); cleanup(); resolve(null); };
        v.src = url;
    });

// Returns "HH:MM:SS" or null if we couldn't determine it.
export const detectVideoDuration = async (url) => {
    if (!url) return null;
    try {
        const yt = youtubeIdFrom(url);
        if (yt) return await fetchYouTubeDuration(yt);

        const vm = vimeoIdFrom(url);
        if (vm) return await fetchVimeoDuration(vm);

        if (isDirectVideoUrl(url)) return await fetchDirectFileDuration(url);
    } catch {
        return null;
    }
    return null;
};

// Same as detectVideoDuration but reads a local File object (system video upload).
// Bypasses the URL-extension check since blob URLs don't carry an extension.
export const detectFileDuration = async (file) => {
    if (!file) return null;
    const blobUrl = URL.createObjectURL(file);
    try {
        return await fetchDirectFileDuration(blobUrl);
    } finally {
        URL.revokeObjectURL(blobUrl);
    }
};
