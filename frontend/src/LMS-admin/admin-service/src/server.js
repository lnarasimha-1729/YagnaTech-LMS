const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

/**
 * Start HTTP server immediately. DB is probed in the background so a missing
 * MySQL doesn't block dev: /health and static routes work regardless, and
 * DB-backed routes will succeed automatically once MySQL becomes reachable.
 */
function start() {
  const server = app.listen(env.port, () => {
    console.log(`[http] listening on :${env.port} (${env.nodeEnv})`);
  });

  probeDatabase();

  const shutdown = (signal) => {
    console.log(`\n[http] received ${signal}, shutting down…`);
    server.close(async () => {
      try {
        await sequelize.close();
      } catch {
        /* pool may never have opened */
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

async function probeDatabase(attempt = 1) {
  try {
    await sequelize.authenticate();
    console.log('[db] connection established');
  } catch (err) {
    const backoff = Math.min(30000, 2000 * attempt);
    console.warn(
      `[db] not reachable (${err.message}) — retrying in ${backoff / 1000}s. ` +
        'DB-backed routes will fail until MySQL is up.'
    );
    setTimeout(() => probeDatabase(attempt + 1), backoff).unref();
  }
}

start();
