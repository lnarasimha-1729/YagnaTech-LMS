const categoryRepo = require('../repositories/CategoryRepository');
const slugify = require('../helpers/slugify');
const { upload, removeFile, niceFileName } = require('../helpers/fileUploader');
const { HttpError } = require('../middlewares/error');

const list = async () => {
    try {
        const categories = await categoryRepo.findRootWithChildren();
        return { categories };
    } catch (err) {
        console.warn('[categories] DB query failed:', err.message);
        return { categories: [] };
    }
};

const create = async (body, files = {}) => {
    const { title, parent_id, icon, keywords, description } = body;
    if (!title || !icon) throw new HttpError(422, 'title and icon are required');

    const slug = slugify(title);
    if (await categoryRepo.isSlugTaken(slug)) {
        throw new HttpError(400, 'There cannot be more than one category with the same name. Please change your category name');
    }

    const data = {
        parent_id: parent_id || null,
        title,
        slug,
        icon,
        sort: 0,
        keywords: keywords || null,
        description: description || null,
    };

    if (files.thumbnail?.[0]) {
        const f = files.thumbnail[0];
        data.thumbnail = `uploads/category-thumbnail/${niceFileName(title, f.originalname.split('.').pop())}`;
        await upload(f, data.thumbnail, 500, 500);
    }
    if (files.category_logo?.[0]) {
        const f = files.category_logo[0];
        data.category_logo = `uploads/category-logo/${niceFileName(`${title} logo`, f.originalname.split('.').pop())}`;
        await upload(f, data.category_logo, 400, 400);
    }

    const category = await categoryRepo.create(data);
    return { success: 'Category added successfully', category };
};

const update = async (id, body, files = {}) => {
    const pre = await categoryRepo.findById(id);
    if (!pre) throw new HttpError(404, 'Not found');

    const { title, parent_id, icon, keywords, description } = body;
    if (!title || !icon) throw new HttpError(422, 'title and icon are required');

    const slug = slugify(title);
    if (await categoryRepo.isSlugTaken(slug, id)) {
        throw new HttpError(400, 'There cannot be more than one category with the same name. Please change your category name');
    }

    const data = {
        parent_id: parent_id || null,
        title,
        slug,
        icon,
        keywords: keywords || null,
        description: description || null,
    };

    if (files.thumbnail?.[0]) {
        const f = files.thumbnail[0];
        data.thumbnail = `uploads/category-thumbnail/${niceFileName(title, f.originalname.split('.').pop())}`;
        await upload(f, data.thumbnail, 500, 500);
        removeFile(pre.thumbnail);
    }
    if (files.category_logo?.[0]) {
        const f = files.category_logo[0];
        data.category_logo = `uploads/category-logo/${niceFileName(`${title}-logo`, f.originalname.split('.').pop())}`;
        await upload(f, data.category_logo, 400, 400);
        removeFile(pre.category_logo);
    }

    await pre.update(data);
    return { success: 'Category updated successfully' };
};

const remove = async (id) => {
    const cat = await categoryRepo.findById(id);
    if (!cat) throw new HttpError(404, 'Not found');

    if (cat.parent_id) {
        removeFile(cat.thumbnail);
        await cat.destroy();
    } else {
        const children = await categoryRepo.findChildrenOf(cat.id);
        for (const c of children) {
            removeFile(c.thumbnail);
            await c.destroy();
        }
        removeFile(cat.thumbnail);
        await cat.destroy();
    }
    return { success: 'Category deleted successfully' };
};

module.exports = { list, create, update, remove };
