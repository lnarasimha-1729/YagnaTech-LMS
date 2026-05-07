export const fmtDuration = (totalSecs = 0) => {
    if (!totalSecs || totalSecs <= 0) return '0h 0m';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
};

export const ellipsis = (str, len) => {
    if (!str) return '';
    return str.length > len ? `${str.slice(0, len - 1)}…` : str;
};

export const currency = (n) => `$${Number(n || 0).toFixed(2)}`;

export const safeArr = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

export const safeObj = (raw) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
};
