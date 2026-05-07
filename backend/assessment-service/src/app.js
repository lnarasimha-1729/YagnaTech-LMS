// import 'dotenv/config';
// import express from 'express';
// import helmet from 'helmet';
// import cors from 'cors';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import sequelize from './db/index.js';
// import cookieParser from "cookie-parser";
// import assessmentRoutes from './routes/assessment.routes.js';
// import questionSetRoutes from './routes/questionSet.routes.js';
// import questionRoutes from './routes/question.routes.js';



// import dotenv from 'dotenv';

// dotenv.config()

// const app = express();

// const allowedOrigin = (origin, cb) => {
//   if (!origin) return cb(null, true);
//   if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
//   return cb(new Error('Not allowed by CORS'));
// };

// app.use(cors({
//   origin: allowedOrigin,
//   credentials: true,
// }));

// app.use(helmet());
// app.use(express.json());
// app.use(morgan('dev'));
// app.use(cookieParser());
// app.use(rateLimit({ windowMs: 60_000, max: 200 }));

// app.get('/health', (req, res) => {
//   res.json({ status: 'ok', service: process.env.SERVICE_NAME });
// });

// app.get("/", (req, res) => {
//   res.send("Welcome to the Assessment Service API");
// });

// app.use('/', assessmentRoutes);
// app.use('/question', questionRoutes);
// app.use('/question-set', questionSetRoutes);

// export async function initDb() {
//   await sequelize.authenticate();
//   await sequelize.sync();
//   console.log('🗄️  Database connected and synced---');
// }

// export default app;



import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import sequelize from './db/index.js';
import cookieParser from "cookie-parser";
import assessmentRoutes from './routes/assessment.routes.js';
import questionSetRoutes from './routes/questionSet.routes.js';
import questionRoutes from './routes/question.routes.js';

import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
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
  res.send("Welcome to the Assessment Service API");
});

app.use('/', assessmentRoutes);
app.use('/question', questionRoutes);
app.use('/question-set', questionSetRoutes);

export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('🗄️  Database connected and synced---');
}

export default app;