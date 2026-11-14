import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const servesHttps = (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");

// Content Security Policy (XSS, data exfiltration, clickjacking, form hijacking).
// - Script files may only come from this origin, and Subresource Integrity
//   (experimental.sri) pins each Next.js chunk to a build-time hash.
// - 'unsafe-inline' is required for scripts because the App Router streams page
//   data in inline <script> tags. The strict alternative is a per-request nonce
//   (see Next's CSP guide), which forces dynamic rendering of every page. It's
//   acceptable here because React escapes all output and the app renders no
//   raw HTML (no dangerouslySetInnerHTML).
// - Images are served through /_next/image (same origin) and fonts are
//   self-hosted by next/font, so no third-party origins are needed.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'", // no inline event handlers (onclick="…")
  // Inline style attributes (e.g. computed grid columns) need 'unsafe-inline' for styles only.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Note: `require-trusted-types-for 'script'` was tested and breaks Next.js'
  // chunk loader (it assigns script URLs directly), so it isn't enabled.
  ...(servesHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" }, // legacy fallback for frame-ancestors
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Isolate the browsing context from cross-origin windows (tabnabbing, XS-Leaks).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Other sites can't embed our responses (images, scripts) in their pages.
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Hash-based integrity for Next's scripts, enabling a strict script-src
    // without per-request nonces (which would force dynamic rendering).
    sri: { algorithm: "sha256" },
    serverActions: {
      // Forms here send a few fields; refuse large bodies early (DoS).
      bodySizeLimit: "16kb",
    },
  },
  images: {
    qualities: [75],
    remotePatterns: [
      // Only Unsplash photo paths; everything else is rejected by the optimizer.
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
