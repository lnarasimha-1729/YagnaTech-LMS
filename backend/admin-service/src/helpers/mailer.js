const nodemailer = require('nodemailer');
const env = require('../config/env');

const send = async ({ to, subject, html }) => {
    if (!env.mail.host) return;
    const transport = nodemailer.createTransport({
        host: env.mail.host,
        port: env.mail.port,
        auth: { user: env.mail.user, pass: env.mail.pass },
    });
    await transport.sendMail({ from: env.mail.from, to, subject, html });
};

module.exports = { send };
