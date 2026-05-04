const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const apiRoutes = require('./modules');
const errorMiddleware = require('./shared/middleware/error.middleware');

const app = express();

app.set('trust proxy', 1); // needed for req.ip behind nginx / cloudflare
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Public static — mirrors Laravel's /storage link. Points at STORAGE_LOCAL_PATH.
app.use(
  env.storage.publicUrlPrefix,
  express.static(path.resolve(env.storage.localPath), { maxAge: '7d' })
);

app.get('/health', (_req, res) => res.json({ ok: true, env: env.nodeEnv }));

app.use('/api', apiRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));
app.use(errorMiddleware);

module.exports = app;
