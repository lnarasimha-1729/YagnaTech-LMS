import Assessment from "../db/models/Assessment.js";
import QuestionSet from "../db/models/QuestionSet.js";
import Question from "../db/models/Question.js";

// Cyrb53 — small, fast non-cryptographic hash. We use it to derive a 32-bit
// seed from "userId|assessmentId" so each student gets their own deterministic
// question order that's stable across page refreshes.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Mulberry32 — seeded PRNG. Feeding cyrb53 output here produces a uniform
// stream of doubles that's good enough for shuffling a question list.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates with a seeded RNG. Returns a new array; does not mutate input.
function shuffleWithSeed(arr, seedStr) {
  const out = arr.slice();
  const rand = mulberry32(cyrb53(String(seedStr)));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Normalise an incoming list of ids to deduped string array. Accepts either
// an array or a single value; trims; drops empties. Used for both clgIds and
// courseIds so the JSON column always stores a clean shape.
function normaliseIdList(value) {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const s = String(v ?? '').trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

// Tolerate boolean, string, and number inputs from JSON / form payloads.
function toBool(v, fallback = false) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'on', 'yes'].includes(s)) return true;
  if (['0', 'false', 'off', 'no'].includes(s)) return false;
  return fallback;
}

// ------------------ CREATE ------------------
export async function addAssessment(req, res) {
  try {
    const { assessmentId, type, setId, startAt, score, timer, status } = req.body;
    const clgIds = normaliseIdList(req.body.clgIds);
    const courseIds = normaliseIdList(req.body.courseIds);

    if (!assessmentId || !type || !setId) {
      return res.status(400).json({ message: "assessmentId, type, and setId are required" });
    }

    // Check if assessment already exists
    const existing = await Assessment.findByPk(assessmentId);
    if (existing) return res.status(409).json({ message: "Assessment already exists" });

    // Check if QuestionSet exists
    const qs = await QuestionSet.findByPk(setId);
    if (!qs) return res.status(400).json({ message: "QuestionSet not found" });

    // questionsPerStudent: required, must be a positive integer, and cannot
    // exceed the number of questions in the chosen set.
    const setSize = Array.isArray(qs.questions) ? qs.questions.length : 0;
    const qps = Number(req.body.questionsPerStudent);
    if (!Number.isInteger(qps) || qps < 1) {
      return res.status(400).json({ message: "Questions per student is required and must be a positive whole number" });
    }
    if (qps > setSize) {
      return res.status(400).json({ message: `Questions per student (${qps}) cannot exceed the question set size (${setSize})` });
    }

    const assessment = await Assessment.create({
      assessmentId,
      type,
      setId,
      startAt,
      score,
      timer,
      status,
      clgIds,
      courseIds,
      shuffleQuestions: toBool(req.body.shuffleQuestions, false),
      questionsPerStudent: qps
    });

    res.status(201).json(assessment);
  } catch (err) {
    console.error("Error adding assessment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------ GET ACTIVE PRE-ASSESSMENT (student-readable) ------------
// Resolve the pre-assessment a student should see on the welcome page, without
// requiring the admin-only /all listing. Prefers an assessment whose clgIds
// includes the caller's college (?clgId=), else the first `pre`. Returns the
// id + question count + timer so the welcome card shows real data; the full
// question list is still fetched separately via GET /:id when starting.
export async function getActivePreAssessment(req, res) {
  try {
    const clgId = typeof req.query.clgId === "string" ? req.query.clgId.trim() : "";

    const pres = await Assessment.findAll({ where: { type: "pre" } });
    if (!pres.length) return res.status(404).json({ message: "No pre-assessment configured" });

    const matchesCollege = (a) =>
      clgId &&
      Array.isArray(a.clgIds) &&
      a.clgIds.map(String).includes(String(clgId));

    const pre = pres.find(matchesCollege) || pres[0];

    const qs = await QuestionSet.findByPk(pre.setId);
    const questionCount = qs && Array.isArray(qs.questions) ? qs.questions.length : 0;

    return res.json({
      assessmentId: pre.assessmentId,
      type: pre.type,
      timer: pre.timer,
      status: pre.status,
      questionCount,
    });
  } catch (err) {
    console.error("Error fetching active pre-assessment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------ GET ALL ------------------
export async function getAllAssessments(req, res) {
  try {
    const assessments = await Assessment.findAll();

    // fetch QuestionSet for each assessment
    const result = await Promise.all(
      assessments.map(async (assess) => {
        const qs = await QuestionSet.findByPk(assess.setId);
        return {
          ...assess.toJSON(),
          QuestionSet: qs
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Error fetching assessments:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}


// ------------------ GET BY ID (with questions) ------------------
export async function getAssessmentById(req, res) {
  try {
    const { id } = req.params;

    // Find the assessment
    const assessment = await Assessment.findByPk(id);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Fetch the related QuestionSet manually
    const questionSet = await QuestionSet.findByPk(assessment.setId);

    // Fetch full questions if questionSet has quesIds. Preserve the order
    // defined in the QuestionSet — Sequelize.findAll returns DB order, which
    // would otherwise shuffle the sequence the admin configured.
    let questions = [];
    if (questionSet && questionSet.questions.length > 0) {
      const orderedIds = questionSet.questions;
      const rows = await Question.findAll({ where: { quesId: orderedIds } });
      const byId = Object.fromEntries(rows.map((q) => [q.quesId, q]));
      questions = orderedIds.map((qid) => byId[qid]).filter(Boolean);
    }

    // Per-student shuffle: when the admin enabled shuffleQuestions, each
    // student receives questions in a unique deterministic order (seeded by
    // userId + assessmentId so refreshes stay consistent). Admins keep the
    // canonical order so the preview matches the QuestionSet config.
    const isAdmin = req.user?.role === 'admin';
    const userId = req.user?.userId || req.user?.id || '';
    if (!isAdmin && userId && questions.length > 1) {
      // Per-student randomization seeded by userId so it's stable across
      // refreshes. We seed-shuffle when EITHER the admin enabled shuffle OR a
      // per-student question count is set (the count needs a random pick, not
      // just the first N). Admins always see the canonical full set.
      const needsRandom = assessment.shuffleQuestions || Number(assessment.questionsPerStudent) > 0;
      if (needsRandom) {
        questions = shuffleWithSeed(questions, `${userId}|${assessment.assessmentId}`);
      }
      // Limit to the per-student count (random subset, stable per student).
      const n = Number(assessment.questionsPerStudent);
      if (Number.isInteger(n) && n > 0 && n < questions.length) {
        questions = questions.slice(0, n);
      }
    }

    res.json({
      ...assessment.toJSON(),
      questionSet,
      questions
    });
  } catch (err) {
    console.error("Error fetching assessment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}


// ------------------ UPDATE ------------------
export async function updateAssessment(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const assessment = await Assessment.findByPk(id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    // If updating setId, validate QuestionSet exists
    if (updates.setId) {
      const qs = await QuestionSet.findByPk(updates.setId);
      if (!qs) return res.status(400).json({ message: "Invalid QuestionSet" });
    }

    // Only normalise when the caller sent the field — preserves existing
    // values when the admin form is partial.
    if (Object.prototype.hasOwnProperty.call(updates, 'clgIds')) {
      updates.clgIds = normaliseIdList(updates.clgIds);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'courseIds')) {
      updates.courseIds = normaliseIdList(updates.courseIds);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'shuffleQuestions')) {
      updates.shuffleQuestions = toBool(updates.shuffleQuestions, assessment.shuffleQuestions);
    }
    // Validate questionsPerStudent (required, positive, <= set size) whenever
    // the caller sends it. Use the new setId if it's being changed, else the
    // existing one.
    if (Object.prototype.hasOwnProperty.call(updates, 'questionsPerStudent')) {
      const qps = Number(updates.questionsPerStudent);
      if (!Number.isInteger(qps) || qps < 1) {
        return res.status(400).json({ message: "Questions per student is required and must be a positive whole number" });
      }
      const effectiveSetId = updates.setId || assessment.setId;
      const qs = await QuestionSet.findByPk(effectiveSetId);
      const setSize = qs && Array.isArray(qs.questions) ? qs.questions.length : 0;
      if (qps > setSize) {
        return res.status(400).json({ message: `Questions per student (${qps}) cannot exceed the question set size (${setSize})` });
      }
      updates.questionsPerStudent = qps;
    }

    await assessment.update(updates);
    res.json(assessment);
  } catch (err) {
    console.error("Error updating assessment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------ DELETE ------------------
export async function deleteAssessment(req, res) {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findByPk(id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    await assessment.destroy();
    res.json({ message: "Assessment deleted successfully" });
  } catch (err) {
    console.error("Error deleting assessment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
