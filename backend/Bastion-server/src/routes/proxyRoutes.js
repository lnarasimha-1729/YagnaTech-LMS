import { Router } from 'express';
import httpProxy from 'express-http-proxy';
import serviceMap from '../utils/serviceMap.js';
import HealthMonitor from '../utils/healthMonitor.js';
import { bastionAllowedOrigins } from '../utils/cors.js';

const router = Router();
const healthMonitor = new HealthMonitor(serviceMap);

// run checks automatically every 2hrs
healthMonitor.startMonitoring(7200000);
// healthMonitor.startMonitoring(30000); // every 30s for demo

// Run health check once on startup
(async () => {
  const results = await healthMonitor.checkAll();
  console.log('=== Service Health on Startup ===');
  for (const [name, status] of Object.entries(results)) {
    console.log(`${name}: ${status.healthy ? '✅ healthy' : '❌ unhealthy'}`);
  }
  console.log('=================================');
})();

Object.entries(serviceMap).forEach(([name, service]) => {
  // development.....
  const target = `http://${service.host}:${service.port}`;
  // production......
  // const target = `https://${service.host}:${service.port}`;
  const proxy = httpProxy(target, {
    preserveHostHdr: true,
    proxyReqPathResolver: (req) => {
      const stripped = req.originalUrl.replace(`/api/v1/${service.path}`, '') || '/';
      return service.forwardPrefix ? `${service.forwardPrefix}${stripped === '/' ? '' : stripped}` : stripped;
    },
    // express-http-proxy pipes the upstream response straight back to the
    // client, so any CORS header Bastion's own cors() middleware would have
    // set is overwritten by upstream's. Several upstream services ship a
    // broken combo (`Access-Control-Allow-Origin: *` + credentials), which
    // browsers reject. Here we strip every upstream Access-Control-* and
    // re-emit the correct ones based on the request's Origin.
    userResHeaderDecorator: (headers, userReq) => {
      Object.keys(headers).forEach((h) => {
        if (h.toLowerCase().startsWith('access-control-')) delete headers[h];
      });
      const origin = userReq.headers?.origin;
      if (origin && bastionAllowedOrigins.includes(origin)) {
        headers['access-control-allow-origin'] = origin;
        headers['access-control-allow-credentials'] = 'true';
        headers['vary'] = headers['vary'] ? `${headers['vary']}, Origin` : 'Origin';
      }
      return headers;
    },
  });

  router.use(`/v1/${service.path}`, (req, res, next) => {
    const status = healthMonitor.getStatus(name);

    if (!status || !status.healthy) {
      console.warn(`[Bastion] ${service.path} is DOWN (last checked: ${status?.lastChecked ?? 'never'})`);
      return res.status(503).json({
        error: `${service.path} unavailable`,
        lastChecked: status?.lastChecked ?? null,
        details: status?.error || 'No response from service',
        // Bastion will re-probe automatically on the next request — let the
        // client know retrying after a short delay should work once the
        // upstream service is back up.
        retryHint: 'Bastion auto-probes downed services on each request; retry after a few seconds.',
      });
    }

    console.log(`[Bastion] Forwarding ${req.method} ${req.originalUrl} → ${target}`);
    proxy(req, res, next);
  });
});

// expose Bastion’s view of service health
router.get('/_services/health', (req, res) => {
  res.json(healthMonitor.statusMap);
});

// force a fresh health check across all services
router.post('/_services/health/refresh', async (_req, res) => {
  const results = await healthMonitor.checkAll();
  res.json(results);
});

export default router;
