// Single source of truth for which browser origins Bastion accepts. Both the
// top-level cors() middleware (index.js) and the proxy's per-response header
// decorator (routes/proxyRoutes.js) read this so a request allowed at the
// gateway is also allowed when its proxied response is sent back to the
// browser. Lives in its own module to avoid circular imports between
// index.js and the routes that the gateway mounts.
export const bastionAllowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
];
