// import 'dotenv/config';
// import express from 'express';
// import helmet from 'helmet';
// import cors from 'cors';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import sequelize from './db/index.js';
// import authRoutes from './routes/auth.routes.js';
// import roleRoutes from './routes/roles.routes.js';
// import cookieParser from "cookie-parser";



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
//   res.send("Welcome to the Authentication Service API");
// });

// app.use('/', authRoutes);
// app.use('/roles', roleRoutes);

// export async function initDb() {
//   await sequelize.authenticate();
//   await sequelize.sync();
//   console.log('🗄️  Database connected and synced---');
// }

// export default app;

// // import 'dotenv/config';
// // import express from 'express';
// // import helmet from 'helmet';
// // import cors from 'cors';
// // import morgan from 'morgan';
// // import rateLimit from 'express-rate-limit';
// // import sequelize from './db/index.js';
// // import authRoutes from './routes/auth.routes.js';
// // import roleRoutes from './routes/roles.routes.js';
// // import cookieParser from "cookie-parser";

// // const app = express();

// // app.use(cors({ 
// //   origin: process.env.CORS_ORIGIN || '*',
// //   credentials: true,
// // }));

// // app.use(helmet());
// // app.use(express.json());
// // app.use(morgan('dev'));
// // app.use(cookieParser());
// // app.use(rateLimit({ windowMs: 60_000, max: 200 }));

// // // Health check
// // app.get('/health', (req, res) => {
// //   res.json({ status: 'ok', service: process.env.SERVICE_NAME });
// // });

// // app.get("/", (req, res) => {
// //   res.send("Welcome to the Authentication Service API");
// // });

// // // ✅ FIX: Mount auth routes under /auth prefix
// // app.use('/auth', authRoutes);
// // app.use('/auth/roles', roleRoutes);

// // // 404 handler for undefined routes
// // app.use('*', (req, res) => {
// //   res.status(404).json({ error: 'Route not found' });
// // });

// // export async function initDb() {
// //   await sequelize.authenticate();
// //   await sequelize.sync();
// //   console.log('🗄️ Database connected and synced');
// // }

// // export default app;





import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import sequelize from './db/index.js';
import authRoutes from './routes/auth.routes.js';
import roleRoutes from './routes/roles.routes.js';
import cookieParser from "cookie-parser";

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
  res.send("Welcome to the Authentication Service API");
});

app.use('/', authRoutes);
app.use('/roles', roleRoutes);

export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('🗄️  Database connected and synced---');
}

export default app;