// Strength checks for Better Auth signing secrets.
//
// Better Auth only *warns* about short or low-entropy secrets, but the secret
// signs HS256 tokens (e.g. email verification), signed cookies and OAuth state.
// A guessable secret lets an attacker forge them, so we refuse weak values.
//
// These heuristics reject values that are short, default/placeholder,
// repetitive, sequential or low in character entropy. They can't prove a value
// is random: always generate secrets with `npx auth secret` (64 hex chars)
// or `openssl rand -base64 32`.
// Pure module (no server-only import) so the Better Auth CLI can load auth.ts.

export const MIN_SECRET_LENGTH = 32;
/** Minimum estimated entropy, from the observed character distribution. */
export const MIN_SECRET_BITS = 128;
const MIN_DISTINCT_CHARS = 10;
// Run limits are set so randomly generated secrets essentially never trip them
// (P < 1e-6 for 64 hex chars) while repetitive or sequential strings do.
const MAX_IDENTICAL_RUN = 7; // 8+ identical characters in a row are rejected
const MAX_SEQUENTIAL_RUN = 7; // "abcdefgh" / "87654321" (8+) are rejected
const REPEATED_CHUNK_LENGTH = 8; // any 8-char chunk appearing twice is rejected

/** Better Auth's built-in development secret (better-auth/dist/utils/constants). */
const BETTER_AUTH_DEFAULT_SECRET = "better-auth-secret-12345678901234567890";

/** Substrings that only appear in hand-written or copied example values. */
const PLACEHOLDER_FRAGMENTS = [
  "changeme",
  "change-me",
  "change_me",
  "example",
  "placeholder",
  "your-secret",
  "your_secret",
  "yoursecret",
  "secret",
  "password",
  "better-auth",
  "betterauth",
  "default",
  "localhost",
  // keyboard walks
  "qwerty",
  "asdfgh",
  "zxcvbn",
];

/** Shannon entropy of the string's own character distribution, in total bits. */
export function estimateSecretBits(value: string): number {
  const counts = new Map<string, number>();
  for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let bitsPerChar = 0;
  for (const count of counts.values()) {
    const p = count / value.length;
    bitsPerChar -= p * Math.log2(p);
  }
  return bitsPerChar * value.length;
}

function longestIdenticalRun(value: string): number {
  let longest = 1;
  let run = 1;
  for (let i = 1; i < value.length; i++) {
    run = value[i] === value[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

function longestSequentialRun(value: string): number {
  let longest = 1;
  let up = 1;
  let down = 1;
  for (let i = 1; i < value.length; i++) {
    const step = value.charCodeAt(i) - value.charCodeAt(i - 1);
    up = step === 1 ? up + 1 : 1;
    down = step === -1 ? down + 1 : 1;
    longest = Math.max(longest, up, down);
  }
  return longest;
}

function hasRepeatedChunk(value: string, size: number): boolean {
  const seen = new Set<string>();
  for (let i = 0; i + size <= value.length; i++) {
    const chunk = value.slice(i, i + size);
    if (seen.has(chunk)) return true;
    seen.add(chunk);
  }
  return false;
}

/** Returns the reasons a secret is unacceptable; an empty array means it passed. */
export function secretWeaknesses(value: string): string[] {
  const problems: string[] = [];
  const lower = value.toLowerCase();

  if (value !== value.trim()) problems.push("has leading or trailing whitespace");
  if (value.length < MIN_SECRET_LENGTH) {
    problems.push(`is shorter than ${MIN_SECRET_LENGTH} characters`);
  }
  if (value === BETTER_AUTH_DEFAULT_SECRET) problems.push("is Better Auth's public default secret");
  const fragment = PLACEHOLDER_FRAGMENTS.find((f) => lower.includes(f));
  if (fragment) problems.push(`contains the placeholder/dictionary fragment "${fragment}"`);
  if (new Set(value).size < MIN_DISTINCT_CHARS) {
    problems.push(`uses fewer than ${MIN_DISTINCT_CHARS} distinct characters`);
  }
  if (longestIdenticalRun(value) > MAX_IDENTICAL_RUN) problems.push("repeats the same character");
  if (longestSequentialRun(value) > MAX_SEQUENTIAL_RUN) {
    problems.push("contains a long sequential run (e.g. abcdefgh or 12345678)");
  }
  if (hasRepeatedChunk(lower, REPEATED_CHUNK_LENGTH)) problems.push("repeats a pattern");
  if (estimateSecretBits(value) < MIN_SECRET_BITS) {
    problems.push(`has less than ${MIN_SECRET_BITS} bits of estimated entropy`);
  }
  return problems;
}

/** Throws if the secret is weak. The secret itself is never included in the message. */
export function assertStrongSecret(value: string, name: string): void {
  const problems = secretWeaknesses(value);
  if (problems.length > 0) {
    throw new Error(
      `${name} is too weak: it ${problems.join("; ")}. ` +
        "Generate a new one with `npx auth secret` or `openssl rand -base64 32`.",
    );
  }
}

type Env = Record<string, string | undefined>;

/**
 * Validates every secret Better Auth would read from the environment:
 * BETTER_AUTH_SECRET, the AUTH_SECRET fallback, and every version in the
 * BETTER_AUTH_SECRETS rotation list (old versions still verify tokens, so a
 * weak old key is as dangerous as a weak current one).
 * Returns whether any secret is configured.
 */
export function validateAuthSecrets(env: Env): boolean {
  let configured = false;

  for (const name of ["BETTER_AUTH_SECRET", "AUTH_SECRET"] as const) {
    const value = env[name];
    if (value === undefined || value === "") continue;
    configured = true;
    assertStrongSecret(value, name);
  }

  const rotation = env.BETTER_AUTH_SECRETS;
  if (rotation) {
    configured = true;
    rotation.split(",").forEach((entry, index) => {
      const colon = entry.indexOf(":");
      const version = colon === -1 ? `#${index + 1}` : entry.slice(0, colon).trim();
      const value = colon === -1 ? entry.trim() : entry.slice(colon + 1).trim();
      assertStrongSecret(value, `BETTER_AUTH_SECRETS version ${version}`);
    });
  }

  return configured;
}
