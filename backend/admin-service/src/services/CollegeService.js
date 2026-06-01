const { Op, QueryTypes, fn, col } = require('sequelize');
const authDb = require('../config/authDatabase');
const College = require('../models/College');
const { Batch } = require('../models');
const { HttpError } = require('../middlewares/error');
const { generateUniqueCollegeCode } = require('../utils/collegeCode');

// True when `code` already belongs to some other college. Collision callback
// for generateUniqueCollegeCode.
const yagIdExists = async (code) => {
    const existing = await College.findOne({ where: { yagId: code } });
    return Boolean(existing);
};

// Verify the caller-supplied orgId exists in lucy_devdb.organisations before
// we INSERT. Without this we crash with a SequelizeForeignKeyConstraintError
// (raw 500 + leaked SQL) when the value doesn't exist — bad UX. We use a raw
// SELECT to avoid having to define a duplicate Organisation model just for
// this check.
const assertOrgExists = async (orgId) => {
    const rows = await authDb.query(
        'SELECT orgId FROM organisations WHERE orgId = :orgId LIMIT 1',
        { replacements: { orgId }, type: QueryTypes.SELECT }
    );
    if (!rows.length) {
        throw new HttpError(422, `Organisation with ID "${orgId}" does not exist`);
    }
};

// ID/access-key formats mirror college-service/src/utils/uidGeneration.js so
// rows created here are indistinguishable from rows created by the legacy
// /api/v1/college/add endpoint.
const generateCollegeId = () => 'clg_' + Math.random().toString(36).slice(2, 11);
const generateAccessKey = () => Math.random().toString(36).slice(2, 17);

const list = async ({ page = 1, per_page = 10, search = '' } = {}) => {
    const limit = Number(per_page);
    const offset = (Number(page) - 1) * limit;

    const where = {};
    if (search) {
        const term = `%${String(search).trim()}%`;
        where[Op.or] = [
            { clgName: { [Op.like]: term } },
            { clgId: { [Op.like]: term } },
        ];
    }

    try {
        const { rows, count } = await College.findAndCountAll({
            where,
            limit,
            offset,
            order: [['clgName', 'ASC']],
            attributes: ['clgId', 'yagId', 'clgName', 'clgAddress', 'orgId', 'branchIds', 'isActive', 'createdAt', 'updatedAt'],
        });

        // Batch counts live in the admin DB (batches.clg_id), so we tally
        // them separately and merge by clgId. Best-effort — a DB miss just
        // shows 0 in the column.
        const clgIds = rows.map((r) => r.clgId).filter(Boolean);
        let batchCountByClg = {};
        if (clgIds.length) {
            try {
                const counts = await Batch.findAll({
                    where: { clg_id: clgIds },
                    attributes: ['clg_id', [fn('COUNT', col('id')), 'count']],
                    group: ['clg_id'],
                    raw: true,
                });
                batchCountByClg = counts.reduce((acc, c) => {
                    acc[c.clg_id] = Number(c.count) || 0;
                    return acc;
                }, {});
            } catch (err) {
                console.warn('[colleges] batch count lookup failed:', err.message);
            }
        }

        return {
            colleges: rows.map((r) => ({
                ...r.toJSON(),
                batches_count: batchCountByClg[r.clgId] || 0,
            })),
            total: count,
            page: Number(page),
            per_page: limit,
        };
    } catch (err) {
        console.warn('[colleges] DB query failed:', err.message);
        return { colleges: [], total: 0, page: Number(page), per_page: limit };
    }
};

const get = async (clgId) => {
    const college = await College.findByPk(clgId, {
        attributes: ['clgId', 'yagId', 'clgName', 'clgAddress', 'orgId', 'branchIds', 'isActive', 'createdAt', 'updatedAt'],
    });
    if (!college) throw new HttpError(404, 'College not found');
    return { college: college.toJSON() };
};

const create = async (body) => {
    if (!body.clgName || !String(body.clgName).trim()) {
        throw new HttpError(422, 'College name is required');
    }

    const clgId = body.clgId
        ? String(body.clgId).trim()
        : generateCollegeId();

    if (await College.findByPk(clgId)) {
        throw new HttpError(409, 'College with this ID already exists');
    }

    const orgId = body.orgId ? String(body.orgId).trim() : null;
    if (orgId) await assertOrgExists(orgId);

    // Deterministic immutable 4-char code, unique across the colleges table.
    const yagId = await generateUniqueCollegeCode(clgId, yagIdExists);

    const data = {
        clgId,
        yagId,
        clgName: String(body.clgName).trim(),
        clgAddress: body.clgAddress ? String(body.clgAddress).trim() : null,
        orgId,
        accesskey: generateAccessKey(),
    };

    const college = await College.create(data);
    return { message: 'College added successfully', college: college.toJSON() };
};

const update = async (clgId, body) => {
    const college = await College.findByPk(clgId);
    if (!college) throw new HttpError(404, 'College not found');

    if (body.clgName !== undefined && !String(body.clgName).trim()) {
        throw new HttpError(422, 'College name cannot be empty');
    }

    const nextOrgId = body.orgId !== undefined
        ? (body.orgId ? String(body.orgId).trim() : null)
        : college.orgId;
    if (nextOrgId && nextOrgId !== college.orgId) {
        await assertOrgExists(nextOrgId);
    }

    const data = {
        clgName: body.clgName !== undefined ? String(body.clgName).trim() : college.clgName,
        clgAddress: body.clgAddress !== undefined
            ? (body.clgAddress ? String(body.clgAddress).trim() : null)
            : college.clgAddress,
        orgId: nextOrgId,
    };

    await college.update(data);
    return { message: 'College updated successfully', college: college.toJSON() };
};

const remove = async (clgId) => {
    const college = await College.findByPk(clgId);
    if (!college) throw new HttpError(404, 'College not found');
    await college.destroy();
    return { message: 'College deleted successfully' };
};

const setAccess = async (clgId, isActive) => {
    const college = await College.findByPk(clgId);
    if (!college) throw new HttpError(404, 'College not found');
    await college.update({ isActive: Boolean(isActive) });
    return {
        message: isActive ? 'Access granted' : 'Access revoked',
        college: college.toJSON(),
    };
};

module.exports = { list, get, create, update, remove, setAccess };
