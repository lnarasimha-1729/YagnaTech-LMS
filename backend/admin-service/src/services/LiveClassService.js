const liveRepo = require('../repositories/LiveClassRepository');
const userRepo = require('../repositories/UserRepository');
const settingRepo = require('../repositories/SettingRepository');
const { HttpError } = require('../middlewares/error');

const getZoomToken = async () => {
    const accountId = await settingRepo.get('zoom_account_id');
    const clientId = await settingRepo.get('zoom_client_id');
    const clientSecret = await settingRepo.get('zoom_client_secret');
    if (!accountId || !clientId || !clientSecret) return null;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const r = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const json = await r.json();
    return json.access_token || null;
};

const createZoomMeeting = async (topic, startTime) => {
    const token = await getZoomToken();
    if (!token) return null;
    const scheduleFor = await settingRepo.get('zoom_account_email');
    const timezone = (await settingRepo.get('timezone')) || 'UTC';
    const r = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            topic, schedule_for: scheduleFor, type: 2,
            start_time: new Date(startTime).toISOString().replace(/\.\d{3}Z$/, ''),
            duration: 60, timezone,
            settings: { approval_type: 2, join_before_host: true, jbh_time: 0 },
        }),
    });
    return r.json();
};

const updateZoomMeeting = async (meetingId, topic, startTime) => {
    const token = await getZoomToken();
    if (!token) return;
    await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, start_time: new Date(startTime).toISOString().replace(/\.\d{3}Z$/, '') }),
    });
};

const deleteZoomMeeting = async (meetingId) => {
    const token = await getZoomToken();
    if (!token) return;
    await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
};

const listByCourse = async (course_id) => {
    const items = await liveRepo.findByCourse(course_id);
    return { live_classes: items };
};

const instructors = async () => {
    const users = await userRepo.findInstructors();
    return { instructors: users };
};

const create = async ({ course_id, body }) => {
    const b = body;
    if (!b.class_topic || b.class_topic.length > 255) throw new HttpError(422, 'class_topic is required (max 255)');
    if (!b.class_date_and_time) throw new HttpError(422, 'class_date_and_time is required');
    if (!b.user_id) throw new HttpError(422, 'user_id is required');

    const data = {
        class_topic: b.class_topic,
        course_id,
        user_id: b.user_id,
        provider: b.provider || 'jitsi',
        class_date_and_time: b.class_date_and_time,
        note: b.note || null,
    };

    if (data.provider === 'zoom') {
        try {
            const meeting = await createZoomMeeting(b.class_topic, b.class_date_and_time);
            if (!meeting || meeting.code) {
                throw new HttpError(400, meeting?.message || 'Zoom not configured');
            }
            data.additional_info = JSON.stringify(meeting);
        } catch (e) {
            if (e instanceof HttpError) throw e;
            throw new HttpError(500, 'Failed to create Zoom meeting: ' + e.message);
        }
    }

    const created = await liveRepo.create(data);
    return { message: 'Live class added successfully', live_class: created };
};

const update = async ({ id, body }) => {
    const lc = await liveRepo.findById(id);
    if (!lc) throw new HttpError(404, 'Live class not found');
    const b = body;
    if (!b.class_topic || b.class_topic.length > 255) throw new HttpError(422, 'class_topic is required (max 255)');
    if (!b.class_date_and_time) throw new HttpError(422, 'class_date_and_time is required');
    if (!b.user_id) throw new HttpError(422, 'user_id is required');

    const data = {
        class_topic: b.class_topic,
        user_id: b.user_id,
        class_date_and_time: b.class_date_and_time,
        note: b.note || null,
    };

    if (lc.provider === 'zoom' && lc.additional_info) {
        try {
            const info = JSON.parse(lc.additional_info);
            await updateZoomMeeting(info.id, b.class_topic, b.class_date_and_time);
            info.start_time = new Date(b.class_date_and_time).toISOString().replace(/\.\d{3}Z$/, '');
            info.topic = b.class_topic;
            data.additional_info = JSON.stringify(info);
        } catch (_e) { /* ignore zoom failure on update */ }
    }

    await lc.update(data);
    return { message: 'Live class updated successfully', live_class: lc };
};

const remove = async (id) => {
    const lc = await liveRepo.findById(id);
    if (!lc) throw new HttpError(404, 'Live class not found');
    if (lc.provider === 'zoom' && lc.additional_info) {
        try { const info = JSON.parse(lc.additional_info); await deleteZoomMeeting(info.id); } catch (_e) { /* ignore */ }
    }
    await lc.destroy();
    return { message: 'Live class deleted successfully' };
};

const start = async (id) => {
    const lc = await liveRepo.findById(id);
    if (!lc) throw new HttpError(404, 'Live class not found');
    let info = null;
    try { info = lc.additional_info ? JSON.parse(lc.additional_info) : null; } catch (_e) {}
    return { live_class: lc, start_url: info?.start_url || null, join_url: info?.join_url || null };
};

module.exports = { listByCourse, instructors, create, update, remove, start };
