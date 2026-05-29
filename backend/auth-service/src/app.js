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
import Role from './db/models/Role.js';
import authRoutes from './routes/auth.routes.js';
import roleRoutes from './routes/roles.routes.js';
import cookieParser from "cookie-parser";
import { generateRoleID } from './utils/uidGeneration.js';

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

const ROLES = ['student', 'instructor', 'admin', 'auditor'];

export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();

  // Ensure every role row exists — safe to run on every boot.
  for (const roleName of ROLES) {
    const [, created] = await Role.findOrCreate({
      where: { role: roleName },
      defaults: { roleId: generateRoleID('R'), role: roleName },
    });
    if (created) console.log(`  ✅ Seeded role: ${roleName}`);
  }

  // Forgot-password columns. sequelize.sync() doesn't add new columns to an
  // existing table, so DESCRIBE first and ALTER only when absent — same
  // idempotent pattern admin-service uses for late column additions.
  try {
    const { QueryTypes } = await import('sequelize');
    const wanted = [
      ['passwordResetToken',   'VARCHAR(128) NULL'],
      ['passwordResetExpires', 'DATETIME NULL'],
    ];
    for (const [field, ddl] of wanted) {
      const [col] = await sequelize.query(
        'SHOW COLUMNS FROM users WHERE Field = :field',
        { replacements: { field }, type: QueryTypes.SELECT }
      );
      if (!col) {
        await sequelize.query(`ALTER TABLE users ADD COLUMN ${field} ${ddl}`);
        console.log(`🛠️  Added users.${field} column`);
      }
    }
  } catch (e) {
    console.warn('[auth] password-reset column check skipped:', e.message);
  }

  console.log('🗄️  Database connected and synced---');
}

export default app;