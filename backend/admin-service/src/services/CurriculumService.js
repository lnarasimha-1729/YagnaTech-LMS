const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const sectionRepo = require('../repositories/SectionRepository');
const lessonRepo = require('../repositories/LessonRepository');
const questionRepo = require('../repositories/QuestionRepository');
const submissionRepo = require('../repositories/QuizSubmissionRepository');
const { Lesson, LessonCompletion, LessonWatchProgress, UserProgress } = require('../models');
const { removeFile } = require('../helpers/fileUploader');
const { HttpError } = require('../middlewares/error');

const PUBLIC_ROOT = path.join(__dirname, '..', '..');

// Move an uploaded temp file to its destination. rename() throws EXDEV when
// src (container overlay /app/tmp) and dest (mounted Docker volume
// /app/uploads) are on different filesystems — the prod case — so fall back to
// copy+unlink, which works across devices.
const moveFile = (srcPath, destPath) => {
    try {
        fs.renameSync(srcPath, destPath);
    } catch (err) {
        if (err.code !== 'EXDEV') throw err;
        fs.copyFileSync(srcPath, destPath);
        fs.unlinkSync(srcPath);
    }
};

const pad2 = (n) => String(n).padStart(2, '0');
const formatDuration = (d) => {
    if (!d) return '00:00:00';
    const p = String(d).split(':');
    if (p.length !== 3) return '00:00:00';
    return `${pad2(p[0])}:${pad2(p[1])}:${pad2(p[2])}`;
};

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const randomToken = (len = 4) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
};

const fileExt = (filename) => {
    const i = filename.lastIndexOf('.');
    return i >= 0 ? filename.slice(i + 1).toLowerCase() : '';
};

const uniqueName = (originalname) => `${Math.floor(Date.now() / 1000)}${randomToken(4)}.${fileExt(originalname)}`;

const moveTo = (file, relDir) => {
    const dir = path.join(PUBLIC_ROOT, relDir);
    ensureDir(dir);
    const name = uniqueName(file.originalname);
    moveFile(file.path, path.join(dir, name));
    return name;
};

const removeDir = (relPath) => {
    if (!relPath) return;
    const full = path.join(PUBLIC_ROOT, relPath);
    if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
};

const handleScormUpload = (file) => {
    const dir = 'uploads/lesson_file/scorm_content';
    const fullDir = path.join(PUBLIC_ROOT, dir);
    ensureDir(fullDir);
    const fileName = uniqueName(file.originalname);
    const zipPath = path.join(fullDir, fileName);
    moveFile(file.path, zipPath);
    const folderName = fileName.replace(/\.[^.]+$/, '');
    const extractPath = path.join(fullDir, folderName);
    try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);
        fs.unlinkSync(zipPath);
        return folderName;
    } catch (_e) {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        throw new HttpError(500, 'Failed to extract the SCORM file.');
    }
};

const pickFile = (files, key) => files && files[key] && files[key][0];
// Returns the full array of uploaded files under `key`, or an empty array.
// Used by the image-lesson path which now accepts 1..N images per lesson.
const pickFiles = (files, key) => (files && files[key]) ? files[key] : [];

// Image lessons store one of:
//   - a JSON array of filenames (new multi-image format)
//   - a single filename string (legacy single-image rows pre-multi)
// Both are normalised to a string[] here so delete / update paths don't
// need to branch.
const parseImageAttachment = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return [];
    if (s.startsWith('[')) {
        try {
            const arr = JSON.parse(s);
            return Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
        } catch { return []; }
    }
    return [s];
};

// ===== Sections =====

const listByCourse = async (course_id) => {
    const sections = await sectionRepo.findByCourse(course_id);
    const ids = sections.map((s) => s.id);
    const lessons = await lessonRepo.findBySectionIds(ids);
    const grouped = sections.map((s) => ({
        ...s.toJSON(),
        lessons: lessons.filter((l) => l.section_id === s.id).map((l) => l.toJSON()),
    }));
    return { sections: grouped };
};

const createSection = async ({ course_id, title, user_id }) => {
    if (!title) throw new HttpError(422, 'Title is required');
    const last = await sectionRepo.findLastSort(course_id);
    const section = await sectionRepo.create({
        course_id,
        title,
        user_id: user_id || null,
        sort: (last ? last.sort : 0) + 1,
    });
    return { message: 'Section added successfully', section };
};

const updateSection = async ({ section_id, up_title }) => {
    const s = await sectionRepo.findById(section_id);
    if (!s) throw new HttpError(404, 'Section not found');
    await s.update({ title: up_title });
    return { message: 'update successfully', section: s };
};

const deleteSection = async (id) => {
    const s = await sectionRepo.findById(id);
    if (!s) throw new HttpError(404, 'Section not found');
    // lessons.section_id FKs to sections with NO ACTION (no DB cascade), so the
    // section's lessons must be removed first or s.destroy() trips
    // ER_ROW_IS_REFERENCED_2. Route each through deleteLesson so their own
    // child rows (quiz, watch-progress, completions, files) are cleaned up too.
    const lessons = await Lesson.findAll({ where: { section_id: s.id } });
    for (const lesson of lessons) {
        await deleteLesson(lesson.id);
    }
    await s.destroy();
    return { message: 'Delete successfully' };
};

const sortSections = async (rawIds) => {
    const arr = Array.isArray(rawIds) ? rawIds : JSON.parse(rawIds);
    for (let i = 0; i < arr.length; i++) {
        await sectionRepo.updateSort(arr[i], i + 1);
    }
    return { message: 'Sections sorted successfully' };
};

// ===== Lessons =====

const buildLessonData = (b, files) => {
    const data = {
        title: b.title,
        user_id: b.user_id || null,
        course_id: b.course_id,
        section_id: b.section_id,
        is_free: b.free_lesson ? 1 : 0,
        lesson_type: b.lesson_type,
        summary: b.summary || null,
    };

    switch (b.lesson_type) {
        case 'text':
            data.attachment = b.text_description;
            data.attachment_type = b.lesson_provider;
            break;
        case 'video-url':
        case 'html5':
        case 'vimeo-url':
        case 'google_drive':
            data.video_type = b.lesson_provider;
            data.lesson_src = b.lesson_src;
            data.duration = formatDuration(b.duration);
            break;
        case 'iframe':
            data.lesson_src = b.iframe_source;
            break;
        case 'document_type': {
            const f = pickFile(files, 'attachment');
            if (f) {
                data.attachment = moveTo(f, 'uploads/lesson_file/attachment');
                data.attachment_type = b.attachment_type;
            }
            break;
        }
        case 'image': {
            // Image lessons accept 1..N files. We always persist as a JSON
            // array in `attachment` (even for a single file) so the player
            // has one render path. attachment_type stays as the extension of
            // the FIRST file for legacy filters that read it; multi-extension
            // galleries (e.g. PNG + JPG) still render correctly because the
            // player uses each filename's own extension.
            const fs_ = pickFiles(files, 'attachment');
            if (fs_.length) {
                const names = fs_.map((f) => moveTo(f, 'uploads/lesson_file/attachment'));
                data.attachment = JSON.stringify(names);
                data.attachment_type = fileExt(fs_[0].originalname);
            }
            break;
        }
        case 'scorm': {
            const f = pickFile(files, 'scorm_file');
            if (f) {
                data.attachment = handleScormUpload(f);
                data.attachment_type = b.scorm_provider;
            }
            break;
        }
        case 'system-video': {
            const f = pickFile(files, 'system_video_file');
            if (f) {
                const name = moveTo(f, 'uploads/lesson_file/videos');
                data.lesson_src = `uploads/lesson_file/videos/${name}`;
            }
            data.video_type = b.lesson_provider;
            data.duration = formatDuration(b.duration);
            break;
        }
        default:
            throw new HttpError(400, `Unknown lesson type '${b.lesson_type}'`);
    }
    return data;
};

const createLesson = async ({ body, files }) => {
    const b = body;
    if (!b.title) throw new HttpError(422, 'Title is required');
    if (!b.course_id || !b.section_id) throw new HttpError(422, 'course_id and section_id required');

    const last = await lessonRepo.findLastSortInCourse(b.course_id);
    const data = buildLessonData(b, files);
    data.sort = (last ? last.sort : 0) + 1;

    const lesson = await lessonRepo.create(data);
    return { message: 'lesson added successfully', lesson };
};

const updateLesson = async ({ body, files }) => {
    const b = body;
    const lesson = await lessonRepo.findById(b.id);
    if (!lesson) throw new HttpError(404, 'Lesson not found');

    const data = {
        title: b.title,
        section_id: b.section_id,
        summary: b.summary,
    };

    switch (b.lesson_type) {
        case 'text':
            data.attachment = b.text_description;
            break;
        case 'video-url':
        case 'html5':
        case 'vimeo-url':
        case 'google_drive':
            data.lesson_src = b.lesson_src;
            data.duration = formatDuration(b.duration);
            break;
        case 'iframe':
            data.lesson_src = b.iframe_source;
            break;
        case 'document_type': {
            const f = pickFile(files, 'attachment');
            if (f) {
                if (lesson.attachment) removeFile(`uploads/lesson_file/attachment/${lesson.attachment}`);
                data.attachment = moveTo(f, 'uploads/lesson_file/attachment');
                data.attachment_type = b.attachment_type;
            }
            break;
        }
        case 'image': {
            // Edit semantics: new uploads are APPENDED to the existing set,
            // not a replacement. So an admin who already saved 3 images and
            // uploads 2 more ends up with 5. No upload → existing column is
            // left untouched. Deletion of individual images happens via the
            // explicit `remove_images` body field (JSON array of filenames).
            const fs_ = pickFiles(files, 'attachment');
            const existing = parseImageAttachment(lesson.attachment);
            const toRemove = (() => {
                try {
                    const raw = b.remove_images;
                    if (!raw) return [];
                    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    return Array.isArray(arr) ? arr.map(String) : [];
                } catch { return []; }
            })();

            let touched = false;
            let next = existing;

            // 1. Drop any filenames the admin asked to remove. Delete their
            //    physical files first so the disk doesn't leak orphans.
            if (toRemove.length) {
                toRemove.forEach((name) => {
                    if (existing.includes(name)) {
                        removeFile(`uploads/lesson_file/attachment/${name}`);
                    }
                });
                next = next.filter((n) => !toRemove.includes(n));
                touched = true;
            }

            // 2. Append any newly uploaded files to the end of the set.
            if (fs_.length) {
                const added = fs_.map((f) => moveTo(f, 'uploads/lesson_file/attachment'));
                next = [...next, ...added];
                touched = true;
                // Keep attachment_type aligned with the first image overall
                // (existing set takes precedence; falls back to first new).
                if (!lesson.attachment_type) {
                    data.attachment_type = fileExt(fs_[0].originalname);
                }
            }

            if (touched) data.attachment = JSON.stringify(next);
            break;
        }
        case 'scorm': {
            const f = pickFile(files, 'scorm_file');
            if (f) {
                if (lesson.attachment) removeDir(`uploads/lesson_file/scorm_content/${lesson.attachment}`);
                data.attachment = handleScormUpload(f);
                data.attachment_type = b.scorm_provider;
            }
            break;
        }
        case 'system-video': {
            const f = pickFile(files, 'system_video_file');
            if (f) {
                if (lesson.lesson_src) removeFile(lesson.lesson_src);
                const name = moveTo(f, 'uploads/lesson_file/videos');
                data.lesson_src = `uploads/lesson_file/videos/${name}`;
            }
            data.duration = formatDuration(b.duration);
            break;
        }
        default:
            throw new HttpError(400, `Unknown lesson type '${b.lesson_type}'`);
    }

    await lesson.update(data);
    return { message: 'lesson update successfully', lesson };
};

const sortLessons = async (rawIds) => {
    const arr = Array.isArray(rawIds) ? rawIds : JSON.parse(rawIds);
    for (let i = 0; i < arr.length; i++) {
        await lessonRepo.updateSort(arr[i], i + 1);
    }
    return { message: 'Lessons sorted successfully' };
};

const deleteLesson = async (id) => {
    const lesson = await lessonRepo.findById(id);
    if (!lesson) throw new HttpError(404, 'Lesson not found');

    if (lesson.lesson_type === 'scorm' && lesson.attachment) {
        removeDir(`uploads/lesson_file/scorm_content/${lesson.attachment}`);
    } else if (lesson.attachment && lesson.lesson_type === 'document_type') {
        removeFile(`uploads/lesson_file/attachment/${lesson.attachment}`);
    } else if (lesson.attachment && lesson.lesson_type === 'image') {
        // Image lessons may store multiple filenames as a JSON array;
        // parseImageAttachment normalises legacy single-string rows too.
        parseImageAttachment(lesson.attachment).forEach((name) => {
            removeFile(`uploads/lesson_file/attachment/${name}`);
        });
    }
    if (lesson.lesson_src && lesson.lesson_type === 'system-video') {
        removeFile(lesson.lesson_src);
    }

    if (lesson.lesson_type === 'quiz') {
        await questionRepo.destroyByQuiz(lesson.id);
        await submissionRepo.destroyByQuiz(lesson.id);
    }

    // Remove the student-progress rows that FK back to this lesson, otherwise
    // lesson.destroy() trips ER_ROW_IS_REFERENCED_2 (fk_lesson_completions_lesson
    // / fk_lwp_lesson) once anyone has watched or completed the lesson. These
    // tables are populated by the player's progress/complete endpoints.
    await LessonCompletion.destroy({ where: { lesson_id: lesson.id } });
    await LessonWatchProgress.destroy({ where: { lesson_id: lesson.id } });
    // user_progress.last_lesson_id also FKs to lessons (fk_user_progress_last_lesson).
    // Null it out for any student whose resume-point was this lesson rather than
    // deleting their enrollment row.
    await UserProgress.update(
        { last_lesson_id: null },
        { where: { last_lesson_id: lesson.id } },
    );

    await lesson.destroy();
    return { message: 'Deleted successfully' };
};

const showLesson = async (id) => {
    const lesson = await lessonRepo.findById(id);
    if (!lesson) throw new HttpError(404, 'Lesson not found');
    return { lesson };
};

module.exports = {
    listByCourse,
    createSection,
    updateSection,
    deleteSection,
    sortSections,
    createLesson,
    updateLesson,
    sortLessons,
    deleteLesson,
    showLesson,
};
