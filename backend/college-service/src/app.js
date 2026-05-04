import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import sequelize from './db/sequelize.js';
import cookieParser from "cookie-parser";
import collegeRoutes from './routes/college.routes.js';
import branchRoutes from './routes/branch.routes.js';



import dotenv from 'dotenv';

dotenv.config()

const app = express();

// CORS: with credentials:true the browser rejects an Allow-Origin of "*", so
// we must echo a specific origin. CORS_ORIGIN can be a single value or a
// comma-separated allowlist; in dev we default to the Vite ports the
// frontend can come up on. Anything outside the list gets no CORS headers
// (the browser then blocks the request, which is the safe failure mode).
const allowedOrigins = (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*')
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Same-origin / curl / server-to-server: no Origin header — allow.
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: process.env.SERVICE_NAME });
});

app.get("/", (req, res) => {
  res.send("Welcome to the College Service API");
});

app.use('/', collegeRoutes);
app.use('/branch', branchRoutes);


export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('🗄️  Database connected and synced---'); 
}

export default app;
