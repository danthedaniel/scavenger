// @ts-check

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
          value: generateCSPHeader([defaultPolicy, mixpanelPolicy]),
        },
      ],
    },
  ],
  // Disable x-powered-by header for security
  poweredByHeader: false,
};

module.exports = nextConfig;
