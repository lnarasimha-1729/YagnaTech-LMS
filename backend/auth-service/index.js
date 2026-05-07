import app, { initDb } from './src/app.js';

const PORT = process.env.PORT || 8001;

initDb().then(async () => {
  app.listen(PORT, () => {
    console.log(`🔐 Auth Service running on port ${PORT}---`);
  });
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
