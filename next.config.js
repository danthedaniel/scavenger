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
 * @property {string[]} [media-devices] - Valid sources for media devices
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

  const baseDirectives = Object.entries(combined).map(
    ([directive, sources]) => `${directive} ${sources.join(" ")}`
  );

  return [...baseDirectives, "upgrade-insecure-requests"].join("; ");
}

/** @type {SecurityPolicyEntry} */
const defaultPolicy = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  "connect-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'"],
  "manifest-src": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "media-devices": ["'self'"],
};

/** @type {SecurityPolicyEntry} */
const mixpanelPolicy = {
  "connect-src": [
    process.env.NODE_ENV === "production"
      ? "https://api.mixpanel.com/"
      : "http://api.mixpanel.com/",
    "https://api-js.mixpanel.com",
  ],
  "img-src": ["https://cdn.mxpnl.com/"],
};

const sentryDSN = process.env.SENTRY_DSN
  ? new URL(process.env.SENTRY_DSN)
  : null;

/** @type {SecurityPolicyEntry} */
const sentryPolicy = {
  "connect-src": ["https://*.ingest.us.sentry.io"],
  "script-src": ["https://*.sentry-cdn.com"],
  "report-uri": sentryDSN
    ? [
        `${sentryDSN.origin}/api/${sentryDSN.pathname}/security/?sentry_key=${encodeURIComponent(sentryDSN.username)}`,
      ]
    : [],
};

/** @type {SecurityPolicyEntry} */
const vercelPolicy = {
  "connect-src": [
    "https://vitals.vercel-insights.com", // Web Vitals
    "https://*.vercel.app", // Vercel deployments
    "https://vercel.live", // Vercel Live
    "https://*.vercel.com", // Vercel API and other services
  ],
  "script-src": [
    "https://va.vercel-scripts.com", // Vercel Analytics
    "https://*.vercel.app",
    "https://*.vercel.com",
  ],
  "img-src": ["https://*.vercel.app", "https://*.vercel.com"],
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
            vercelPolicy,
          ]),
        },
      ],
    },
  ],
  // Disable x-powered-by header for security
  poweredByHeader: false,
};

module.exports = withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: "sfparkgold",
  project: "sfparkgold",
  silent: !process.env.CI,
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
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
