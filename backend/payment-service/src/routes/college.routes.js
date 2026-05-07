import { Router } from 'express';
import * as controller from '../controllers/college.controller.js';
import isLoggedIn from '../middlewares/isLoggedin.js';
import authRoles from '../middlewares/authRoles.js';

const router = Router();

router.post('/add', isLoggedIn, authRoles(['admin']), controller.addCollege);
router.get('/all', isLoggedIn, authRoles(['admin']), controller.getAllColleges);
router.get('/:clgId', isLoggedIn, authRoles(['admin', 'user']), controller.getCollegeById);
router.put('/update/:clgId', isLoggedIn, authRoles(['admin', 'user']), controller.updateCollege);
router.delete('/delete/:clgId', isLoggedIn, authRoles(['admin']), controller.deleteCollege);

export default router;
