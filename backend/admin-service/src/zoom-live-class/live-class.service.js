/**
 * Zoom Live Class service — port of lms-cp/mern-lineclass/.../live-class.service.js
 * adapted to the admin-service's existing infrastructure:
 *
 *   - HttpError (not AppError) from middlewares/error
 *   - Sequelize models from ../models
 *   - Instructor identity from auth-DB users (joined to roles), same as the
 *     existing LiveClassService.instructors() flow
 *
 * Owns: CRUD, settings read/write, status derivation, join-decision logic.
 * Provider calls go through ./zoom.service so this stays persistence/permission
 * focused. Web SDK signature + status-sync helpers live in ./zoom.live-class.js.
 */

const { QueryTypes } = require('sequelize');
const { LiveClass, Course, Setting } = require('../models');
const { HttpError } = require('../middlewares/error');
const authDb = require('../config/authDatabase');
const zoom = require('./zoom.service');
const validators = require('./live-class.validators');
const notifier = require('./live-class.notifier');

const HOST_ROLE = 1;
const ATTENDEE_ROLE = 0;
const DEFAULT_DURATION_MIN = 60;

const SETTING_KEYS = [
    'zoom_account_email',
    'zoom_account_id',
    'zoom_client_id',
    'zoom_client_secret',
    'zoom_web_sdk',
    'zoom_sdk_client_id',
    'zoom_sdk_client_secret',
    // IANA timezone string — read by zoom.service.createMeeting when calling
    // Zoom's POST /users/me/meetings. Falls back to 'UTC' if unset.
    'timezone',
];

const parseAdditionalInfo = (raw) => {
    if (raw == null) return {};
    if (typeof raw === 'object') return raw;
    try {
        const out = JSON.parse(raw);
        return out && typeof out === 'object' ? out : {};
    } catch {
        return {};
    }
};

// Resolve all instructor user-ids for a course. Handles JSON array, CSV string,
// or a single numeric id — matches PHP $course->instructors() and the same
// instructor_ids column the rest of the admin-service already reads.
const courseInstructorIds = (course) => {
    if (!course) return [];
    const ids = new Set();
    if (course.user_id != null) ids.add(Number(course.user_id));

    const raw = course.instructor_ids;
    if (Array.isArray(raw)) {
        for (const v of raw) if (v) ids.add(Number(v));
    } else if (raw != null && raw !== '') {
        const s = String(raw).trim();
        // Try JSON first; fall back to CSV.
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) {
                for (const v of parsed) if (v) ids.add(Number(v));
            } else if (parsed) {
                ids.add(Number(parsed));
            }
        } catch {
            if (s.includes(',')) {
                for (const v of s.split(',')) {
                    const n = Number(v.trim());
                    if (n) ids.add(n);
                }
            } else {
                const n = Number(s);
                if (n) ids.add(n);
            }
        }
    }
    return [...ids];
};

const loadCourseOrFail = async (courseId) => {
    const course = await Course.findByPk(courseId);
    if (!course) throw new HttpError(404, 'Course not found.');
    return course;
};

const assertCanManage = (course, user) => {
    if (!user) throw new HttpError(401, 'Unauthenticated');
    if (user.role === 'admin' || user.role === 'root') return;
    const ids = courseInstructorIds(course);
    if (user.role === 'instructor' && ids.includes(Number(user.id))) return;
    throw new HttpError(403, 'Forbidden');
};

const deriveStatus = (row, durationMin = DEFAULT_DURATION_MIN) => {
    if (!row?.class_date_and_time) return 'scheduled';
    const start = new Date(row.class_date_and_time).getTime();
    if (Number.isNaN(start)) return 'scheduled';
    const now = Date.now();
    const ends = start + durationMin * 60 * 1000;
    if (now < start) return 'scheduled';
    if (now <= ends) return 'live';
    return 'completed';
};

// Fetch host profiles (instructors live in the auth DB, not the admin DB).
// Same source used by the existing LiveClassService.instructors().
const fetchHostsByIds = async (ids) => {
    const numericIds = [...new Set(ids.map((v) => String(v)).filter(Boolean))];
    if (!numericIds.length) return {};
    try {
        const rows = await authDb.query(
            `SELECT u.userId AS id, u.name, u.email, u.instructorPhoto AS photo
               FROM users u
              WHERE u.userId IN (:ids)`,
            { replacements: { ids: numericIds }, type: QueryTypes.SELECT }
        );
        const byId = {};
        for (const r of rows) byId[String(r.id)] = r;
        return byId;
    } catch (err) {
        console.warn('[zoom-live-class] host lookup failed:', err.message);
        return {};
    }
};

const serialize = (row, hostsById = {}, { includeStartUrl = false } = {}) => {
    if (!row) return null;
    const data = row.toJSON ? row.toJSON() : row;
    const info = parseAdditionalInfo(data.additional_info);
    const host = hostsById[String(data.user_id)] || null;
    return {
        id: data.id,
        user_id: data.user_id,
        course_id: data.course_id,
        class_topic: data.class_topic,
        provider: data.provider,
        class_date_and_time: data.class_date_and_time,
        note: data.note,
        created_at: data.created_at,
        updated_at: data.updated_at,
        host: host ? { id: host.id, name: host.name, email: host.email, photo: host.photo } : null,
        meeting: {
            id: info.id || null,
            join_url: info.join_url || null,
            ...(includeStartUrl ? { start_url: info.start_url || null } : {}),
            topic: info.topic || data.class_topic || null,
            start_time: info.start_time || null,
        },
        status: deriveStatus(data),
    };
};

/* ============================== CRUD ============================== */

const listByCourse = async (courseId) => {
    const rows = await LiveClass.findAll({
        where: { course_id: courseId },
        order: [['class_date_and_time', 'ASC']],
    });
    const hostIds = rows.map((r) => r.user_id).filter(Boolean);
    const hosts = await fetchHostsByIds(hostIds);
    return rows.map((r) => serialize(r, hosts));
};

const findOrFail = async (id) => {
    const row = await LiveClass.findByPk(id);
    if (!row) throw new HttpError(404, 'Live class not found.');
    return row;
};

const create = async ({ courseId, body, user }) => {
    const course = await loadCourseOrFail(courseId);
    assertCanManage(course, user);
    validators.validateStore(body);

    const provider = body.provider || 'zoom';
    const data = {
        course_id: course.id,
        user_id: body.user_id,
        class_topic: body.class_topic,
        provider,
        class_date_and_time: new Date(body.class_date_and_time),
        note: body.note || null,
    };

    if (provider === 'zoom') {
        const meeting = await zoom.createMeeting(body.class_topic, body.class_date_and_time);
        if (meeting && meeting.code) {
            throw new HttpError(422, meeting.message);
        }
        data.additional_info = typeof meeting === 'string' ? meeting : JSON.stringify(meeting || {});
    } else if (provider === 'manual') {
        // Manual provider — the instructor pasted a meeting URL. No Zoom API
        // call. Store the link as both join_url and start_url in
        // additional_info so resolveJoin/serialize treat it like any other
        // meeting (a manual class has no separate host/attendee link).
        const link = String(body.meeting_link).trim();
        data.additional_info = JSON.stringify({
            manual: true,
            join_url: link,
            start_url: link,
            topic: body.class_topic,
        });
    }

    const row = await LiveClass.create(data);
    const hosts = await fetchHostsByIds([row.user_id]);

    // Fire-and-forget: email enrolled students that a class was scheduled.
    // NOT awaited — a slow/failing SMTP must never block or fail the create.
    // notifier.notifyClassScheduled swallows its own errors.
    notifier.notifyClassScheduled(row, hosts[String(row.user_id)]?.name);

    return serialize(row, hosts, { includeStartUrl: true });
};

const update = async ({ id, body, user }) => {
    const row = await findOrFail(id);
    const course = await loadCourseOrFail(row.course_id);
    assertCanManage(course, user);
    validators.validateUpdate(body);

    const next = {
        class_topic: body.class_topic,
        user_id: body.user_id,
        class_date_and_time: new Date(body.class_date_and_time),
        note: body.note || null,
    };

    if (row.provider === 'zoom') {
        const previous = parseAdditionalInfo(row.additional_info);
        if (previous && previous.id) {
            const result = await zoom.updateMeeting(
                body.class_topic,
                body.class_date_and_time,
                previous.id
            );
            // Non-fatal — mirrors PHP behaviour which ignores update-failures.
            if (!result || !result.code) {
                previous.topic = body.class_topic;
                previous.start_time = new Date(body.class_date_and_time).toISOString();
                next.additional_info = JSON.stringify(previous);
            }
        }
    } else if (row.provider === 'manual') {
        // Manual class — refresh the stored link. Keep the existing one if
        // the edit form didn't send a new meeting_link.
        const previous = parseAdditionalInfo(row.additional_info);
        const link = body.meeting_link
            ? String(body.meeting_link).trim()
            : previous.join_url || '';
        if (!link) throw new HttpError(422, 'A meeting link is required');
        next.additional_info = JSON.stringify({
            manual: true,
            join_url: link,
            start_url: link,
            topic: body.class_topic,
        });
    }

    await row.update(next);
    const hosts = await fetchHostsByIds([row.user_id]);
    return serialize(row, hosts, { includeStartUrl: true });
};

const remove = async ({ id, user }) => {
    const row = await findOrFail(id);
    const course = await loadCourseOrFail(row.course_id);
    assertCanManage(course, user);

    if (row.provider === 'zoom') {
        const info = parseAdditionalInfo(row.additional_info);
        if (info && info.id) {
            // Best-effort — meeting may already be gone on Zoom's side.
            await zoom.deleteMeeting(info.id);
        }
    }
    await row.destroy();
    return { id: Number(id) };
};

/* ============================== Settings ============================== */

const readSettings = async () => {
    const rows = await Setting.findAll({ where: { type: SETTING_KEYS } });
    const out = {};
    for (const k of SETTING_KEYS) out[k] = null;
    for (const r of rows) out[r.type] = r.description;
    return out;
};

const writeSettings = async (body) => {
    validators.validateSettings(body);
    for (const key of SETTING_KEYS) {
        if (body[key] === undefined) continue;
        const value = body[key] == null ? '' : String(body[key]);
        const existing = await Setting.findOne({ where: { type: key } });
        if (existing) await existing.update({ description: value });
        else await Setting.create({ type: key, description: value });
    }
    return readSettings();
};

/* ============================== Join (course player) ============================== */

/**
 * Decide how the current user should join a live class:
 *   - 'redirect'    → open Zoom's start/join URL externally (web SDK disabled)
 *   - 'web-sdk'     → render <ZoomLiveClassRoom /> inside the player
 *   - 'unavailable' → meeting expired / not configured
 *
 * Permissions:
 *   - host  (admin or one of the course instructors) gets `start_url`
 *   - attendee (any other user, authed or not) gets `join_url`
 */
const resolveJoin = async ({ id, user }) => {
    const row = await findOrFail(id);
    const course = await loadCourseOrFail(row.course_id);
    const info = parseAdditionalInfo(row.additional_info);
    const status = deriveStatus(row);

    const isHost =
        !!user &&
        (user.role === 'admin' ||
            user.role === 'root' ||
            courseInstructorIds(course).includes(Number(user.id)));
    const role = isHost ? HOST_ROLE : ATTENDEE_ROLE;

    if (status === 'completed') {
        return { mode: 'unavailable', reason: 'Live class has ended.', status, role };
    }

    // Manual provider — the instructor pasted a meeting URL. There is no Zoom
    // meeting object; just hand the player the link to open in a new tab.
    // Host and attendee both get the same URL.
    if (row.provider === 'manual') {
        const url = info.join_url || info.start_url;
        if (!url) {
            return { mode: 'unavailable', reason: 'Meeting link unavailable.', status, role };
        }
        return { mode: 'redirect', url, status, role };
    }

    if (row.provider !== 'zoom' || !info.id) {
        return { mode: 'unavailable', reason: 'Live class is not configured.', status, role };
    }

    const webSdk = await zoom.webSdkEnabled();
    if (!webSdk) {
        const url = isHost ? info.start_url : info.join_url;
        if (!url) return { mode: 'unavailable', reason: 'Meeting link unavailable.', status, role };
        return { mode: 'redirect', url, status, role };
    }

    return {
        mode: 'web-sdk',
        status,
        role,
        meeting: {
            id: row.id,
            meeting_number: String(info.id),
            topic: info.topic || row.class_topic,
            ...(isHost ? { password: info.password || null } : {}),
        },
    };
};

const listInstructors = async (courseId) => {
    const course = await loadCourseOrFail(courseId);
    const ids = courseInstructorIds(course);
    if (!ids.length) {
        // No specific instructors set on the course — fall back to the full
        // instructor list (same data the existing LiveClassService.instructors
        // returns), so admins always have someone to pick.
        try {
            const rows = await authDb.query(
                `SELECT u.userId AS id, u.name, u.email
                   FROM users u
                   JOIN roles r ON r.roleId = u.roleId
                  WHERE r.role = 'instructor'
                  ORDER BY u.name ASC`,
                { type: QueryTypes.SELECT }
            );
            return rows;
        } catch (err) {
            console.warn('[zoom-live-class] instructor fallback failed:', err.message);
            return [];
        }
    }
    const byId = await fetchHostsByIds(ids);
    return ids.map((id) => byId[String(id)]).filter(Boolean);
};

module.exports = {
    listByCourse,
    findOrFail,
    create,
    update,
    remove,
    readSettings,
    writeSettings,
    resolveJoin,
    listInstructors,
    // Helpers exposed for zoom.live-class.js
    parseAdditionalInfo,
    courseInstructorIds,
    deriveStatus,
    serialize,
    HOST_ROLE,
    ATTENDEE_ROLE,
};
