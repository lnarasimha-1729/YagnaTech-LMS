const { ContactMessage } = require('../models');
const { enqueue: enqueueEmail } = require('../jobs/emailQueue');
const env = require('../config/env');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s) =>
    String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

// Persist a contact-form submission AND notify the admin by email. Throws
// { status, message } on validation failure so the route can map it to a 422.
// The email is best-effort/queued — a failure to enqueue does not fail the
// submission (the row is already stored).
async function submit({ firstName, lastName, email, subject, message }) {
    const fn = String(firstName || '').trim();
    const em = String(email || '').trim();
    const msg = String(message || '').trim();

    if (!fn) throw { status: 422, message: 'First name is required.' };
    if (!EMAIL_RE.test(em)) throw { status: 422, message: 'A valid email is required.' };
    if (!msg) throw { status: 422, message: 'Message is required.' };

    const row = await ContactMessage.create({
        first_name: fn,
        last_name: String(lastName || '').trim() || null,
        email: em,
        subject: String(subject || '').trim() || null,
        message: msg,
    });

    // Notify the admin. CONTACT_TO overrides; else the configured SMTP_FROM.
    // Skip silently when neither is set (dev without mail configured).
    const to = process.env.CONTACT_TO || env.mail.from;
    if (to) {
        const fullName = `${fn}${lastName ? ` ${String(lastName).trim()}` : ''}`;
        const subjectLine = subject && String(subject).trim()
            ? `Contact form: ${String(subject).trim()}`
            : 'New contact form submission';
        const html = `
            <h2>New contact form submission</h2>
            <p><strong>Name:</strong> ${esc(fullName)}</p>
            <p><strong>Email:</strong> ${esc(em)}</p>
            ${subject ? `<p><strong>Subject:</strong> ${esc(subject)}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p>${esc(msg).replace(/\n/g, '<br>')}</p>
        `;
        try {
            await enqueueEmail({ to, subject: subjectLine, html });
        } catch (e) {
            // Stored already — log and move on rather than failing the request.
            console.warn('[contact] admin email enqueue failed:', e.message);
        }
    }

    return { id: row.id };
}

module.exports = { submit };
