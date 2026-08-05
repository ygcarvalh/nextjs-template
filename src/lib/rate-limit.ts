export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  maxKeys?: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
}

export function createRateLimiter({
  windowMs,
  max,
  maxKeys = 10_000,
}: RateLimiterOptions): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  function evict(now: number): void {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
    while (buckets.size > maxKeys) {
      const oldest = buckets.keys().next();
      if (oldest.done) {
        break;
      }
      buckets.delete(oldest.value);
    }
  }

  return {
    check(key, now = Date.now()) {
      if (buckets.size >= maxKeys) {
        evict(now);
      }

      const bucket = buckets.get(key);

      if (!bucket || bucket.resetAt <= now) {
        const resetAt = now + windowMs;
        buckets.set(key, { count: 1, resetAt });
        return { allowed: true, limit: max, remaining: max - 1, resetAt };
      }

      bucket.count += 1;
      return {
        allowed: bucket.count <= max,
        limit: max,
        remaining: Math.max(0, max - bucket.count),
        resetAt: bucket.resetAt,
      };
    },
  };
}
