"use server";

import { headers } from "next/headers";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { parseEmail } from "@/lib/validation";

export type NewsletterState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "invalid" }
  | { status: "limited" };

const PER_IP = { max: 5, windowMs: 10 * 60_000 };
// When no trusted client IP is available, everyone shares one bucket. Keep it
// generous so one sender can't lock the form for all visitors.
const SHARED = { max: 200, windowMs: 10 * 60_000 };

/**
 * Newsletter sign-up. Called only via POST (Server Actions reject other methods
 * and check that Origin matches Host, which blocks CSRF), so the address never
 * appears in a URL, browser history or access logs.
 *
 * Responses never reveal whether an address is already subscribed (no
 * enumeration) and never echo the input back (no reflection).
 */
export async function subscribeToNewsletter(
  _previous: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const allowed = ip
    ? rateLimit(`newsletter:${ip}`, PER_IP.max, PER_IP.windowMs)
    : rateLimit("newsletter:shared", SHARED.max, SHARED.windowMs);
  if (!allowed) return { status: "limited" };

  // Honeypot: real visitors never see or fill this field. Pretend success for bots.
  const trap = formData.get("company");
  if (typeof trap === "string" && trap.length > 0) return { status: "success" };

  const result = parseEmail(formData.get("email"));
  if (!result.ok) return { status: "invalid" };

  // Integration point: store the address or call your email provider here,
  // using double opt-in (send a confirmation link before adding the address).
  // Return the same response whether or not the address already exists.

  return { status: "success" };
}
