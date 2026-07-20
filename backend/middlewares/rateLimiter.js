export const createRateLimiter = ({
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = "Too many requests from this IP, please try again later"
} = {}) => {
    const hits = new Map();

    const cleanup = () => {
        const now = Date.now();
        for (const [key, records] of hits.entries()) {
            const valid = records.filter(timestamp => now - timestamp < windowMs);
            if (valid.length === 0) {
                hits.delete(key);
            } else {
                hits.set(key, valid);
            }
        }
    };

    setInterval(cleanup, windowMs).unref();

    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();

        const timestamps = hits.get(ip) || [];
        const windowStart = now - windowMs;
        const validTimestamps = timestamps.filter(t => t > windowStart);

        if (validTimestamps.length >= max) {
            const oldest = validTimestamps[0];
            const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', 0);
            return res.status(429).json({
                success: false,
                message,
                retryAfter: retryAfterSec
            });
        }

        validTimestamps.push(now);
        hits.set(ip, validTimestamps);

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', max - validTimestamps.length);
        next();
    };
};

export const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many authentication attempts, please try again in 15 minutes"
});

export const apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 120,
    message: "Request rate limit exceeded, please slow down"
});
