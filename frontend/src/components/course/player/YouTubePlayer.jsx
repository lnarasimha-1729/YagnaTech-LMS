import { useEffect, useRef } from 'react';

// Loads the YouTube IFrame Player API exactly once and resolves when `window.YT`
// is ready. Multiple players share the same script + the same ready promise.
let ytApiPromise = null;
const loadYouTubeApi = () => {
    if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (ytApiPromise) return ytApiPromise;

    ytApiPromise = new Promise((resolve) => {
        // The API calls this global once the script finishes loading. We chain
        // any pre-existing handler so we don't clobber another integration.
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            resolve(window.YT);
        };
        if (!document.getElementById('youtube-iframe-api')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-iframe-api';
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }
    });
    return ytApiPromise;
};

// Extract the 11-char video id from any YouTube URL shape (watch?v=, youtu.be/,
// /embed/). Returns '' if none found.
const youTubeIdFrom = (url) => {
    const u = String(url || '');
    const embed = u.match(/\/embed\/([A-Za-z0-9_-]{11})/);
    if (embed) return embed[1];
    const watch = u.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (watch) return watch[1];
    const short = u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (short) return short[1];
    const bare = u.match(/^([A-Za-z0-9_-]{11})$/);
    return bare ? bare[1] : '';
};

// Renders a YouTube video through the IFrame Player API so we can observe REAL
// playback. Unlike a plain <iframe>, this reports currentTime ONLY while the
// video is actually playing — so sitting on a paused video no longer advances
// the watched-seconds counter. Props:
//   - url: any YouTube URL (watch / youtu.be / embed)
//   - onTimeUpdate(seconds): called ~every 500ms while PLAYING with real time
//   - onEnded(): called when the video reaches the end
export default function YouTubePlayer({ url, title, onTimeUpdate, onEnded }) {
    const hostRef = useRef(null);
    const playerRef = useRef(null);
    const pollRef = useRef(null);
    // Keep latest callbacks in refs so the effect that builds the player runs
    // only when the video id changes — not on every parent re-render.
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onEndedRef = useRef(onEnded);
    onTimeUpdateRef.current = onTimeUpdate;
    onEndedRef.current = onEnded;

    const videoId = youTubeIdFrom(url);

    useEffect(() => {
        if (!videoId) return;
        let cancelled = false;

        const clearPoll = () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };

        // While PLAYING, push the real currentTime every 500ms. Stops on any
        // non-playing state so paused/buffering/ended time is never counted.
        const startPoll = () => {
            clearPoll();
            pollRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p || typeof p.getCurrentTime !== 'function') return;
                onTimeUpdateRef.current?.(p.getCurrentTime() || 0);
            }, 500);
        };

        loadYouTubeApi().then((YT) => {
            if (cancelled || !hostRef.current) return;
            playerRef.current = new YT.Player(hostRef.current, {
                videoId,
                playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
                events: {
                    onStateChange: (e) => {
                        if (e.data === YT.PlayerState.PLAYING) startPoll();
                        else clearPoll();
                        if (e.data === YT.PlayerState.ENDED) onEndedRef.current?.();
                    },
                },
            });
        });

        return () => {
            cancelled = true;
            clearPoll();
            // destroy() tears down the underlying iframe so navigating between
            // lessons doesn't leak players or keep polling a stale video.
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
            }
            playerRef.current = null;
        };
    }, [videoId]);

    if (!videoId) {
        return (
            <div className="aspect-video-shell bg-black/40 flex items-center justify-center text-white/60">
                Invalid YouTube URL
            </div>
        );
    }

    // YT.Player replaces this div with the generated <iframe>.
    return (
        <div className="aspect-video-shell">
            <div ref={hostRef} className="w-full h-full" title={title} />
        </div>
    );
}

export { youTubeIdFrom };
