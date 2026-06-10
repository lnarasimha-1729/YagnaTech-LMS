const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const authDb = require('../config/authDatabase');
const assessmentDb = require('../config/assessmentDatabase');
const { upload, removeFile, niceFileName } = require('../helpers/fileUploader');
const { HttpError } = require('../middlewares/error');

// Students sign up through auth-service, which writes to lucy_devdb.users
// (string userId PK, roleId -> roles table). The admin "Manage Students"
// page must therefore read from THAT table, not admin-service's own
// lms_admin.users. We query the auth DB read-only via authDb and map the
// columns to the shape the existing frontend table expects (id, name,
// email, phone, photo, enrolled_count) so no UI change is needed.
const list = async ({ page = 1, per_page = 10, search = '', college = '', batch = '' }) => {
    const limit = Number(per_page);
    const offset = (Number(page) - 1) * limit;
    try {
        const like = `%${String(search).trim()}%`;
        const searchClause = search
            ? 'AND (u.name LIKE :like OR u.email LIKE :like)'
            : '';

        // Filter by the resolved college name (exact match on what the
        // dropdown shows). Same COALESCE expression as the SELECT so the
        // filter matches exactly what's displayed. The colleges JOIN is
        // always present so the count stays consistent with the rows.
        const collegeName = String(college).trim();
        const collegeClause = collegeName
            ? "AND COALESCE(c.clgName, NULLIF(TRIM(u.collegeName), '')) = :college"
            : '';

        // Only APPROVED students show in Manage Students — for BOTH the
        // college-scoped view (college admin approves in Student Requests) and
        // the root-admin view. Pending/unapproved signups stay out of the list
        // until approved.
        const approvedClause = 'AND u.isApproved = 1';

        const [{ count }] = await authDb.query(
            `SELECT COUNT(*) AS count
               FROM users u
               JOIN roles r ON r.roleId = u.roleId
               LEFT JOIN colleges c ON c.clgId = u.collegeId
              WHERE r.role = 'student' ${searchClause} ${collegeClause} ${approvedClause}`,
            { replacements: { like, college: collegeName }, type: QueryTypes.SELECT }
        );

        // Pre-assessment score AND time-taken now live in the student schema
        // itself (users.preScore / users.preScoreDuration), written by the
        // auth-service prescore endpoint. We read them straight off the user
        // row — no cross-DB join needed for the value the UI shows.
        // College the student picked in their profile: ProfilePage saves the
        // chosen clgId into users.collegeId, so we LEFT JOIN the colleges
        // table (same lucy_devdb) to resolve its display name. Fallbacks:
        // matched clgName → any free-text collegeName they typed → null.
        const rows = await authDb.query(
            `SELECT u.userId AS id, u.name, u.email, u.phone,
                    u.createdAt, u.preScore, u.preScoreDuration,
                    u.postScore, u.postScoreDuration,
                    u.studentPhoto,
                    -- Program the student picked at signup (display-only).
                    u.programInterested AS program_interested,
                    -- Graduation year doubles as the student's batch on the
                    -- Manage Students table; no separate batch column exists.
                    u.graduationYear  AS batch,
                    COALESCE(c.clgName, NULLIF(TRIM(u.collegeName), '')) AS college,
                    pr.program AS program_request,
                    pr.status  AS program_request_status
               FROM users u
               JOIN roles r ON r.roleId = u.roleId
               LEFT JOIN colleges c ON c.clgId = u.collegeId
               LEFT JOIN program_requests pr ON pr.user_id = u.userId
              WHERE r.role = 'student' ${searchClause} ${collegeClause} ${approvedClause}
              ORDER BY
                  -- 1. Group same-college students together (A→Z); students
                  --    with no college fall to the very end.
                  (COALESCE(c.clgName, NULLIF(TRIM(u.collegeName), '')) IS NULL) ASC,
                  COALESCE(c.clgName, NULLIF(TRIM(u.collegeName), '')) ASC,
                  -- 2. Within a college: highest pre-assessment score first;
                  --    students who haven't taken it sink below scored ones.
                  (u.preScore IS NULL) ASC,
                  u.preScore DESC,
                  -- 3. Tie-break equal scores by lowest time taken; rows
                  --    without a recorded duration come after timed ones.
                  (u.preScoreDuration IS NULL) ASC,
                  u.preScoreDuration ASC,
                  -- Stable final order for otherwise-identical rows.
                  u.createdAt DESC
              LIMIT :limit OFFSET :offset`,
            { replacements: { like, college: collegeName, limit, offset }, type: QueryTypes.SELECT }
        );

        // Optional enrichment: pre_assessment_results (admin DB) still holds
        // pass/fail + the attempt timestamp, which the student schema doesn't.
        const ids = rows.map((r) => String(r.id));
        let metaByUser = {};
        // Map of userId -> [{id, title, slug}, ...] for enrolled courses,
        // resolved from user_progress + courses (both in the admin DB).
        let enrolledByUser = {};
        // Map of userId -> { issued, count, latest_issued_at } for the
        // certificate column.
        let certByUser = {};
        // Map of userId -> selectedProgram from pre_assessment_registrations
        // (assessment-service DB). This is the SOURCE OF TRUTH for the
        // student's program of interest — the legacy users.programInterested
        // column is kept as a fallback for pre-registration accounts.
        let programInterestedByUser = {};
        // Map of userId -> batch name from batch_members + batches (admin DB).
        // A student in multiple batches surfaces the most recently joined one.
        let batchByUser = {};
        if (ids.length) {
            const pre = await sequelize.query(
                `SELECT user_id, passed, created_at
                   FROM pre_assessment_results
                  WHERE user_id IN (:ids)
                  ORDER BY created_at ASC`,
                { replacements: { ids }, type: QueryTypes.SELECT }
            );
            metaByUser = pre.reduce((acc, p) => {
                acc[String(p.user_id)] = {
                    passed: Boolean(p.passed),
                    taken_at: p.created_at,
                };
                return acc;
            }, {});

            // Enrolled courses: join user_progress (the cross-DB integer
            // user_id column stores the student's userId) with courses to get
            // the title + slug for the table. Best-effort — a DB miss just
            // shows an empty list for that row.
            try {
                const enrolled = await sequelize.query(
                    `SELECT up.user_id, c.id AS course_id, c.title, c.slug
                       FROM user_progress up
                       JOIN courses c ON c.id = up.course_id
                      WHERE up.enrolled = 1
                        AND up.user_id IN (:ids)`,
                    { replacements: { ids }, type: QueryTypes.SELECT }
                );
                enrolledByUser = enrolled.reduce((acc, e) => {
                    const key = String(e.user_id);
                    if (!acc[key]) acc[key] = [];
                    acc[key].push({ id: e.course_id, title: e.title, slug: e.slug });
                    return acc;
                }, {});

                // Per-course completion for the "Course Status" column. We need
                // two tallies: total lessons per course, and lessons each
                // student has completed per course. A course is "Completed"
                // when completed >= total (100%), mirroring the player's
                // progress + certificate gate. Best-effort — failures leave
                // progress at 0 rather than breaking the student list.
                const courseIds = [...new Set(enrolled.map((e) => e.course_id))];
                if (courseIds.length) {
                    const totals = await sequelize.query(
                        `SELECT course_id, COUNT(*) AS total
                           FROM lessons
                          WHERE course_id IN (:cids)
                          GROUP BY course_id`,
                        { replacements: { cids: courseIds }, type: QueryTypes.SELECT }
                    );
                    const totalByCourse = Object.fromEntries(
                        totals.map((t) => [Number(t.course_id), Number(t.total) || 0])
                    );

                    // Count completed lessons by JOINing through `lessons` so a
                    // completion only counts when the lesson STILL EXISTS and
                    // STILL BELONGS to that course. lesson_completions.course_id
                    // alone can drift (stale rows, a lesson re-homed to another
                    // course), which would let `completed` exceed `total` and
                    // push the percentage past 100%. The join makes the numerator
                    // and denominator come from the same source of truth (the
                    // course's current lesson set). DISTINCT lesson_id guards
                    // against any duplicate completion rows.
                    const done = await sequelize.query(
                        `SELECT lc.user_id, l.course_id,
                                COUNT(DISTINCT lc.lesson_id) AS completed
                           FROM lesson_completions lc
                           JOIN lessons l ON l.id = lc.lesson_id
                          WHERE lc.user_id IN (:ids)
                            AND l.course_id IN (:cids)
                          GROUP BY lc.user_id, l.course_id`,
                        { replacements: { ids, cids: courseIds }, type: QueryTypes.SELECT }
                    );
                    const doneByKey = Object.fromEntries(
                        done.map((d) => [`${d.user_id}:${Number(d.course_id)}`, Number(d.completed) || 0])
                    );

                    // Annotate each enrolled-course entry with lesson counts,
                    // a completion percentage and a status label.
                    Object.entries(enrolledByUser).forEach(([uid, courses]) => {
                        courses.forEach((c) => {
                            const total = totalByCourse[Number(c.id)] || 0;
                            // Clamp to total so progress can never read above 100%
                            // even if a stray completion slips past the join.
                            const completed = Math.min(
                                doneByKey[`${uid}:${Number(c.id)}`] || 0,
                                total,
                            );
                            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                            c.total_lessons = total;
                            c.completed_lessons = completed;
                            c.progress_pct = pct;
                            c.status = total > 0 && completed >= total
                                ? 'completed'
                                : completed > 0
                                    ? 'in_progress'
                                    : 'not_started';
                        });
                    });
                }
            } catch (err) {
                console.warn('[students] enrolled courses lookup failed:', err.message);
            }

            // Certificates issued to the listed students. One row per (user,
            // course) — we collapse to a "Issued / Not issued" badge for the
            // table column. Best-effort: a DB miss just shows "Not issued".
            try {
                const certs = await sequelize.query(
                    `SELECT user_id, COUNT(*) AS issued_count,
                            MAX(issued_at) AS latest_issued_at
                       FROM certificates
                      WHERE user_id IN (:ids)
                        AND status = 1
                      GROUP BY user_id`,
                    { replacements: { ids }, type: QueryTypes.SELECT }
                );
                certByUser = certs.reduce((acc, c) => {
                    acc[String(c.user_id)] = {
                        issued: Number(c.issued_count) > 0,
                        count: Number(c.issued_count) || 0,
                        latest_issued_at: c.latest_issued_at || null,
                    };
                    return acc;
                }, {});
            } catch (err) {
                console.warn('[students] certificates lookup failed:', err.message);
            }

            // Program of interest: read from the pre-assessment onboarding
            // form (assessment-service DB). Latest registration per student
            // wins — if a student has registered more than once we want the
            // most recent selection. Falls back to users.programInterested
            // at row-shape time if no registration exists.
            try {
                const regs = await assessmentDb.query(
                    `SELECT userId, selectedProgram, createdAt
                       FROM pre_assessment_registrations
                      WHERE userId IN (:ids)
                      ORDER BY createdAt DESC`,
                    { replacements: { ids }, type: QueryTypes.SELECT }
                );
                // First write wins because the query is sorted DESC by
                // createdAt — so we get the most recent registration per user.
                programInterestedByUser = regs.reduce((acc, r) => {
                    const key = String(r.userId);
                    if (!acc[key]) acc[key] = r.selectedProgram;
                    return acc;
                }, {});
            } catch (err) {
                // Surface the full error — a silent warning is what masked the
                // missing ASSESSMENT_DB_NAME env var that broke this lookup.
                console.error(
                    '[students] pre-assessment registration lookup failed:',
                    err.message,
                    '\n  Check ASSESSMENT_DB_NAME in admin-service .env (table',
                    'pre_assessment_registrations lives in lucy_devdb).'
                );
            }

            try {
                const batches = await sequelize.query(
                    `SELECT bm.user_id, b.name, bm.created_at
                       FROM batch_members bm
                       JOIN batches b ON b.id = bm.batch_id
                      WHERE bm.user_id IN (:ids)
                      ORDER BY bm.created_at DESC`,
                    { replacements: { ids }, type: QueryTypes.SELECT }
                );
                batchByUser = batches.reduce((acc, b) => {
                    const key = String(b.user_id);
                    if (!acc[key]) acc[key] = b.name;
                    return acc;
                }, {});
            } catch (err) {
                console.warn('[students] batch lookup failed:', err.message);
            }
        }

        // Same threshold as PreAssessmentController.PASS_THRESHOLD. We derive
        // passed from the score we actually display so the badge can't
        // disagree with the number next to it (the pre_assessment_results
        // row is only used for taken_at and can lag behind preScore when a
        // student retakes the assessment).
        const PASS_THRESHOLD = 60;
        const students = rows.map((r) => {
            const meta = metaByUser[String(r.id)] || {};
            // A student "has" a pre-assessment if a score is recorded on their
            // schema row (preScore is set on submit alongside the duration).
            const hasPre = r.preScore != null;
            const score = hasPre ? Number(r.preScore) : null;
            // studentPhoto is the relative upload path (e.g.
            // uploads/users/student/foo.jpg) served from admin-service's
            // /uploads mount. The frontend (Index.jsx avatarUrl) prepends
            // VITE_ADMIN_API_URL. null → frontend falls back to initials.
            const { studentPhoto, ...rest } = r;
            const enrolledCourses = enrolledByUser[String(r.id)] || [];
            // Post-assessment uses the same pass threshold as pre-assessment.
            // No duration column exists for post, so we omit it.
            const hasPost = r.postScore != null;
            const postScore = hasPost ? Number(r.postScore) : null;
            const cert = certByUser[String(r.id)] || null;
            // Prefer the value from the pre-assessment registration form;
            // fall back to the legacy column so pre-registration accounts
            // still surface something.
            const programInterestedFromReg = programInterestedByUser[String(r.id)] || null;
            const batchName = batchByUser[String(r.id)] || null;
            return {
                ...rest,
                batch: batchName || rest.batch || null,
                program_interested: programInterestedFromReg || rest.program_interested || null,
                photo: studentPhoto || null,
                enrolled_courses: enrolledCourses,
                enrolled_count: enrolledCourses.length,
                pre_assessment: hasPre
                    ? {
                        score,
                        duration_seconds:
                            r.preScoreDuration == null ? null : Number(r.preScoreDuration),
                        passed: score >= PASS_THRESHOLD,
                        taken_at: meta.taken_at ?? null,
                    }
                    : null,
                post_assessment: hasPost
                    ? {
                        score: postScore,
                        duration_seconds:
                            r.postScoreDuration == null ? null : Number(r.postScoreDuration),
                        passed: postScore >= PASS_THRESHOLD,
                    }
                    : null,
                certificate: cert || { issued: false, count: 0, latest_issued_at: null },
            };
        });

        // Batch filter is applied here (post-enrichment) because batches live
        // in the admin DB while the user list runs against authDb — a cross-
        // DB JOIN isn't available. Per_page is already high (1000) so the
        // in-memory filter has no real cost, and `total` is rewritten so the
        // "Showing X of Y" line stays honest.
        const batchName = String(batch || '').trim();
        if (batchName) {
            const filtered = students.filter((s) => s.batch === batchName);
            return { students: filtered, total: filtered.length, page: Number(page), per_page: limit };
        }

        return { students, total: Number(count), page: Number(page), per_page: limit };
    } catch (err) {
        console.warn('[students] auth DB query failed:', err.message);
        return { students: [], total: 0, page: Number(page), per_page: limit };
    }
};

const get = async (id) => {
    const rows = await authDb.query(
        `SELECT u.userId AS id, u.name, u.email, u.phone, u.dob, u.gender,
                u.educationLevel, u.branch, u.collegeName, u.collegeId,
                u.graduationYear, u.collegeCode, u.programInterested,
                u.studentPhoto, u.createdAt
           FROM users u
           JOIN roles r ON r.roleId = u.roleId
          WHERE r.role = 'student' AND u.userId = :id
          LIMIT 1`,
        { replacements: { id: String(id) }, type: QueryTypes.SELECT }
    );
    if (!rows.length) throw new HttpError(404, 'Student not found');
    // Same shape as list(): photo is the relative upload path or null.
    // Used by the Edit Student page to preview the current image.
    const { studentPhoto, ...rest } = rows[0];
    return { student: { ...rest, photo: studentPhoto || null } };
};

// 11-char userId, same pattern as auth-service's generateUserID ("20" + 9
// digits). Inlined so admin-service doesn't depend on the auth service code.
const generateUserId = () => {
    const n = Math.floor(100000000 + Math.random() * 900000000);
    return `20${n}`;
};

const resolveStudentRoleId = async () => {
    const rows = await authDb.query(
        "SELECT roleId FROM roles WHERE role = :role LIMIT 1",
        { replacements: { role: 'student' }, type: QueryTypes.SELECT }
    );
    if (!rows.length) throw new HttpError(500, "student role not found in roles table");
    return rows[0].roleId;
};

const isAuthEmailTaken = async (email) => {
    const rows = await authDb.query(
        "SELECT 1 FROM users WHERE email = :email LIMIT 1",
        { replacements: { email }, type: QueryTypes.SELECT }
    );
    return rows.length > 0;
};

// Students added from Manage Students must land in the same auth-service
// users table the list() query reads from (lucy_devdb.users), otherwise the
// new row never appears in the admin students grid. Mirrors InstructorService.
const create = async (body, file) => {
    if (!body.name || !body.email || !body.password) {
        throw new HttpError(422, 'Name, email, and password are required');
    }
    if (String(body.password).length < 8) {
        throw new HttpError(422, 'Password must be at least 8 characters');
    }
    if (await isAuthEmailTaken(body.email)) {
        throw new HttpError(422, 'Email already in use');
    }

    const roleId = await resolveStudentRoleId();
    const userId = generateUserId();
    const passwordHash = await bcrypt.hash(body.password, 10);

    let studentPhoto = null;
    if (file) {
        const ext = (file.originalname || '').split('.').pop() || 'jpg';
        const destPath = `uploads/users/student/${niceFileName(body.name, ext)}`;
        await upload(file, destPath, 400, 400);
        studentPhoto = destPath;
    }

    await authDb.query(
        `INSERT INTO users
            (userId, name, email, passwordHash, phone, roleId,
             collegeId, studentPhoto, createdAt, updatedAt)
         VALUES
            (:userId, :name, :email, :passwordHash, :phone, :roleId,
             :collegeId, :studentPhoto, NOW(), NOW())`,
        {
            replacements: {
                userId,
                name: body.name,
                email: body.email,
                passwordHash,
                phone: body.phone || null,
                roleId,
                collegeId: body.collegeId ? String(body.collegeId) : null,
                studentPhoto,
            },
            type: QueryTypes.INSERT,
        }
    );

    const created = await get(userId);
    return { message: 'Student added successfully', student: created.student };
};

// Students live in auth-service's lucy_devdb.users (string userId PK,
// passwordHash). We update/delete THERE so the admin page operates on the
// real signed-up accounts. The auth schema only has a subset of the admin
// form's fields — name/email/phone/password map across; about/address/
// social/photo have no auth columns and are intentionally ignored.
const findAuthStudent = async (id) => {
    // Include studentPhoto so update() can delete the previous file when
    // the admin uploads a replacement, and remove() can clean it up on
    // delete.
    const rows = await authDb.query(
        `SELECT u.userId, u.name, u.email, u.phone, u.studentPhoto
           FROM users u
           JOIN roles r ON r.roleId = u.roleId
          WHERE r.role = 'student' AND u.userId = :id
          LIMIT 1`,
        { replacements: { id: String(id) }, type: QueryTypes.SELECT }
    );
    return rows[0] || null;
};

const update = async (id, body, file = null) => {
    const student = await findAuthStudent(id);
    if (!student) throw new HttpError(404, 'Student not found');

    if (!body.name || !body.email) throw new HttpError(422, 'Name and email are required');

    // Email uniqueness within the auth users table, excluding this user.
    const dup = await authDb.query(
        'SELECT 1 FROM users WHERE email = :email AND userId <> :id LIMIT 1',
        { replacements: { email: body.email, id: String(id) }, type: QueryTypes.SELECT }
    );
    if (dup.length) throw new HttpError(422, 'Email already in use');

    const sets = ['name = :name', 'email = :email', 'phone = :phone'];
    const replacements = {
        id: String(id),
        name: body.name,
        email: body.email,
        phone: body.phone ?? student.phone ?? null,
    };

    // Only touch collegeId when the form actually submitted the field.
    // Empty string from the "— Not assigned —" option clears it; absent
    // key (e.g. legacy callers) leaves the existing value alone.
    if (Object.prototype.hasOwnProperty.call(body, 'collegeId')) {
        sets.push('collegeId = :collegeId');
        replacements.collegeId = body.collegeId ? String(body.collegeId) : null;
    }

    if (body.password) {
        if (String(body.password).length < 8) {
            throw new HttpError(422, 'Password must be at least 8 characters');
        }
        sets.push('passwordHash = :passwordHash');
        replacements.passwordHash = await bcrypt.hash(body.password, 10);
    }

    // Photo upload — only touch studentPhoto when a new file was actually
    // uploaded. Same pattern as InstructorService.update. Stored under
    // uploads/users/student/ so old admin-DB-side files (different role)
    // don't collide.
    if (file) {
        const ext = (file.originalname || '').split('.').pop() || 'jpg';
        const destPath = `uploads/users/student/${niceFileName(body.name, ext)}`;
        await upload(file, destPath, 400, 400);
        sets.push('studentPhoto = :studentPhoto');
        replacements.studentPhoto = destPath;
    }

    await authDb.query(
        `UPDATE users SET ${sets.join(', ')} WHERE userId = :id`,
        { replacements, type: QueryTypes.UPDATE }
    );

    // Best-effort old-file cleanup after the UPDATE succeeded.
    if (file && student.studentPhoto && student.studentPhoto !== replacements.studentPhoto) {
        try { removeFile(student.studentPhoto); } catch { /* ignore */ }
    }

    const updated = await get(id);
    return { message: 'Student updated successfully', student: updated.student };
};

const remove = async (id) => {
    const student = await findAuthStudent(id);
    if (!student) throw new HttpError(404, 'Student not found');
    await authDb.query(
        'DELETE FROM users WHERE userId = :id',
        { replacements: { id: String(id) }, type: QueryTypes.DELETE }
    );
    // Drop the avatar file too so deleting a student doesn't leave
    // orphaned images in uploads/users/student/.
    if (student.studentPhoto) {
        try { removeFile(student.studentPhoto); } catch { /* ignore */ }
    }
    return { message: 'Student removed successfully' };
};

// Distinct, non-empty college names across all students — powers the
// Manage Students filter dropdown. Uses the same COALESCE resolution as
// list() so the options exactly match the displayed College column.
const collegeOptions = async () => {
    const rows = await authDb.query(
        `SELECT DISTINCT COALESCE(c.clgName, NULLIF(TRIM(u.collegeName), '')) AS college
           FROM users u
           JOIN roles r ON r.roleId = u.roleId
           LEFT JOIN colleges c ON c.clgId = u.collegeId
          WHERE r.role = 'student'
            AND COALESCE(c.clgName, NULLIF(TRIM(u.collegeName), '')) IS NOT NULL
          ORDER BY college ASC`,
        { type: QueryTypes.SELECT }
    );
    return { colleges: rows.map((r) => r.college) };
};

// Legacy 3-string default kept ONLY as a fallback for ProgramRequestCell rows
// where the admin hasn't created any DB programs yet. Real validation below
// checks against programs.title from the admin DB so admin-created titles
// flow through unchanged.
const PROGRAM_OPTIONS = [
    'AI Frontier Program',
    'AI Frontier Plus Program',
    'Elite AI Residency',
];

// "Send" from Manage Students: record (one per student, upsert) that an admin
// requested a program for this student. Resending overwrites the row and
// resets status to 'sent'. Lives in lucy_devdb alongside users.
const sendProgramRequest = async (id, program, requestedBy = null) => {
    const student = await findAuthStudent(id);
    if (!student) throw new HttpError(404, 'Student not found');

    const title = String(program || '').trim();
    if (!title) throw new HttpError(422, 'Program is required');

    // Validate against admin-created programs first. Title is unique enough
    // for the UI dropdown but we don't enforce DB-side uniqueness; any active
    // program with this title is accepted. Falls back to PROGRAM_OPTIONS so
    // a brand-new install (no DB programs yet) still works for the legacy
    // three-program flow.
    const matches = await sequelize.query(
        'SELECT id FROM programs WHERE title = :title AND is_active = 1 LIMIT 1',
        { replacements: { title }, type: QueryTypes.SELECT }
    ).catch(() => []);
    const allowed = matches.length > 0 || PROGRAM_OPTIONS.includes(title);
    if (!allowed) {
        throw new HttpError(422, `Program "${title}" is not available`);
    }

    await authDb.query(
        `INSERT INTO program_requests (user_id, program, requested_by, status)
         VALUES (:userId, :program, :requestedBy, 'sent')
         ON DUPLICATE KEY UPDATE
            program      = VALUES(program),
            requested_by = VALUES(requested_by),
            status       = 'sent',
            updated_at   = CURRENT_TIMESTAMP`,
        {
            replacements: {
                userId: String(id),
                program: title,
                requestedBy: requestedBy ? String(requestedBy) : null,
            },
            type: QueryTypes.INSERT,
        }
    );

    // Mirror onto the student schema: a freshly (re)sent request is pending
    // the student's response. Clears any prior responded timestamp.
    await authDb.query(
        `UPDATE users
            SET assignedProgram = :program,
                programResponseStatus = 'pending',
                programRespondedAt = NULL
          WHERE userId = :userId`,
        { replacements: { userId: String(id), program: title }, type: QueryTypes.UPDATE }
    );

    return { message: 'Program request sent', program: title, user_id: String(id) };
};

// Student-facing: the program request an admin sent this student that is
// still awaiting their response. Returns null when there's nothing pending
// (no request, or already accepted/rejected/cancelled).
const getStudentProgramRequest = async (userId) => {
    const uid = String(userId || '').trim();
    if (!uid) return { request: null };
    const rows = await authDb.query(
        `SELECT program, status, created_at, updated_at
           FROM program_requests
          WHERE user_id = :uid AND status = 'sent'
          LIMIT 1`,
        { replacements: { uid }, type: QueryTypes.SELECT }
    );
    return { request: rows[0] || null };
};

// Student-facing: the program this student has ACCEPTED (if any). Used by the
// "Choose your program" page to enable only the accepted program's card.
// Separate from getStudentProgramRequest so the dashboard banner (sent-only)
// is unaffected.
const getAcceptedProgram = async (userId) => {
    const uid = String(userId || '').trim();
    if (!uid) return { program: null };
    const rows = await authDb.query(
        `SELECT program, updated_at
           FROM program_requests
          WHERE user_id = :uid AND status = 'accepted'
          LIMIT 1`,
        { replacements: { uid }, type: QueryTypes.SELECT }
    );
    return { program: rows[0]?.program || null };
};

// Student accepts or rejects the pending request. Only a 'sent' row can
// transition; the response is stamped with responded_at.
const respondProgramRequest = async (userId, action) => {
    const uid = String(userId || '').trim();
    if (!uid) throw new HttpError(401, 'Missing student identity');
    const next = action === 'accept' ? 'accepted'
        : action === 'reject' ? 'rejected'
            : null;
    if (!next) throw new HttpError(422, "action must be 'accept' or 'reject'");

    const [, meta] = await authDb.query(
        `UPDATE program_requests
            SET status = :next, responded_at = CURRENT_TIMESTAMP
          WHERE user_id = :uid AND status = 'sent'`,
        { replacements: { uid, next }, type: QueryTypes.UPDATE }
    );
    // mysql2 returns affectedRows on meta; 0 means nothing was pending.
    const affected = meta?.affectedRows ?? meta ?? 0;
    if (!affected) throw new HttpError(404, 'No pending program request to respond to');

    // Mirror the decision onto the student schema.
    await authDb.query(
        `UPDATE users
            SET programResponseStatus = :next,
                programRespondedAt = CURRENT_TIMESTAMP
          WHERE userId = :uid`,
        { replacements: { uid, next }, type: QueryTypes.UPDATE }
    );

    return { message: `Program request ${next}`, status: next };
};

module.exports = {
    list, get, create, update, remove, collegeOptions,
    sendProgramRequest, PROGRAM_OPTIONS,
    getStudentProgramRequest, respondProgramRequest, getAcceptedProgram,
};
