/**
 * In-memory rate limiter for Express routes.
 * Tracks request counts per IP with a sliding window.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(opts: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message } = opts;

  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();
    const key = `${ip}:${req.baseUrl || ""}:${req.path}`;

    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        error: message || "Muitas requisições. Tente novamente mais tarde.",
      });
    }

    next();
  };
}
