import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { QueryTypes, Op } from 'sequelize';
import sequelize from '../db/index.js';
import { generateUserID } from '../utils/uidGeneration.js';
import User from '../db/models/User.js';
import Role from '../db/models/Role.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { id } from 'zod/locales';

// Reset tokens live 30 minutes — long enough for the user to switch tabs and
// retrieve the email, short enough that a stolen mailbox snapshot stops being
// useful quickly.
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

// Where the user lands to set a new password. The token is appended as a
// query param. Configurable via env so staging/prod don't bake in localhost.
const resetPasswordUrl = () =>
  process.env.RESET_PASSWORD_URL || 'http://localhost:8080/reset-password';

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

// Best-effort enqueue against admin-service's internal email endpoint. Returns
// true on success and logs the reason on failure — never throws, because the
// caller (requestPasswordReset) must respond with the same generic message
// regardless of whether email actually went out.
async function enqueueResetEmail({ to, name, resetLink }) {
  // Default to the Docker Compose service name (admin-service listens on 8007
  // inside the network), NOT localhost — under Docker, localhost is THIS
  // container, so an unset ADMIN_SERVICE_URL would silently send the enqueue
  // into the void. Warn loudly when falling back so misconfig is visible.
  let base = process.env.ADMIN_SERVICE_URL;
  if (!base) {
    base = 'http://admin-service:8007';
    console.warn(`[auth] ADMIN_SERVICE_URL unset — defaulting to ${base}`);
  }
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.warn('[auth] INTERNAL_API_SECRET unset — skipping reset email enqueue');
    return false;
  }
  try {
    const res = await fetch(`${base}/api/internal/email/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': secret,
      },
      body: JSON.stringify({
        template: 'passwordReset',
        to,
        data: { userName: name, resetLink },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[auth] reset email enqueue failed: ${res.status} ${text}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[auth] reset email enqueue threw:', e.message);
    return false;
  }
}

// Block login when the user's college has been revoked from Manage Colleges
// → Options → Revoke Access. Raw SELECT avoids defining a duplicate College
// model just for this gate. Best-effort: a missing column (older DB without
// the auto-migration applied yet) or a query failure falls through so we
// don't lock everyone out on a DB hiccup.
async function assertCollegeActive(collegeId) {
  if (!collegeId) return;
  try {
    const rows = await sequelize.query(
      'SELECT isActive FROM colleges WHERE clgId = :clgId LIMIT 1',
      { replacements: { clgId: collegeId }, type: QueryTypes.SELECT }
    );
    if (rows.length && Number(rows[0].isActive) === 0) {
      const err = new Error('Your college access has been revoked. Please contact your administrator.');
      err.status = 403;
      throw err;
    }
  } catch (e) {
    if (e.status === 403) throw e;
    console.warn('[auth] college isActive check skipped:', e.message);
  }
}

// ======================
// Schemas
// ======================
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().min(10).max(15),
  dob: z.string().min(10).max(10),
  gender: z.enum(['male', 'female']),
  role: z.enum(['student', 'instructor', 'admin', 'auditor']).optional(),
  // === Academic Information (all optional) ===
  educationLevel: z.enum(['inter', 'bachelor', 'master', 'phd', 'other']).optional().or(z.literal('')),
  branch: z.string().optional(),
  collegeName: z.string().optional(),
  graduationYear: z.string().optional(),
  collegeCode: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// ======================
// Helpers
// ======================
async function issueTokens(user, res) {
  const role = await Role.findByPk(user.roleId);

  const payload = {
    id: user.userId,
    email: user.email,
    role: role ? role.role : 'student'
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // === Set cookies ===
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    path: '/',
  };

  res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 60 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return {
    accessToken,
    refreshToken,
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      phone: user.phone,
      dob: user.dob,
      gender: user.gender,
      role: role ? role.role : null,
      collegeId: user.collegeId,
      orgId: user.orgId,
      branchId: user.branchId,
      yearOfEducation: user.yearOfEducation,
      yearOfStudy: user.yearOfStudy,
      programInterested: user.programInterested
    }
  };
}


// ======================
// Controllers
// ======================
export async function register(req, res) {
  try {
    const data = registerSchema.parse(req.body);

    // Check duplicate
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Get roleId (default student)
    const role = await Role.findOne({ where: { role: data.role || 'student' } });
    if (!role) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Resolve the YagnaTech ID (college code / yagId) to a real college so the
    // student is LINKED to it (collegeId is what the profile + the rest of the
    // app key on). When the code matches, we also adopt the college's canonical
    // name. When it doesn't match (or "Other" — no code, free-text name), we
    // keep the typed collegeName and leave collegeId null.
    let resolvedCollegeId = null;
    let resolvedCollegeName = data.collegeName || null;
    const code = (data.collegeCode || '').trim();
    if (code) {
      try {
        const [row] = await sequelize.query(
          'SELECT clgId, clgName FROM colleges WHERE UPPER(TRIM(yagId)) = UPPER(:code) LIMIT 1',
          { replacements: { code }, type: QueryTypes.SELECT }
        );
        if (row) {
          resolvedCollegeId = row.clgId;
          resolvedCollegeName = row.clgName || resolvedCollegeName;
        }
      } catch (e) {
        console.warn('[register] college code lookup skipped:', e.message);
      }
    }

    // Create user
    const user = await User.create({
      userId: generateUserID(),
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone,
      dob: data.dob,
      gender: data.gender,
      roleId: role.roleId,
      // Academic Information (optional — stored only if provided).
      educationLevel: data.educationLevel || null,
      collegeName: resolvedCollegeName,
      collegeCode: code || null,
      // Linked college id (resolved from the YagnaTech ID) so the profile and
      // dashboards pick it up automatically. Null for "Other" / unmatched codes.
      collegeId: resolvedCollegeId,
      // Mirror branch + graduation year into BOTH the legacy columns and the
      // columns the profile/auth payload actually read (branchId,
      // yearOfEducation, yearOfStudy) — otherwise signup data never surfaces on
      // the profile page.
      branch: data.branch || null,
      branchId: data.branch || null,                                  // STRING col
      graduationYear: data.graduationYear || null,
      yearOfEducation: data.graduationYear || null,                   // STRING col
      yearOfStudy: data.graduationYear ? (Number(data.graduationYear) || null) : null // INTEGER col
    });

    const result = await issueTokens(user, res);
    return res.status(201).json(result);

  } catch (err) {
    console.error('Register error:', err);
    return res.status(400).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await assertCollegeActive(user.collegeId);

    const result = await issueTokens(user, res);
    return res.json(result);

  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ error: err.message });
    }
    console.error('Login error:', err);
    return res.status(400).json({ error: err.message });
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken required' });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(payload.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refreshToken' });
    }

    // Issue new tokens
    const result = await issueTokens(user);
    return res.json(result);

  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(400).json({ error: err.message });
  }
}

export async function profile(req, res) {
  try {
     res.setHeader('Cache-Control', 'no-store');
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch role
    const role = await Role.findByPk(user.roleId);

    // Flatten education object if present
    let userJson = user.toJSON();
    if (userJson.education && typeof userJson.education === 'object') {
      userJson = { ...userJson, ...userJson.education };
      delete userJson.education;
    }

    return res.json({ ...userJson, role: role ? role.role : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const user = await User.findOne({ where: { userId: req.user.id } });

    console.log(user);
    

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update user profile
    const { name,email, phone, dob } = req.body;
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.dob = dob || user.dob;

    await user.save();
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// update educational details
export async function updateEducation(req, res) {
  try {
    const user = await User.findOne({ where: { userId: req.user.id } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { yearOfEducation, yearOfStudy, programInterested } = req.body;

    // Update both root fields and education object
    user.yearOfEducation = yearOfEducation ?? user.yearOfEducation;
    user.yearOfStudy = yearOfStudy ?? user.yearOfStudy;
    user.programInterested = programInterested ?? user.programInterested;

    user.education = {
      ...user.education,
      yearOfEducation: yearOfEducation ?? user.education?.yearOfEducation,
      yearOfStudy: yearOfStudy ?? user.education?.yearOfStudy,
      programInterested: programInterested ?? user.education?.programInterested
    };

    await user.save();
    return res.status(200).json({ user, message: 'Educational details updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// update organization/college/branch details
export async function updateOrgClgBranch(req, res) {
  try {
    const user = await User.findOne({ where: { userId: req.user.id } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { orgId, collegeId, branchId } = req.body;

    // Update both root fields and education object
    user.orgId = orgId ?? user.orgId;
    user.collegeId = collegeId ?? user.collegeId;
    user.branchId = branchId ?? user.branchId;

    // The form only sends the clgId; resolve its display name from the
    // colleges table (same schema this service connects to) and mirror it onto
    // users.collegeName so pages that read the name stay in sync with the id.
    // Best-effort: a lookup miss/failure leaves the id saved without the name.
    if (collegeId) {
      try {
        const rows = await sequelize.query(
          'SELECT clgName FROM colleges WHERE clgId = :clgId LIMIT 1',
          { replacements: { clgId: collegeId }, type: QueryTypes.SELECT }
        );
        if (rows.length && rows[0].clgName) user.collegeName = rows[0].clgName;
      } catch (e) {
        console.warn('[auth] collegeName resolution skipped:', e.message);
      }
    }

    user.education = {
      ...user.education,
      orgId: orgId ?? user.education?.orgId,
      collegeId: collegeId ?? user.education?.collegeId,
      branchId: branchId ?? user.education?.branchId
    };

    await user.save();
    return res.status(200).json({ user, message: 'Org/College/Branch details updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function preScore(req, res) {
  try {
    const user = await User.findOne({ where: { userId: req.user.id } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { preScore, preScoreDuration } = req.body;

    user.preScore = preScore;
    // Time taken on the pre-assessment, in seconds. Optional & defensive:
    // only persist a finite, non-negative value.
    const dur = Number(preScoreDuration);
    if (Number.isFinite(dur) && dur >= 0) {
      user.preScoreDuration = Math.round(dur);
    }
    await user.save();

    return res.status(200).json({
      message: "Pre-assessment score updated successfully",
      preScore: user.preScore,
      preScoreDuration: user.preScoreDuration,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function postScore(req, res) {
  try {
    const user = await User.findOne({ where: { userId: req.user.id } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { postScore, postScoreDuration } = req.body;

    if (postScore === undefined) {
      return res.status(400).json({ message: "postScore is required" });
    }

    user.postScore = postScore;
    // Optional — older clients don't send it. We coerce numeric strings so the
    // INT column doesn't refuse a "180" payload.
    if (postScoreDuration !== undefined && postScoreDuration !== null) {
      const dur = Number(postScoreDuration);
      if (Number.isFinite(dur) && dur >= 0) {
        user.postScoreDuration = Math.round(dur);
      }
    }
    await user.save();

    return res.status(200).json({
      message: "Post-assessment score updated successfully",
      postScore: user.postScore,
      postScoreDuration: user.postScoreDuration,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}




export async function changePassword(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Kick off a password reset: generate a one-time token, store its hash on the
// user, and queue the email containing the raw token. Responds with the same
// generic 200 for both known and unknown emails so we don't leak which
// addresses are registered.
export async function requestPasswordReset(req, res) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    const respondOk = () =>
      res.json({ message: 'If an account exists for that email, a reset link has been sent.' });

    if (!user) return respondOk();

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = sha256(rawToken);
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await user.save();

    const resetLink = `${resetPasswordUrl()}?token=${rawToken}`;
    await enqueueResetEmail({ to: user.email, name: user.name, resetLink });

    return respondOk();
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    return res.status(500).json({ error: 'Could not process reset request' });
  }
}

// Consume a reset token and set a new password. Token is single-use: success
// clears both the hash and the expiry so it can't be replayed, and rotates
// the refreshToken so any logged-in session on the old credentials is
// invalidated on its next refresh.
export async function resetPassword(req, res) {
  try {
    const token = String(req.body?.token || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    if (!token || newPassword.length < 8) {
      return res.status(400).json({ error: 'Token and new password (min 8 chars) are required' });
    }

    const user = await User.findOne({
      where: {
        passwordResetToken: sha256(token),
        passwordResetExpires: { [Op.gt]: new Date() },
      },
    });
    if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null;
    await user.save();

    return res.json({ success: true, message: 'Password has been reset. Please log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ error: 'Could not reset password' });
  }
}

export async function logout(req, res) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken required' });
    }

    // Verify token & clear it from user table
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(payload.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refreshToken' });
    }

    user.refreshToken = null;
    await user.save();

    // Clear cookies
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
