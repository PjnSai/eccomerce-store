// No `import "server-only"` here: the Better Auth CLI (npm run auth:generate)
// refuses to load configs that use it. The server-only boundary is enforced by
// the no-restricted-imports rule for src/components in eslint.config.mjs.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { validateAuthSecrets } from "./auth-secret";
import { trustedIpHeaders } from "./client-ip";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;
const appURL = process.env.NEXT_PUBLIC_APP_URL;

// Better Auth only warns about weak secrets, but they sign HS256 tokens and
// cookies, so reject them here. Any configured secret (BETTER_AUTH_SECRET,
// AUTH_SECRET, every BETTER_AUTH_SECRETS version) is checked in every
// environment, including `next build`, so CI fails before a weak value ships.
const hasSecret = validateAuthSecrets(process.env);

// A missing secret is only fatal when actually serving in production; `next
// build` evaluates this module while collecting page data but serves nothing,
// and local development may rely on Better Auth's dev-only default.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
if (process.env.NODE_ENV === "production" && !isBuild) {
  if (!hasSecret) {
    throw new Error("BETTER_AUTH_SECRET must be set in production (generate one with `npx auth secret`).");
  }
  if (!baseURL) throw new Error("BETTER_AUTH_URL must be set in production.");
  // Without a trusted client-IP header, rate limiting either trusts spoofable
  // headers or falls back to one shared bucket that a single attacker can fill,
  // locking everyone out of sign-in.
  if (trustedIpHeaders().length === 0) {
    throw new Error(
      "TRUSTED_IP_HEADERS must be set in production to the client-IP header your host sets (e.g. x-real-ip on Vercel, cf-connecting-ip on Cloudflare).",
    );
  }
}

const ipAddressHeaders = trustedIpHeaders();

export const auth = betterAuth({
  secret,
  // Explicit origins: don't derive trusted origins from request headers.
  baseURL,
  trustedOrigins: [baseURL, appURL].filter((origin): origin is string => Boolean(origin)),
  database: drizzleAdapter(db, { provider: "pg" }),
  rateLimit: {
    // Shared across serverless instances (in-memory counters are per instance).
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/*": { window: 60, max: 5 },
      "/sign-up/*": { window: 60, max: 5 },
      "/forget-password": { window: 300, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
    },
  },
  // Email/password stays disabled until auth flows are built; these settings
  // apply as soon as it's enabled:
  // - requireEmailVerification + autoSignIn:false make sign-up return the same
  //   response for new and existing emails (no account enumeration);
  // - long minimum length instead of composition rules (NIST 800-63B);
  // - a password reset revokes every other session (hijacked sessions die).
  emailAndPassword: {
    enabled: false,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 30,
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh expiry at most daily
    freshAge: 60 * 10, // sensitive actions need a sign-in within 10 minutes
  },
  advanced: {
    // Cookies are HttpOnly + SameSite=Lax by default; also force Secure (and the
    // __Secure- prefix) in production so session cookies never travel over HTTP.
    useSecureCookies: process.env.NODE_ENV === "production",
    ipAddress: {
      // Only headers the hosting proxy sets; never trust client-supplied chains.
      ...(ipAddressHeaders.length > 0 ? { ipAddressHeaders } : {}),
    },
    // CSRF protection (Origin + Fetch Metadata checks) stays on: never set
    // disableCSRFCheck or disableOriginCheck.
  },
  // Enable auth methods (emailAndPassword, socialProviders, ...) when building auth flows.
  plugins: [nextCookies()], // must stay last in the plugins array
});
