const { Question } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');

/**
 * Admin question service — 1:1 port of Admin/QuestionController.php.
 * Answer/options shaping mirrors the PHP branches by type:
 *   - mcq          → answer = JSON(array of selected values); options = JSON(array of value strings)
 *   - fill_blanks  → answer = JSON(array of value strings)
 *   - true_false   → answer = scalar string
 */

function asArray(maybeJsonOrArray) {
  if (Array.isArray(maybeJsonOrArray)) return maybeJsonOrArray;
  if (typeof maybeJsonOrArray === 'string') {
    try {
      const parsed = JSON.parse(maybeJsonOrArray);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Extract { value: ... } column out of an array — matches PHP array_column($arr, 'value'). */
function pluckValues(arr) {
  return asArray(arr).map((row) => (row && row.value !== undefined ? row.value : row));
}

function buildPayload(body) {
  const data = { quiz_id: body.quiz_id, title: body.title, type: body.type, options: null, answer: null };
  if (body.type === 'mcq') {
    data.answer = JSON.stringify(asArray(body.answer));
    data.options = JSON.stringify(pluckValues(body.options));
  } else if (body.type === 'fill_blanks') {
    data.answer = JSON.stringify(pluckValues(body.answer));
  } else if (body.type === 'true_false') {
    data.answer = String(body.answer);
  }
  return data;
}

async function create(body) {
  return Question.create(buildPayload(body));
}

async function update(id, body) {
  const q = await Question.findByPk(id);
  if (!q) throw new AppError('Data not found.', 404);
  await q.update(buildPayload(body));
  return q;
}

async function remove(id) {
  const q = await Question.findByPk(id);
  if (!q) throw new AppError('Data not found.', 404);
  await q.destroy();
  return { id: Number(id) };
}

/** Bulk reorder — Laravel's sort() accepts itemJSON = [id1, id2, ...] and writes 1-based sort. */
async function sort(itemJSON) {
  const ids = asArray(itemJSON);
  for (let i = 0; i < ids.length; i += 1) {
    await Question.update({ sort: i + 1 }, { where: { id: ids[i] } });
  }
  return { sorted: ids.length };
}

async function findForLoadType(id) {
  if (!id) return null;
  return Question.findByPk(id);
}

module.exports = { create, update, remove, sort, findForLoadType };
