// In-memory replacement for the `settings` and `certificates` tables.
// Mirrors the original Laravel logic exactly — keep the public API stable.

// Seed mirrors what the React builder's serializeElements() produces: a
// `.certificate-layout-module` envelope with positioned `.draggable` children.
// That way the Builder can parse-and-edit the seeded content, and saved HTML
// round-trips through both pages without drift.
const DEFAULT_BUILDER_CONTENT = `
<div class="certificate-layout-module" style="position:relative;width:900px;height:600px;background:#fff;font-family:'Roboto',sans-serif;">
    <img class="certificate-template" src="" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;" />
    <div class="draggable" style="position:absolute;left:60px;top:60px;font-size:14px;color:#1fb6a6">{qr_code}</div>
    <div class="draggable" style="position:absolute;left:200px;top:90px;font-size:28px;color:#5b6172;text-align:center;letter-spacing:6px;font-weight:600;text-transform:uppercase">COURSE COMPLETION CERTIFICATE</div>
    <div class="draggable" style="position:absolute;left:120px;top:170px;font-size:18px;font-family:'Italianno', cursive;color:#9aa1ad;text-align:center;font-style:italic">This certificate is awarded to {student_name} in recognition of their successful completion of Course on {course_completion_date}. Your hard work, dedication, and commitment to learning have enabled you to achieve this milestone, and we are proud to recognize your accomplishment.</div>
    <div class="draggable" style="position:absolute;left:280px;top:290px;font-size:28px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic;font-weight:600">{course_title}</div>
    <div class="draggable" style="position:absolute;left:90px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{instructor_name}</div>
    <div class="draggable" style="position:absolute;left:350px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{course_completion_date}</div>
    <div class="draggable" style="position:absolute;left:610px;top:470px;font-size:16px;font-family:'Italianno', cursive;color:#1fb6a6;text-align:center;font-style:italic">{student_name}</div>
    <div class="draggable" style="position:absolute;left:350px;top:540px;font-size:12px;font-family:'Italianno', cursive;color:#9aa1ad;text-align:center;font-style:italic">{certificate_download_date}</div>
</div>
`;

let settings = {
    certificate_template: '',
    certificate_builder_content: DEFAULT_BUILDER_CONTENT.trim(),
};

let nextCertId = 1;
let certificates = [];

const users = {
    99: { id: 99, name: 'Demo Student', email: 'student@example.com' },
    1: { id: 1, name: 'Alex Johnson', email: 'alex@example.com' },
};

const courses = {
    101: {
        id: 101, title: 'Mastering React 18', slug: 'mastering-react-18',
        level: 'intermediate', language: 'english', user_id: 1,
        total_duration: '4h 30m', lesson_count: 24,
        instructors: [{ name: 'Alex Johnson' }],
    },
    102: {
        id: 102, title: 'Node.js & Express Fundamentals', slug: 'node-express-fundamentals',
        level: 'beginner', language: 'english', user_id: 1,
        total_duration: '3h 10m', lesson_count: 18,
        instructors: [{ name: 'Priya Sharma' }],
    },
};

const getSetting = (type) => settings[type] || '';

const setSetting = (type, description) => { settings[type] = description; };

const findUser = (id) => users[id] || { id, name: `User #${id}`, email: '' };
const findCourse = (id) => courses[id] || null;

const findCertById = (id) => certificates.find((c) => c.id === Number(id)) || null;
const findCertByIdentifier = (identifier) => certificates.find((c) => c.identifier === identifier) || null;
const findCertByPair = (userId, courseId) =>
    certificates.find((c) => c.user_id === Number(userId) && c.course_id === Number(courseId)) || null;

const listCerts = () => certificates.map((c) => ({
    ...c,
    user: findUser(c.user_id),
    course: findCourse(c.course_id),
}));

const createCert = ({ user_id, course_id, identifier }) => {
    const row = {
        id: nextCertId++,
        user_id: Number(user_id),
        course_id: Number(course_id),
        identifier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    certificates.push(row);
    return row;
};

const removeCert = (id) => {
    const i = certificates.findIndex((c) => c.id === Number(id));
    if (i < 0) return false;
    certificates.splice(i, 1);
    return true;
};

module.exports = {
    getSetting, setSetting,
    findUser, findCourse,
    findCertById, findCertByIdentifier, findCertByPair, listCerts,
    createCert, removeCert,
};
