// Server-side input validation. Never trust client-side `type="email"` or
// `required`: requests can be sent without the browser.

/** RFC 5321 limit for a whole address. */
export const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;

// Pragmatic address shape: local@domain.tld, no spaces, quotes, angle brackets
// or control characters. Full RFC 5322 parsing is deliberately not attempted.
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

export type EmailResult = { ok: true; email: string } | { ok: false };

/** Validates and normalises an email from untrusted form input. */
export function parseEmail(input: FormDataEntryValue | null): EmailResult {
  if (typeof input !== "string") return { ok: false };
  // Check length before any regex work, so huge inputs can't cause slow matching.
  if (input.length > MAX_EMAIL_LENGTH + 2) return { ok: false };
  const email = input.trim().toLowerCase();
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return { ok: false };
  const at = email.lastIndexOf("@");
  if (at < 1 || at > MAX_LOCAL_PART_LENGTH) return { ok: false };
  if (email.includes("..") || email.startsWith(".") || email.slice(0, at).endsWith(".")) {
    return { ok: false };
  }
  return EMAIL_PATTERN.test(email) ? { ok: true, email } : { ok: false };
}
