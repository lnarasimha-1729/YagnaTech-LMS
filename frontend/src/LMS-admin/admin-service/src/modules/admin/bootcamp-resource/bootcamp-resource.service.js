const path = require('path');
const fs = require('fs');
const { BootcampModule, BootcampResource, Bootcamp } = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const storage = require('../../../shared/storage');

/**
 * Admin bootcamp-resource service — 1:1 port of Admin/BootcampResourceController.php.
 * Files land under uploads/bootcamp/resource/<user>/<bootcamp>/<module>/<filename>.
 * 'record' upload_type is restricted to video extensions to match Laravel.
 */

const VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'wmv', 'webm']);

function replaceUrlSymbol(s) {
  return String(s || '').replace(/[?#&/:@=%]/g, '-');
}

async function create({ body, files, user }) {
  const module = await BootcampModule.findOne({
    where: { id: body.module_id },
    include: [{ model: Bootcamp, attributes: ['title'] }],
  });
  if (!module) throw new AppError('Module not found.', 404);
  const bootcampTitle = module.Bootcamp && module.Bootcamp.title;

  const uploads = Array.isArray(files) ? files : [];
  if (!uploads.length) throw new AppError('files required', 422);

  const created = [];
  for (const file of uploads) {
    const ext = (path.extname(file.originalname || '').replace(/^\./, '') || '').toLowerCase();
    if (body.upload_type === 'record' && !VIDEO_EXTS.has(ext)) {
      throw new AppError('Failed to upload. File type must be a video.', 422);
    }
    const title = replaceUrlSymbol(file.originalname);
    const relPath = `uploads/bootcamp/resource/${user.name}/${bootcampTitle}/${module.title}/${title}`;

    const dupe = await BootcampResource.findOne({ where: { title } });
    if (dupe) throw new AppError('File already exists.', 422);

    await storage.put(relPath, file.buffer);
    const row = await BootcampResource.create({
      module_id: module.id,
      upload_type: body.upload_type,
      title,
      file: relPath,
    });
    created.push(row);
  }
  return { data: created, upload_type: body.upload_type };
}

async function remove(id) {
  const resource = await BootcampResource.findByPk(id);
  if (!resource) throw new AppError('Data not found.', 404);
  if (resource.file) await storage.remove(resource.file).catch(() => {});
  const uploadType = resource.upload_type;
  await resource.destroy();
  return { id: Number(id), upload_type: uploadType };
}

async function download(id) {
  const resource = await BootcampResource.findByPk(id);
  if (!resource) throw new AppError('Data not found.', 404);
  const abs = path.join(storage.localRoot, resource.file || '');
  if (!fs.existsSync(abs)) throw new AppError('File does not exists.', 404);
  return { absPath: abs, filename: resource.title };
}

module.exports = { create, remove, download };
