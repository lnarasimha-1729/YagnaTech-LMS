const couponRepo = require('../repositories/CouponRepository');
const { HttpError } = require('../middlewares/error');

const toUnix = (dateStr) => {
    if (!dateStr) return null;
    const t = new Date(dateStr).getTime();
    return Number.isFinite(t) ? Math.floor(t / 1000) : null;
};

const isFutureOrToday = (unixSeconds) => {
    if (!unixSeconds) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return unixSeconds * 1000 >= today.getTime();
};

const validate = ({ code, discount, expiry, status }) => {
    if (!code || typeof code !== 'string') return 'Code is required';
    const d = Number(discount);
    if (!Number.isFinite(d) || d < 1 || d > 100) return 'Discount must be between 1 and 100';
    const exp = toUnix(expiry);
    if (!exp) return 'Expiry date is required';
    if (!isFutureOrToday(exp)) return 'Expiry date must be a future date.';
    if (status !== '0' && status !== '1' && status !== 0 && status !== 1) return 'Status must be either 0 or 1.';
    return null;
};

const buildPayload = (body) => ({
    code: body.code,
    discount: Number(body.discount),
    expiry: toUnix(body.expiry),
    status: Number(body.status),
});

const list = async ({ user_id, page = 1, search }) => {
    const limit = 10;
    const offset = (Number(page) - 1) * limit;
    try {
        const { count, rows } = await couponRepo.paginate({ user_id, search, limit, offset });
        return {
            coupons: {
                data: rows,
                total: count,
                per_page: limit,
                current_page: Number(page),
                last_page: Math.max(1, Math.ceil(count / limit)),
            },
        };
    } catch (err) {
        console.warn('[coupons] DB query failed:', err.message);
        return {
            coupons: { data: [], total: 0, per_page: limit, current_page: Number(page), last_page: 1 },
        };
    }
};

const get = async ({ id, user_id }) => {
    const c = await couponRepo.findOne({ id, user_id });
    if (!c) throw new HttpError(404, 'Data not found.');
    return { coupon: c };
};

const create = async ({ body, user_id }) => {
    const err = validate(body);
    if (err) throw new HttpError(422, err);

    const payload = buildPayload(body);
    if (await couponRepo.isCodeTaken(payload.code)) {
        throw new HttpError(400, 'Coupon code already exists');
    }
    const c = await couponRepo.create({ ...payload, user_id });
    return { success: 'Coupon has been created successfully.', coupon: c };
};

const update = async ({ id, body, user_id }) => {
    const err = validate(body);
    if (err) throw new HttpError(422, err);

    const existing = await couponRepo.findOne({ id, user_id });
    if (!existing) throw new HttpError(404, 'Data not found.');

    const payload = buildPayload(body);
    if (await couponRepo.isCodeTaken(payload.code, Number(id))) {
        throw new HttpError(400, 'Coupon code already exists');
    }
    await existing.update(payload);
    return { success: 'Coupon has been updated successfully.', coupon: existing };
};

const remove = async ({ id, user_id }) => {
    const existing = await couponRepo.findOne({ id, user_id });
    if (!existing) throw new HttpError(404, 'Data not found.');
    await existing.destroy();
    return { success: 'Coupon has been deleted successfully.' };
};

const toggleStatus = async ({ id, user_id }) => {
    const existing = await couponRepo.findOne({ id, user_id });
    if (!existing) throw new HttpError(404, 'Data not found.');
    await existing.update({ status: existing.status ? 0 : 1 });
    return { success: 'Status has been updated', coupon: existing };
};

module.exports = { list, get, create, update, remove, toggleStatus };
