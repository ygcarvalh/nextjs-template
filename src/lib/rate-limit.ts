export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  // Bounds memory. Once exceeded, expired buckets are swept; if that is not
  // enough, the oldest are dropped.
  maxKeys?: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
}

// A fixed-window counter held in process memory.
//
// It only limits the instance it runs on. Behind more than one instance the
// effective limit multiplies by the instance count, so anything load-bearing
// wants a shared store (Redis, Upstash, Vercel KV) behind this same interface.
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
    // Map preserves insertion order, so the front is the least recently created.
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
