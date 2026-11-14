// Resolves the client IP from headers your hosting proxy sets.
//
// Forwarding headers such as x-forwarded-for can be sent by any client, so
// only headers named in TRUSTED_IP_HEADERS (comma-separated, in priority
// order) are used, e.g. "x-real-ip" on Vercel or "cf-connecting-ip" behind
// Cloudflare. Unset means "unknown", never a guess from spoofable headers.
// Better Auth uses the same list (see src/lib/auth.ts).

export function trustedIpHeaders(): string[] {
  return (process.env.TRUSTED_IP_HEADERS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

const IP_PATTERN = /^[0-9a-f.:]{2,45}$/i;

/** Returns the client IP, or null when it can't be determined safely. */
export function clientIp(headers: Headers): string | null {
  for (const name of trustedIpHeaders()) {
    const value = headers.get(name);
    if (!value) continue;
    // A trusted single-value header; ignore chains, which the client could prepend to.
    const ip = value.trim();
    if (!ip.includes(",") && IP_PATTERN.test(ip)) return ip;
  }
  return null;
}
