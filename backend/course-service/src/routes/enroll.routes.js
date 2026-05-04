import { Router } from 'express';
import * as controller from '../controllers/enroll.controller.js';
import isLoggedIn from '../middlewares/isLoggedin.js';

const router = Router();

router.post('/', isLoggedIn, controller.enrollInCourse);
router.get('/my-courses', isLoggedIn, controller.getMyCourses);

export default router;
