import app, { initDb } from './src/app.js';

const PORT = process.env.PORT || 8005;
let httpServer = null;

const startListening = () => {
  httpServer = app.listen(PORT, () => {
    console.log(`🔐 College Service running on port ${PORT}`);
  });

  // app.listen returns asynchronously — bind failures (EADDRINUSE, EACCES)
  // arrive as 'error' events on the server, not as thrown exceptions. Catch
  // them here with an actionable message and exit 1 so nodemon stops looping
  // into the same wall instead of respawning silently.
  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[college-service] Port ${PORT} is already in use.`);
      console.error('Free it with:');
      console.error(`  PowerShell:  Get-NetTCPConnection -LocalPort ${PORT} -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }`);
      console.error(`Or set PORT=<other> in college-service/.env and restart.\n`);
      process.exit(1);
    }
    if (err.code === 'EACCES') {
      console.error(`[college-service] Permission denied binding port ${PORT} (try a port >1024).`);
      process.exit(1);
    }
    console.error('[college-service] HTTP server error:', err);
    process.exit(1);
  });
};

// Graceful shutdown — release the port immediately on Ctrl+C / nodemon
// restart so the next bind doesn't race against a TIME_WAIT socket.
const shutdown = (signal) => {
  if (!httpServer) process.exit(0);
  console.log(`\n[college-service] ${signal} received, closing server...`);
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Try to init DB. Transient AWS RDS DNS hiccups (ENOTFOUND, ETIMEDOUT) used
// to crash the service and trigger nodemon respawn loops. Now we log the
// failure and start serving anyway — endpoints that hit the DB will surface
// their own 500s, but Bastion's health check sees us alive and routes resume
// the moment RDS is reachable again.
initDb()
  .then(() => startListening())
  .catch((err) => {
    console.warn('[college-service] DB init failed at startup:', err.message);
    console.warn('[college-service] Starting HTTP listener anyway — DB-backed endpoints will 500 until RDS is reachable.');
    startListening();
  });
