// Small fixed-window rate limiter for cheap, low-risk endpoints (e.g. the
// newsletter form). State is per server instance; use a shared store (database
// or Redis) for anything sensitive. Auth uses Better Auth's database-backed limiter.

type Bucket = { count: number; resetAt: number };

/** Hard cap on tracked keys so a flood of unique keys can't exhaust memory. */
const MAX_KEYS = 10_000;
const buckets = new Map<string, Bucket>();

function evict(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still full: drop the oldest entries (Map preserves insertion order).
  while (buckets.size >= MAX_KEYS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

/** Returns true when the request is allowed, false when the limit is exceeded. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) evict(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
}
