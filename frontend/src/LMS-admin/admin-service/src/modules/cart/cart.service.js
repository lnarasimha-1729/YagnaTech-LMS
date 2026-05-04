const { Op } = require('sequelize');
const { CartItem, Course, Coupon, Enrollment } = require('../../models');
const AppError = require('../../shared/errors/AppError');
const { getSetting } = require('../../shared/utils/settings');

/**
 * Shopping cart domain.
 * Mirrors Laravel Student/CartController + ApiController@toggle_cart_items.
 *
 * list(userId, couponCode?) — resolve cart rows joined to courses, with
 *   coupon + tax context for the React summary panel.
 * add(userId, courseId) — idempotent insert with same guards as store():
 *   blocks own courses and active enrollments.
 * remove(userId, courseId) — delete by composite key.
 * applyCoupon(code) — validate and return { code, discount } or throw.
 */

async function list(userId, couponCode) {
  const rows = await CartItem.findAll({
    where: { user_id: userId, course_id: { [Op.ne]: null } },
    include: [{ model: Course, required: true }],
    order: [['id', 'DESC']],
  });

  const items = rows.map((r) => {
    const c = r.Course;
    return {
      id: c.id,
      cart_id: r.id,
      title: c.title,
      slug: c.slug,
      short_description: c.short_description,
      description: c.description,
      thumbnail: c.thumbnail,
      is_paid: c.is_paid,
      price: c.price,
      discounted_price: c.discounted_price,
      discount_flag: c.discount_flag,
    };
  });

  const tax = await getSetting('course_selling_tax');
  const tax_percent = Number(tax) || 0;

  let coupon = null;
  if (couponCode) {
    try {
      coupon = await validateCoupon(couponCode);
    } catch {
      coupon = null;
    }
  }

  return { items, coupon, tax_percent };
}

async function add(userId, courseId) {
  const course = await Course.findByPk(courseId);
  if (!course) throw new AppError('Course not found', 404);

  if (course.user_id === userId) {
    throw new AppError('You own this course.', 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const owned = await Enrollment.findOne({
    where: {
      user_id: userId,
      course_id: courseId,
      [Op.or]: [{ expiry_date: { [Op.gt]: now } }, { expiry_date: null }],
    },
  });
  if (owned) throw new AppError('You already purchased the course.', 400);

  const existing = await CartItem.findOne({
    where: { user_id: userId, course_id: courseId },
  });
  if (!existing) {
    await CartItem.create({ user_id: userId, course_id: courseId });
  }
  return { ok: true };
}

async function remove(userId, courseId) {
  const row = await CartItem.findOne({
    where: { user_id: userId, course_id: courseId },
  });
  if (!row) throw new AppError('Data not found.', 404);
  await row.destroy();
  return { ok: true };
}

async function validateCoupon(code) {
  const coupon = await Coupon.findOne({ where: { code } });
  if (!coupon) throw new AppError('This coupon is not valid.', 400);

  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(coupon.expiry);
  if (coupon.status && expiry && now >= expiry) {
    throw new AppError('Ops! coupon is expired.', 400);
  }
  return { code: coupon.code, discount: Number(coupon.discount) || 0 };
}

async function applyCoupon(code) {
  const coupon = await validateCoupon(code);
  return { coupon };
}

module.exports = { list, add, remove, applyCoupon };
