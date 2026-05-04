// src/index.js
'use strict';

import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

import rateLimiter from './middlewares/rateLimiter.js';
import routes from './routes/index.js';
import { bastionAllowedOrigins } from './utils/cors.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: bastionAllowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiter);

// Routes
app.use('/api', routes);

app.use('/', (req,res) => {
  res.send('Welcome to Bastion Server');
});


export default app;
