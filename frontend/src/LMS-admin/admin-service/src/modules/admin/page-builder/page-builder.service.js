const path = require('node:path');
const fs = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { Op } = require('sequelize');
const { BuilderPage, FrontendSetting } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const { niceFileName, extOf } = require('../../../shared/utils/niceFileName');

/**
 * 1:1 port of Admin/PageBuilderController.php.
 * The Blade-template rewriting (page_layout_update) is intentionally omitted —
 * the React port serves layouts from JSON, not Blade files. We keep the DB
 * write so callers that POST `built_file_names` still get persisted.
 */

const PUBLIC_ROOT = path.resolve(__dirname, '../../../../../public');
const UPLOAD_DIR = 'uploads/home-page-builder';

async function list() {
  const rows = await BuilderPage.findAll({ order: [['id', 'DESC']] });
  return { data: rows };
}

async function create({ body }) {
  return BuilderPage.create({ name: body.name });
}

async function update(id, { body }) {
  const row = await BuilderPage.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  await row.update({ name: body.name });
  return row;
}

async function remove(id) {
  const row = await BuilderPage.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  await row.destroy();
  return { id: Number(id) };
}

async function toggleStatus(id) {
  const row = await BuilderPage.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  let message;
  if (row.status === 1) {
    await row.update({ status: 0 });
    message = 'Home page deactivated';
  } else {
    await FrontendSetting.update({ value: row.identifier }, { where: { key: 'home_page' } });
    await row.update({ status: 1 });
    message = 'Home page activated';
  }
  await BuilderPage.update({ status: 0 }, { where: { id: { [Op.ne]: id } } });
  return { success: message };
}

async function layoutEdit(id) {
  const row = await BuilderPage.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  let html = [];
  try {
    html = row.html ? JSON.parse(row.html) : [];
  } catch {
    html = [];
  }
  return { id: row.id, name: row.name, identifier: row.identifier, html };
}

async function layoutUpdate(id, { body }) {
  const row = await BuilderPage.findByPk(id);
  if (!row) throw new AppError('Data not found.', 404);
  const fileNames = Array.isArray(body.built_file_names)
    ? body.built_file_names
    : body.builder_elements
      ? Object.keys(body.builder_elements)
      : [];
  await row.update({ html: JSON.stringify(fileNames) });
  return { id: row.id, files: fileNames };
}

async function layoutImageUpdate({ file, body }) {
  if (!file) throw new AppError('File is required.', 422);
  const relPath = `${UPLOAD_DIR}/${niceFileName('home-page-builder', extOf(file))}`;
  const absPath = path.join(PUBLIC_ROOT, relPath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, file.buffer);

  if (body.remove_file) {
    const parts = String(body.remove_file).split('/');
    const prev = path.join(PUBLIC_ROOT, UPLOAD_DIR, parts[parts.length - 1]);
    if (existsSync(prev)) await fs.unlink(prev).catch(() => {});
  }
  return { path: relPath };
}

async function preview(pageId) {
  const row = await BuilderPage.findByPk(pageId);
  if (!row) throw new AppError('Page not found.', 404);
  let html = [];
  try {
    html = row.html ? JSON.parse(row.html) : [];
  } catch {
    html = [];
  }
  return { page_id: Number(pageId), identifier: row.identifier, html };
}

module.exports = {
  list,
  create,
  update,
  remove,
  toggleStatus,
  layoutEdit,
  layoutUpdate,
  layoutImageUpdate,
  preview,
};
