import fs from "fs";
import sequelize from "../db/index.js";
import { QueryTypes } from "sequelize";
import {
  createRegistration,
  findBlockingRegistration,
  getRegistrationById,
  listRegistrations,
  markAssessmentStarted,
} from "../services/preAssessmentRegistration.service.js";
import { PROOF_PUBLIC_PATH } from "../middlewares/uploadProof.js";
import { enqueueEmail } from "../helpers/adminEmailClient.js";

// Centralised JSON response shape — keeps clients consistent with the rest of
// the assessment service (`{ message, data?, errors? }`).
const ok = (res, data, status = 200) => res.status(status).json({ data });
const fail = (res, status, message, extras = {}) =>
  res.status(status).json({ message, ...extras });

const safeUnlink = (absPath) => {
  if (!absPath) return;
  fs.promises.unlink(absPath).catch(() => {});
};

// POST /pre-assessment-registration
// Multer middleware has already saved the proof file to disk by the time we
// run, so any validation failure here must clean up that orphan file.
export async function submitRegistration(req, res) {
  const uploadedFile = req.file;
  try {
    const {
      fullName,
      email,
      phoneNumber,
      gender,
      selectedProgram,
      selectedProgramId,
      declarationAccepted,
    } = req.validatedBody;

    // Pull the user reference from the JWT payload when available. The route
    // is mounted behind `isLoggedIn`, so req.user should always be present —
    // we still guard against undefined to keep the controller resilient if
    // the route wiring changes later.
    const userId = req.user?.userId || req.user?.id || null;

    const blocker = await findBlockingRegistration({ userId, email });
    if (blocker) {
      safeUnlink(uploadedFile?.path);
      return fail(res, 409, "You have already registered for the pre-assessment.", {
        registrationId: blocker.registrationId,
        assessmentStatus: blocker.assessmentStatus,
      });
    }

    const proofMeta = {
      fileName: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      url: `${PROOF_PUBLIC_PATH}/${uploadedFile.filename}`,
      storedAt: new Date().toISOString(),
    };

    const registration = await createRegistration({
      userId,
      fullName,
      email,
      phoneNumber,
      gender,
      selectedProgram,
      selectedProgramId,
      declarationAccepted,
      uploadedCollegeProof: proofMeta,
      assessmentStatus: "registered",
      submittedFromIp: req.ip,
      submittedUserAgent: (req.headers["user-agent"] || "").slice(0, 255),
    });

    // Mirror the chosen program to users.programInterested so the student's
    // profile reflects the registration without waiting for a profile-edit
    // round-trip. Auth-service owns the users table but lives in the same
    // MySQL instance, so a direct UPDATE is safe and avoids a cross-service
    // HTTP hop on the critical registration path. Best-effort — registration
    // is already persisted, so a failure here is logged but not surfaced.
    if (userId && selectedProgram) {
      try {
        await sequelize.query(
          "UPDATE users SET programInterested = :program WHERE userId = :userId",
          {
            replacements: { program: selectedProgram, userId },
            type: QueryTypes.UPDATE,
          }
        );
      } catch (syncErr) {
        console.warn(
          "[preAssessmentRegistration] failed to mirror programInterested to users:",
          syncErr?.message
        );
      }
    }

    // Fire-and-forget confirmation email via admin-service's queue. NOT
    // awaited: the registration already persisted, and SMTP latency must
    // not block the 201 response. enqueueEmail() swallows its own errors,
    // so a failed dispatch is logged but doesn't surface to the user.
    enqueueEmail({
      template: "preAssessmentRegistered",
      to: email,
      userId: userId || null,
      data: {
        studentName: fullName,
        programName: selectedProgram,
        // Programs/Courses live in admin-service's DB, not here. Pass the
        // program id so the admin-service enqueue endpoint can resolve the
        // course name for the email (it falls back to programName if the
        // lookup yields nothing).
        programId: selectedProgramId,
        // adminEmailClient leaves the loginUrl to the admin-service template
        // default (env.mail.lmsLoginUrl), so the link stays consistent with
        // the batch-added email even though they originate in different
        // services.
      },
    });

    return ok(res, registration, 201);
  } catch (err) {
    safeUnlink(uploadedFile?.path);
    console.error("submitRegistration error:", err);
    if (err?.name === "SequelizeValidationError") {
      return fail(res, 400, "Validation failed", {
        errors: err.errors?.map((e) => ({ field: e.path, message: e.message })),
      });
    }
    return fail(res, 500, "Failed to submit pre-assessment registration");
  }
}

// GET /pre-assessment-registration/:id  — admin-ready lookup
export async function getRegistration(req, res) {
  try {
    const reg = await getRegistrationById(req.params.id);
    if (!reg) return fail(res, 404, "Registration not found");
    return ok(res, reg);
  } catch (err) {
    console.error("getRegistration error:", err);
    return fail(res, 500, "Failed to fetch registration");
  }
}

// GET /pre-assessment-registration  — paginated list for admin dashboards
export async function listRegistrationsHandler(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const program = req.query.program;
    const result = await listRegistrations({ limit, offset, program });
    return ok(res, {
      total: result.count,
      items: result.rows,
      limit,
      offset,
    });
  } catch (err) {
    console.error("listRegistrationsHandler error:", err);
    return fail(res, 500, "Failed to fetch registrations");
  }
}

// GET /pre-assessment-registration/me  — let the logged-in user check whether
// they've already onboarded, so the frontend can skip the modal on retake.
export async function getMyRegistration(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return ok(res, null);
    const reg = await findBlockingRegistration({ userId });
    return ok(res, reg);
  } catch (err) {
    console.error("getMyRegistration error:", err);
    return fail(res, 500, "Failed to fetch your registration");
  }
}

// POST /pre-assessment-registration/:id/started — flips status the moment the
// user lands on the actual assessment page. Idempotent.
export async function markStarted(req, res) {
  try {
    const reg = await markAssessmentStarted(req.params.id);
    if (!reg) return fail(res, 404, "Registration not found");
    return ok(res, reg);
  } catch (err) {
    console.error("markStarted error:", err);
    return fail(res, 500, "Failed to update registration status");
  }
}

