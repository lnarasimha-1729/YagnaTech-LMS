import { Router } from 'express';
import * as controller from '../controllers/role.controller.js';
import isLoggedIn from '../middlewares/isLoggedin.js';
import authRoles from '../middlewares/authRoles.js';

const router = Router();

router.post('/add', controller.addRole);
router.get('/list', isLoggedIn, authRoles(['admin']), controller.listRoles);
router.delete('/delete', isLoggedIn, authRoles(['admin']), controller.deleteRole);
router.post('/assign', isLoggedIn, authRoles(['admin']), controller.assignRoleToUser);

export default router;
