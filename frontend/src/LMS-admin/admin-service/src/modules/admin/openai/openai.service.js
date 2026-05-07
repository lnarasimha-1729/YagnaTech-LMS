const { Setting } = require('../../../models');
const { getSetting } = require('../../../shared/utils/settings');

/** 1:1 port of Admin/OpenAiController.php. Uses fetch for HTTP (Node 18+). */

async function listSettings() {
  const keys = ['open_ai_model', 'open_ai_max_token', 'open_ai_secret_key'];
  const rows = await Setting.findAll({ where: { type: keys } });
  const out = {};
  for (const r of rows) out[r.type] = r.description;
  return out;
}

async function updateSettings(payload) {
  for (const [type, value] of Object.entries(payload)) {
    const existing = await Setting.findOne({ where: { type } });
    if (existing) await existing.update({ description: value == null ? null : String(value) });
    else await Setting.create({ type, description: value == null ? null : String(value) });
  }
  return { updated: Object.keys(payload).length };
}

async function generateImage(prompt) {
  const secret = await getSetting('open_ai_secret_key');
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ prompt, model: 'dall-e-3', size: '1024x1024', n: 1 }),
  });
  const json = await res.json().catch(() => ({}));
  if (json && json.error) return `Error: ${json.error.message}`;
  return JSON.stringify(json.data || []);
}

async function generateText(instructions, prompt) {
  const secret = await getSetting('open_ai_secret_key');
  const model = await getSetting('open_ai_model');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: String(prompt) },
      ],
    }),
  });
  const json = await res.json().catch(() => null);
  if (!json) return '';
  if (json.error) return JSON.stringify(json);
  return (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || '';
}

async function generate({ body }) {
  if (body.service_type === 'Course thumbnail') {
    const prompt =
      `We have run a online LMS system. Please generate course thumbnails for me. \n Course topic: ${body.ai_keywords}`;
    return generateImage(prompt);
  }
  const prompt = `Write me a ${body.service_type} on ${body.ai_keywords} in ${body.language || 'English'} language`;
  const instructions = `You are a ${body.service_type} writer.`;
  return generateText(instructions, prompt);
}

module.exports = { listSettings, updateSettings, generate };
