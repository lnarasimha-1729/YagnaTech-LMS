const nodemailer = require('nodemailer');
const env = require('../../config/env');

/** Lazy-build transporter so boot doesn't fail when mail env isn't set in dev. */
let _transporter = null;
function transporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
  });
  return _transporter;
}

async function sendMail({ to, subject, html, text }) {
  if (!env.mail.host) {
    console.warn('[mail] MAIL_HOST not set — skipping send:', { to, subject });
    return { skipped: true };
  }
  return transporter().sendMail({ from: env.mail.from, to, subject, html, text });
}

module.exports = { sendMail };
