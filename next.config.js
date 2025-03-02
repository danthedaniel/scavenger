// @ts-check
const { withSentryConfig } = require("@sentry/nextjs");

/**
 * @typedef {Object} SecurityPolicyEntry
 * @property {string[]} [default-src] - Default fallback for fetch directives
 * @property {string[]} [script-src] - Valid sources for JavaScript
 * @property {string[]} [connect-src] - Valid targets for fetch, WebSocket, etc
 * @property {string[]} [style-src] - Valid sources for stylesheets
 * @property {string[]} [img-src] - Valid sources for images
 * @property {string[]} [font-src] - Valid sources for fonts
 * @property {string[]} [object-src] - Valid sources for plugins
 * @property {string[]} [media-src] - Valid sources for media (audio/video)
 * @property {string[]} [frame-src] - Valid sources for frames
 * @property {string[]} [worker-src] - Valid sources for web workers
 * @property {string[]} [manifest-src] - Valid sources for manifest files
 * @property {string[]} [frame-ancestors] - Valid sources for frames
 * @property {string[]} [base-uri] - Valid sources for base URIs
 * @property {string[]} [form-action] - Valid sources for form actions
 * @property {string[]} [report-uri] - Valid sources for report URIs
 */

/**
 * Merges multiple security policies into a single policy string.
 * @param {SecurityPolicyEntry[]} policies - Array of security policies
 * @returns {string} - Combined security policy string
 */
function generateCSPHeader(policies) {
  const combined = policies.reduce((combined, policy) => {
    Object.keys(policy).forEach((directive) => {
      const sources = Array.from(
        new Set([...(combined[directive] ?? []), ...policy[directive]])
      );
      combined[directive] = sources;
    });

    return combined;
  }, {});

  const baseDirectives = Object.entries(combined)
    .filter(([_directive, sources]) => sources.length > 0)
    .map(([directive, sources]) => `${directive} ${sources.sort().join(" ")}`);

  return [...baseDirectives, "upgrade-insecure-requests"].join("; ");
}

/** @type {SecurityPolicyEntry} */
const defaultPolicy = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-eval'"],
  "connect-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'"],
  "manifest-src": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
};

/** @type {SecurityPolicyEntry} */
const mixpanelPolicy = {
  "connect-src": ["https://api.mixpanel.com/", "https://api-js.mixpanel.com"],
  "img-src": ["https://cdn.mxpnl.com/"],
};

const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? new URL(process.env.NEXT_PUBLIC_SENTRY_DSN)
  : null;

/** @type {SecurityPolicyEntry} */
const sentryPolicy = {
  "connect-src": sentryDSN ? [sentryDSN.origin] : [],
  "script-src": ["https://*.sentry-cdn.com"],
  "report-uri": sentryDSN
    ? [
        `${sentryDSN.origin}/api/${sentryDSN.pathname.split("/")[1]}/security/?sentry_key=${encodeURIComponent(sentryDSN.username)}`,
      ]
    : [],
};

/** @type {SecurityPolicyEntry} */
const vercelLivePolicy = {
  "connect-src": [
    "https://vercel.live",
    "https://*.pusher.com",
    "wss://*.pusher.com",
  ],
  "img-src": ["https://vercel.com"],
  "script-src": ["https://vercel.live"],
  "style-src": ["https://vercel.live"],
  "font-src": ["https://vercel.live"],
  "frame-src": ["https://vercel.live"],
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value: generateCSPHeader([
            defaultPolicy,
            mixpanelPolicy,
            sentryPolicy,
            vercelLivePolicy,
          ]),
        },
      ],
    },
  ],
  // Disable x-powered-by header for security
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@sentry/nextjs"],
  },
};

module.exports = withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: "sfparkgold",
  project: "sfparkgold",
  silent: true,
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
  // Automatically delete source maps after uploading to Sentry
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
