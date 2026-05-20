/**
 * Live-class email notifications.
 *
 * Isolated from live-class.service so the mail logic — recipient lookup,
 * template, fire-and-forget dispatch — lives in one place and the service
 * stays focused on persistence/permissions.
 *
 * The only entry point, notifyClassScheduled(), is called fire-and-forget
 * from live-class.service.create(): a slow or failing SMTP must never block
 * or fail the live-class creation. All errors are caught and logged.
 */

const { QueryTypes } = require('sequelize');
const { UserProgress, Course } = require('../models');
const authDb = require('../config/authDatabase');
const mailer = require('../helpers/mailer');
const env = require('../config/env');

// Format the class date/time for the email body. Kept simple — no locale
// dependency on the server.
const fmtWhen = (value) => {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}, `
        + `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Collect the email addresses of every student enrolled in the course.
// Enrollment lives in admin-DB user_progress; the addresses live in the
// auth-service users table — so this is a two-DB lookup.
const enrolledStudentEmails = async (courseId) => {
    const rows = await UserProgress.findAll({
        where: { course_id: courseId, enrolled: true },
        attributes: ['user_id'],
        raw: true,
    });
    const userIds = [...new Set(rows.map((r) => String(r.user_id)).filter(Boolean))];
    if (!userIds.length) return [];

    try {
        const users = await authDb.query(
            `SELECT u.email, u.name
               FROM users u
              WHERE u.userId IN (:ids) AND u.email IS NOT NULL AND u.email <> ''`,
            { replacements: { ids: userIds }, type: QueryTypes.SELECT }
        );
        return users.map((u) => ({ email: u.email, name: u.name }));
    } catch (err) {
        console.warn('[live-class mail] student email lookup failed:', err.message);
        return [];
    }
};

const buildHtml = ({ courseTitle, topic, when, note, hostName }) => `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2733;max-width:560px;margin:0 auto">
    <h2 style="color:#177385;margin:0 0 4px">New live class scheduled</h2>
    <p style="color:#6b7385;margin:0 0 16px">A live session has been planned for your course.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#6b7385;width:120px">Course</td>
          <td style="padding:6px 0;font-weight:600">${escapeHtml(courseTitle)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7385">Topic</td>
          <td style="padding:6px 0;font-weight:600">${escapeHtml(topic)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7385">When</td>
          <td style="padding:6px 0;font-weight:600">${escapeHtml(when)}</td></tr>
      ${hostName ? `<tr><td style="padding:6px 0;color:#6b7385">Instructor</td>
          <td style="padding:6px 0;font-weight:600">${escapeHtml(hostName)}</td></tr>` : ''}
      ${note ? `<tr><td style="padding:6px 0;color:#6b7385">Note</td>
          <td style="padding:6px 0">${escapeHtml(note)}</td></tr>` : ''}
    </table>
    <p style="color:#6b7385;font-size:13px;margin:16px 0 0">
      Open the course player and go to the <strong>Live class</strong> tab to join when it starts.
    </p>
  </div>`;

/**
 * Fire-and-forget: email every enrolled student that a live class was
 * scheduled. Resolves quickly; the caller should NOT await this (or should
 * await it only with its own try/catch — it never throws either way).
 *
 * @param {object} liveClassRow  the freshly-created LiveClass instance
 * @param {string} [hostName]    resolved instructor name, if available
 */
const notifyClassScheduled = async (liveClassRow, hostName) => {
    try {
        if (!env.mail?.host) return; // mail not configured — silently skip
        const courseId = liveClassRow.course_id;

        const [course, recipients] = await Promise.all([
            Course.findByPk(courseId, { attributes: ['title'] }),
            enrolledStudentEmails(courseId),
        ]);
        if (!recipients.length) return;

        const courseTitle = course?.title || 'Your course';
        const topic = liveClassRow.class_topic || 'Live class';
        const when = fmtWhen(liveClassRow.class_date_and_time);
        const html = buildHtml({
            courseTitle, topic, when, note: liveClassRow.note, hostName,
        });
        const subject = `Live class scheduled: ${topic}`;

        // Send sequentially — keeps SMTP load gentle and one failure doesn't
        // abort the rest. Each send is individually guarded.
        let sent = 0;
        for (const r of recipients) {
            try {
                await mailer.send({ to: r.email, subject, html });
                sent += 1;
            } catch (err) {
                console.warn(`[live-class mail] failed to ${r.email}:`, err.message);
            }
        }
        console.log(`[live-class mail] notified ${sent}/${recipients.length} student(s) for course ${courseId}`);
    } catch (err) {
        // Never let a notification failure surface — the live class is already
        // created; mail is best-effort.
        console.warn('[live-class mail] notifyClassScheduled failed:', err.message);
    }
};

module.exports = { notifyClassScheduled };
