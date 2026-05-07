import { Router } from 'express';
import * as controller from '../controllers/organization.controller.js';
import isLoggedIn from '../middlewares/isLoggedin.js';
import authRoles from '../middlewares/authRoles.js';

const router = Router();

router.post('/add', isLoggedIn, authRoles(['admin']), controller.addOrganization);
router.get('/all', isLoggedIn, authRoles(['admin']), controller.getAllOrganizations);
router.get('/:orgId', isLoggedIn, authRoles(['admin', 'user']), controller.getOrganizationById);
router.put('/update/:orgId', isLoggedIn, authRoles(['admin', 'user']), controller.updateOrganization);
router.delete('/delete/:orgId', isLoggedIn, authRoles(['admin']), controller.deleteOrganization);

export default router;
