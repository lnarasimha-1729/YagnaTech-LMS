const { PreAssessmentResult } = require('../models');
const { asyncHandler } = require('../middlewares/error');

const PASS_THRESHOLD = 60; // percentage required to unlock the program (matches Assesments.jsx UI)

// POST /pre-assessment/submit
// body: { program_id?, score }   user_id comes from auth middleware (req.user.id)
exports.submit = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const score = Number(req.body.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
        return res.status(422).json({ error: 'score must be a number between 0 and 100' });
    }

    const programId = req.body.program_id != null ? Number(req.body.program_id) : null;
    const passed = score >= PASS_THRESHOLD;

    // Upsert: keep a single row per (user, program). Persist the most recent attempt.
    const where = { user_id: userId, program_id: programId };
    let row = await PreAssessmentResult.findOne({ where });
    if (row) {
        await row.update({ score, passed });
    } else {
        row = await PreAssessmentResult.create({ ...where, score, passed });
    }

    return res.json({
        program_id: programId,
        score: row.score,
        passed: row.passed,
        threshold: PASS_THRESHOLD,
    });
});

// GET /pre-assessment/status/:programId
// programId may be 'global' (or any non-numeric) to check the user's overall pre-assessment state.
exports.status = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const raw = req.params.programId;
    const programId = Number(raw);
    const where = { user_id: userId };

    if (Number.isFinite(programId)) {
        // Per-program: passed if either the per-program row OR any global row has passed.
        const [perProgram, anyPassed] = await Promise.all([
            PreAssessmentResult.findOne({ where: { ...where, program_id: programId } }),
            PreAssessmentResult.findOne({ where: { ...where, passed: true } }),
        ]);
        const passed = !!(perProgram?.passed || anyPassed);
        return res.json({
            program_id: programId,
            passed,
            score: perProgram?.score ?? anyPassed?.score ?? null,
            threshold: PASS_THRESHOLD,
        });
    }

    // Global / unknown program: pass if user has ever passed.
    const anyPassed = await PreAssessmentResult.findOne({ where: { ...where, passed: true } });
    return res.json({
        program_id: null,
        passed: !!anyPassed,
        score: anyPassed?.score ?? null,
        threshold: PASS_THRESHOLD,
    });
});
