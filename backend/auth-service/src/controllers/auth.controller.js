import { z } from 'zod';
import bcrypt from 'bcrypt';
import { generateUserID } from '../utils/uidGeneration.js';
import User from '../db/models/User.js';
import Role from '../db/models/Role.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { id } from 'zod/locales';

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
      // Academic Information (optional — stored only if provided)
      educationLevel: data.educationLevel || null,
      branch: data.branch || null,
      collegeName: data.collegeName || null,
      graduationYear: data.graduationYear || null,
      collegeCode: data.collegeCode || null
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

    const result = await issueTokens(user, res);
    return res.json(result);

  } catch (err) {
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

    const { preScore } = req.body;

    user.preScore = preScore;
    await user.save();

    return res.status(200).json({
      message: "Pre-assessment score updated successfully",
      preScore: user.preScore,
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

    const { postScore } = req.body;

    if (postScore === undefined) {
      return res.status(400).json({ message: "postScore is required" });
    }

    user.postScore = postScore;
    await user.save();

    return res.status(200).json({
      message: "Post-assessment score updated successfully",
      postScore: user.postScore,
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
