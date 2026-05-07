import { Router } from 'express';
import * as controller from '../controllers/college.controller.js';
import isLoggedIn from '../middlewares/isLoggedin.js';
import authRoles from '../middlewares/authRoles.js';

const router = Router();

router.post('/add', isLoggedIn, authRoles(['admin']), controller.addCollege);
// Students need to read the list to pick their college on the profile page —
// the College Admin dashboard keys aggregations on the clgId they choose,
// so a free-text college name would never aggregate. Read access only;
// add/update/delete remain admin-only below.
router.get('/all', isLoggedIn, authRoles(['admin', 'student', 'user', 'instructor']), controller.getAllColleges);
router.get('/:clgId', isLoggedIn, authRoles(['admin', 'user']), controller.getCollegeById);
router.put('/update/:clgId', isLoggedIn, authRoles(['admin', 'user']), controller.updateCollege);
router.delete('/delete/:clgId', isLoggedIn, authRoles(['admin']), controller.deleteCollege);

export default router;
