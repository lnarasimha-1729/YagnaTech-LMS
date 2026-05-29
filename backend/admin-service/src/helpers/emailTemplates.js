// Transactional email templates rendered as HTML strings. Kept as plain
// template-literal builders rather than a full templating engine — these are
// short, infrequent, and benefit more from in-editor readability than from
// runtime flexibility.

const escape = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Inline-styled, table-based layout — required for Gmail / Outlook to render
// the box consistently. Anything modern (system font + 8px radius + soft
// border) without going overboard.
const baseFrame = ({ heading, bodyHtml }) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#202020;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:8px;border:1px solid #e6e8eb;box-shadow:0 1px 2px rgba(0,0,0,0.04);overflow:hidden;">
            <tr>
              <td style="background:#177385;color:#ffffff;padding:18px 24px;font-size:18px;font-weight:600;">
                ${escape(heading)}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-size:15px;line-height:1.55;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #eef0f2;font-size:12px;color:#7a8189;">
                You're receiving this because you're enrolled at a YagnaTech LMS partner college.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

// Sent to a student when a college admin adds them to a batch (whether at
// batch-create time or via the "add students" modal afterwards).
const batchAddedToStudent = ({ studentName, batchName, loginUrl }) => {
    const heading = 'You Have Been Added to a New Batch';
    const subject = 'You Have Been Added to a New Batch';
    const safeStudent = escape(studentName || 'Student');
    const safeBatch = escape(batchName || 'your new batch');
    const safeUrl = escape(loginUrl || '');
    const bodyHtml = `
        <p style="margin:0 0 16px 0;">Dear ${safeStudent},</p>
        <p style="margin:0 0 16px 0;">You have been successfully added to the batch:</p>
        <p style="margin:0 0 20px 0;font-size:16px;font-weight:600;color:#177385;">${safeBatch}</p>
        <p style="margin:0 0 16px 0;">Please login to the LMS portal and start your learning journey.</p>
        <p style="margin:0 0 24px 0;">
            <a href="${safeUrl}" style="display:inline-block;background:#177385;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">
                Login to LMS
            </a>
        </p>
        <p style="margin:0 0 4px 0;color:#7a8189;font-size:13px;">If the button doesn't work, copy this link:</p>
        <p style="margin:0 0 24px 0;font-size:13px;word-break:break-all;">
            <a href="${safeUrl}" style="color:#177385;">${safeUrl}</a>
        </p>
        <p style="margin:0;">Best Regards,<br/>YagnaTech Team</p>
    `;
    return { subject, html: baseFrame({ heading, bodyHtml }) };
};

// Sent to a student the moment they submit the pre-assessment onboarding
// modal. Confirms the registration, lets them know the assignment unlocks
// course access, and points them back at the LMS login. Mirrors the visual
// frame of batchAddedToStudent so the two transactional emails feel like
// they come from the same product.
const preAssessmentRegistered = ({ studentName, programName, loginUrl }) => {
    const heading = 'Pre-Assessment Registration Confirmed';
    const subject = 'You’re registered for the Pre-Assessment';
    const safeStudent = escape(studentName || 'Student');
    const safeProgram = escape(programName || '');
    const safeUrl = escape(loginUrl || '');
    const programLine = safeProgram
        ? `<p style="margin:0 0 16px 0;">Program: <strong>${safeProgram}</strong></p>`
        : '';
    const bodyHtml = `
        <p style="margin:0 0 16px 0;">Dear ${safeStudent},</p>
        <p style="margin:0 0 16px 0;">Thank you for registering for the
            <strong>Pre-Assessment</strong>. We have received your details
            successfully.</p>
        ${programLine}
        <p style="margin:0 0 16px 0;">
            <strong>Next step:</strong> complete your Pre-Assessment to
            unlock your course content. You won’t be able to access the
            full programme until the assessment is finished.
        </p>
        <p style="margin:0 0 12px 0;">A few tips before you begin:</p>
        <ul style="margin:0 0 18px 20px;padding:0;">
            <li style="margin:0 0 6px 0;">Find a quiet spot with a stable internet connection.</li>
            <li style="margin:0 0 6px 0;">The assessment is timed — plan for a single uninterrupted sitting.</li>
            <li style="margin:0 0 6px 0;">Answer honestly; the result personalises your learning path.</li>
        </ul>
        <p style="margin:0 0 24px 0;">
            <a href="${safeUrl}" style="display:inline-block;background:#177385;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">
                Start Pre-Assessment
            </a>
        </p>
        <p style="margin:0 0 4px 0;color:#7a8189;font-size:13px;">If the button doesn't work, copy this link:</p>
        <p style="margin:0 0 24px 0;font-size:13px;word-break:break-all;">
            <a href="${safeUrl}" style="color:#177385;">${safeUrl}</a>
        </p>
        <p style="margin:0;">Best Regards,<br/>YagnaTech Team</p>
    `;
    return { subject, html: baseFrame({ heading, bodyHtml }) };
};

// Sent when a root admin creates a course scoped to the student's college
// and batch. Branches on whether the student has already registered for the
// Pre-Assessment: registered students see a "complete the assessment to
// unlock" nudge, unregistered ones see "register and complete it." Either
// way the CTA lands on the LMS login.
const courseAssignedToStudent = ({
    studentName,
    courseTitle,
    hasRegisteredForPreAssessment,
    loginUrl,
}) => {
    const heading = 'You Have Been Assigned to a New Course';
    const subject = `New course assigned: ${courseTitle || 'a course'}`;
    const safeStudent = escape(studentName || 'Student');
    const safeCourse = escape(courseTitle || 'your new course');
    const safeUrl = escape(loginUrl || '');

    // Two distinct copy blocks so the wording reads naturally for each
    // audience. Escaping happens at injection time above, so the literals
    // here are plain text.
    const nextStepBlock = hasRegisteredForPreAssessment
        ? `
            <p style="margin:0 0 16px 0;">
                <strong>Next step:</strong> complete your Pre-Assessment to
                unlock the course. You’re already registered — just sign in
                and finish the test to access the content.
            </p>
        `
        : `
            <p style="margin:0 0 16px 0;">
                <strong>Next step:</strong> register for the Pre-Assessment
                and complete it to unlock the course. You haven’t registered
                yet — sign in to the LMS, complete the short onboarding,
                and take the test to gain access.
            </p>
        `;

    const ctaLabel = hasRegisteredForPreAssessment
        ? 'Complete Pre-Assessment'
        : 'Register for Pre-Assessment';

    const bodyHtml = `
        <p style="margin:0 0 16px 0;">Dear ${safeStudent},</p>
        <p style="margin:0 0 16px 0;">Good news — you’ve been assigned to a new course:</p>
        <p style="margin:0 0 20px 0;font-size:16px;font-weight:600;color:#177385;">${safeCourse}</p>
        ${nextStepBlock}
        <p style="margin:0 0 24px 0;">
            <a href="${safeUrl}" style="display:inline-block;background:#177385;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">
                ${escape(ctaLabel)}
            </a>
        </p>
        <p style="margin:0 0 4px 0;color:#7a8189;font-size:13px;">If the button doesn't work, copy this link:</p>
        <p style="margin:0 0 24px 0;font-size:13px;word-break:break-all;">
            <a href="${safeUrl}" style="color:#177385;">${safeUrl}</a>
        </p>
        <p style="margin:0;">Best Regards,<br/>YagnaTech Team</p>
    `;
    return { subject, html: baseFrame({ heading, bodyHtml }) };
};

// Sent the moment a student earns a certificate (course progress hits 100%
// and CertificateService.issue() persists a new row). Celebratory tone, with
// a direct link into the LMS where the certificate is available to view /
// download. The verifyUrl is the public certificate-by-identifier endpoint
// — shareable, no auth required.
const certificateIssued = ({
    studentName,
    courseTitle,
    issuedDate,
    verifyUrl,
    loginUrl,
}) => {
    const heading = 'Congratulations — Your Certificate is Ready';
    const subject = `🎓 Your certificate for ${courseTitle || 'your course'} is ready`;
    const safeStudent = escape(studentName || 'Student');
    const safeCourse = escape(courseTitle || 'your course');
    const safeIssued = escape(issuedDate || '');
    const safeVerify = escape(verifyUrl || '');
    const safeLogin = escape(loginUrl || '');

    const issuedLine = safeIssued
        ? `<p style="margin:0 0 16px 0;color:#7a8189;font-size:13px;">Issued on ${safeIssued}</p>`
        : '';

    // Two CTAs: primary "View Certificate" lands on the public verify URL
    // (no login required — anyone with the link can confirm authenticity);
    // secondary "Open LMS" sends the student back to their dashboard.
    const verifyButton = safeVerify
        ? `
            <p style="margin:0 0 12px 0;">
                <a href="${safeVerify}" style="display:inline-block;background:#177385;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">
                    View Certificate
                </a>
            </p>
        `
        : '';

    const lmsLine = safeLogin
        ? `
            <p style="margin:0 0 24px 0;font-size:13px;">
                Or continue learning on the LMS:
                <a href="${safeLogin}" style="color:#177385;">${safeLogin}</a>
            </p>
        `
        : '';

    const verifyFallback = safeVerify
        ? `
            <p style="margin:0 0 4px 0;color:#7a8189;font-size:13px;">If the button doesn't work, copy this link:</p>
            <p style="margin:0 0 24px 0;font-size:13px;word-break:break-all;">
                <a href="${safeVerify}" style="color:#177385;">${safeVerify}</a>
            </p>
        `
        : '';

    const bodyHtml = `
        <p style="margin:0 0 16px 0;">Dear ${safeStudent},</p>
        <p style="margin:0 0 16px 0;">
            🎉 <strong>Congratulations!</strong> You’ve successfully completed
        </p>
        <p style="margin:0 0 12px 0;font-size:16px;font-weight:600;color:#177385;">${safeCourse}</p>
        ${issuedLine}
        <p style="margin:0 0 16px 0;">
            Your official certificate is ready. You can view, share, or
            download it from the link below — it includes a QR code that lets
            anyone verify its authenticity.
        </p>
        ${verifyButton}
        ${verifyFallback}
        ${lmsLine}
        <p style="margin:0 0 16px 0;">
            Keep up the momentum — there are more courses waiting on your
            dashboard. We’re proud to have you in the YagnaTech community.
        </p>
        <p style="margin:0;">Best Regards,<br/>YagnaTech Team</p>
    `;
    return { subject, html: baseFrame({ heading, bodyHtml }) };
};

// Sent when a user requests a password reset. The raw reset token is embedded
// in `resetLink` by the caller (auth-service) — admin-service only renders.
const passwordReset = ({ userName, resetLink }) => {
    const heading = 'Reset Your Password';
    const subject = 'Reset your YagnaTech LMS password';
    const safeName = escape(userName || 'there');
    const safeLink = escape(resetLink || '');
    const bodyHtml = `
        <p style="margin:0 0 16px 0;">Hi ${safeName},</p>
        <p style="margin:0 0 16px 0;">We received a request to reset the password for your YagnaTech LMS account. Click the button below to choose a new password. This link expires in 30 minutes.</p>
        <p style="margin:0 0 24px 0;">
            <a href="${safeLink}" style="display:inline-block;background:#177385;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">
                Reset Password
            </a>
        </p>
        <p style="margin:0 0 4px 0;color:#7a8189;font-size:13px;">If the button doesn't work, copy this link:</p>
        <p style="margin:0 0 24px 0;font-size:13px;word-break:break-all;">
            <a href="${safeLink}" style="color:#177385;">${safeLink}</a>
        </p>
        <p style="margin:0 0 16px 0;color:#7a8189;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="margin:0;">Best Regards,<br/>YagnaTech Team</p>
    `;
    return { subject, html: baseFrame({ heading, bodyHtml }) };
};

module.exports = {
    batchAddedToStudent,
    preAssessmentRegistered,
    courseAssignedToStudent,
    certificateIssued,
    passwordReset,
};
