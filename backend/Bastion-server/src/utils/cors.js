// Single source of truth for which browser origins Bastion accepts. Both the
// top-level cors() middleware (index.js) and the proxy's per-response header
// decorator (routes/proxyRoutes.js) read this so a request allowed at the
// gateway is also allowed when its proxied response is sent back to the
// browser. Lives in its own module to avoid circular imports between
// index.js and the routes that the gateway mounts.
//
// Origins come from BASTION_ALLOWED_ORIGINS (comma-separated) plus a small
// set of local dev defaults so `npm run dev` keeps working without env vars.
// const fromEnv = (process.env.BASTION_ALLOWED_ORIGINS || '')
//   .split(',')
//   .map((s) => s.trim())
//   .filter(Boolean);

// const devDefaults = [
//   'http://localhost:8080',
//   'http://localhost:8081',
//   'http://localhost:5173',
// ];

// export const bastionAllowedOrigins = Array.from(
//   new Set([...devDefaults, ...fromEnv])
// );

const fromEnv = (process.env.BASTION_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const devDefaults = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'http://13.235.24.234'
];

export const bastionAllowedOrigins = Array.from(
  new Set([...devDefaults, ...fromEnv])
);