import axios from 'axios';

export default class HealthMonitor {
  constructor(serviceMap) {
    this.serviceMap = serviceMap;
    this.statusMap = {};
  }

  async checkOne(name) {
    const service = this.serviceMap[name];
    if (!service) return null;
    try {
      const res = await axios.get(`http://${service.host}:${service.port}/health`, { timeout: 2000 });
      const status = { healthy: true, lastChecked: new Date(), details: res.data };
      this.statusMap[name] = status;
      return status;
    } catch (err) {
      const status = {
        healthy: false,
        lastChecked: new Date(),
        error: err.message || err.code || String(err),
      };
      this.statusMap[name] = status;
      return status;
    }
  }

  async checkAll() {
    // Probe in parallel — sequential probes made startup take O(N * timeout).
    const names = Object.keys(this.serviceMap);
    await Promise.all(names.map((n) => this.checkOne(n)));
    return this.statusMap;
  }

  // Get the latest status of a specific service. If marked unhealthy and the
  // last check is older than `maxAgeMs`, transparently re-probe so the caller
  // sees the current truth rather than a stale negative cache. This is what
  // gives services automatic recovery — start college-service after Bastion
  // and the next request to /college/* re-probes and starts forwarding.
  getStatus(serviceName, { autoRefreshIfDownMs = 5000 } = {}) {
    const status = this.statusMap[serviceName];
    if (!status) return null;
    if (!status.healthy) {
      const age = Date.now() - new Date(status.lastChecked).getTime();
      if (age > autoRefreshIfDownMs) {
        // Fire-and-forget: don't block the current request, but the next one
        // (a few hundred ms later) will see the refreshed state.
        this.checkOne(serviceName).catch(() => {});
      }
    }
    return status;
  }

  // Run periodic checks. Default 30s — short enough that a service that came
  // up between probes is reflected before users notice, long enough that the
  // probe traffic is negligible. The per-request lazy refresh in getStatus()
  // is the real recovery mechanism; this interval is the safety net for
  // services that aren't being actively used.
  startMonitoring(intervalMs = 30000) {
    // run immediately
    this.checkAll();

    // then schedule recurring checks
    this.interval = setInterval(() => {
      this.checkAll().then(results => {
        // console.log(`[HealthMonitor] Refreshed service statuses at ${new Date().toISOString()}`);
         this.printStatuses(results, 'Periodic Check');
      });
    }, intervalMs);
  }

  printStatuses(results, label) {
  const now = new Date();
  const formattedDate = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).replace(',', '');
  
  console.log(`\n=== Service Health (${label}) ${formattedDate} ===`);
  for (const [name, status] of Object.entries(results)) {
    console.log(`${name}: ${status.healthy ? '✅ healthy' : '❌ unhealthy'}`);
  }
  console.log('===============================\n');
}

  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

}
