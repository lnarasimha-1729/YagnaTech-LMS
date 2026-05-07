import { useEffect } from 'react';

export default function PreviewModal({ src, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    if (!src) return null;
    const isYouTube = /youtu/.test(src);
    const isVimeo = /vimeo/.test(src);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
            <div className="w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="aspect-video-shell">
                    {isYouTube ? (
                        <iframe
                            src={src}
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            className="w-full h-full"
                            title="Preview"
                        />
                    ) : isVimeo ? (
                        <iframe
                            src={src}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            className="w-full h-full"
                            title="Preview"
                        />
                    ) : (
                        <video src={src} controls autoPlay className="w-full h-full bg-black" />
                    )}
                </div>
                <button
                    type="button"
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white text-xl leading-none flex items-center justify-center"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
