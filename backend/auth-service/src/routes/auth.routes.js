import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import isLoggedIn from '../middlewares/isLoggedin.js';
import authRoles from '../middlewares/authRoles.js';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.get('/profile', isLoggedIn, controller.profile);
router.put('/profile/update', isLoggedIn, controller.updateProfile);
router.put('/profile/update/edu', isLoggedIn, authRoles(['student', 'instructor']), controller.updateEducation);
router.put('/profile/update/org-clg-branch', isLoggedIn, authRoles(['student', 'instructor']), controller.updateOrgClgBranch);
router.put("/profile/prescore", isLoggedIn, authRoles(['student']), controller.preScore)
router.put("/profile/postscore", isLoggedIn, authRoles(['student']), controller.postScore)
router.post('/change-password', isLoggedIn, controller.changePassword);
router.post('/logout', isLoggedIn, controller.logout);

export default router;
