// src/routes/index.js
import { Router } from 'express';
import proxyRoutes from './proxyRoutes.js';

const router = Router();

// Mount proxy routes
router.use('/', proxyRoutes);

export default router;
