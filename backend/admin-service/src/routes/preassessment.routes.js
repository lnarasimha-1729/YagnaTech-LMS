const router = require('express').Router();
const ctrl = require('../controllers/PreAssessmentController');

router.post('/pre-assessment/submit', ctrl.submit);
router.get('/pre-assessment/status/:programId', ctrl.status);

module.exports = router;
