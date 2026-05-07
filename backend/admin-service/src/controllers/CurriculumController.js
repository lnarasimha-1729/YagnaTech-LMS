const curriculumService = require('../services/CurriculumService');
const { asyncHandler } = require('../middlewares/error');

// Sections

exports.sections_by_course = asyncHandler(async (req, res) => {
    res.json(await curriculumService.listByCourse(req.params.course_id));
});

exports.section_store = asyncHandler(async (req, res) => {
    const { course_id, title, user_id } = req.body;
    const result = await curriculumService.createSection({ course_id, title, user_id });
    res.status(201).json(result);
});

exports.section_update = asyncHandler(async (req, res) => {
    const { section_id, up_title } = req.body;
    res.json(await curriculumService.updateSection({ section_id, up_title }));
});

exports.section_delete = asyncHandler(async (req, res) => {
    res.json(await curriculumService.deleteSection(req.params.id));
});

exports.section_sort = asyncHandler(async (req, res) => {
    const ids = req.body.itemJSON || req.body.ids || [];
    res.json(await curriculumService.sortSections(ids));
});

// Lessons

exports.lesson_store = asyncHandler(async (req, res) => {
    const result = await curriculumService.createLesson({ body: req.body, files: req.files });
    res.status(201).json(result);
});

exports.lesson_update = asyncHandler(async (req, res) => {
    res.json(await curriculumService.updateLesson({ body: req.body, files: req.files }));
});

exports.lesson_show = asyncHandler(async (req, res) => {
    res.json(await curriculumService.showLesson(req.params.id));
});

exports.lesson_delete = asyncHandler(async (req, res) => {
    res.json(await curriculumService.deleteLesson(req.params.id));
});

exports.lesson_sort = asyncHandler(async (req, res) => {
    const ids = req.body.itemJSON || req.body.ids || [];
    res.json(await curriculumService.sortLessons(ids));
});
