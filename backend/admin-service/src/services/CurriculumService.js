const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const sectionRepo = require('../repositories/SectionRepository');
const lessonRepo = require('../repositories/LessonRepository');
const questionRepo = require('../repositories/QuestionRepository');
const submissionRepo = require('../repositories/QuizSubmissionRepository');
const { removeFile } = require('../helpers/fileUploader');
const { HttpError } = require('../middlewares/error');

const PUBLIC_ROOT = path.join(__dirname, '..', '..');

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
    fs.renameSync(file.path, path.join(dir, name));
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
    fs.renameSync(file.path, zipPath);
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
            const f = pickFile(files, 'attachment');
            if (f) {
                data.attachment = moveTo(f, 'uploads/lesson_file/attachment');
                data.attachment_type = fileExt(f.originalname);
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
            const f = pickFile(files, 'attachment');
            if (f) {
                if (lesson.attachment) removeFile(`uploads/lesson_file/attachment/${lesson.attachment}`);
                data.attachment = moveTo(f, 'uploads/lesson_file/attachment');
                data.attachment_type = fileExt(f.originalname);
            }
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
    } else if (lesson.attachment && (lesson.lesson_type === 'document_type' || lesson.lesson_type === 'image')) {
        removeFile(`uploads/lesson_file/attachment/${lesson.attachment}`);
    }
    if (lesson.lesson_src && lesson.lesson_type === 'system-video') {
        removeFile(lesson.lesson_src);
    }

    if (lesson.lesson_type === 'quiz') {
        await questionRepo.destroyByQuiz(lesson.id);
        await submissionRepo.destroyByQuiz(lesson.id);
    }

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
