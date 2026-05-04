require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true, module: 'certificate' }));
app.use('/api', routes);

app.use((err, _req, res, _next) => {
    console.error('[error]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

process.on('unhandledRejection', (r) => console.error('Unhandled rejection:', r));
process.on('uncaughtException', (e) => console.error('Uncaught exception:', e));

const PORT = Number(process.env.PORT) || 5070;
const USE_MOCK = process.env.USE_MOCK === 'true';

const start = () => app.listen(PORT, () => {
    console.log(`certificate-module backend on port ${PORT}${USE_MOCK ? ' (mock mode)' : ''}`);
});

if (USE_MOCK) {
    start();
} else {
    const { sequelize } = require('./models');
    sequelize.authenticate()
        .then(start)
        .catch((err) => {
            console.warn('DB connection failed:', err.message);
            console.warn('Booting in mock mode anyway.');
            start();
        });
}
