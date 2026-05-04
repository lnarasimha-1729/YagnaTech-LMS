const path = require('node:path');
const fs = require('node:fs');
const { Op } = require('sequelize');
const {
  OfflinePayment,
  Bootcamp,
  BootcampPurchase,
  Coupon,
  Course,
  Enrollment,
  PaymentHistory,
  TeamPackagePurchase,
  TeamTrainingPackage,
  TutorBooking,
  TutorSchedule,
  User,
} = require('../../../models');
const AppError = require('../../../shared/errors/AppError');
const { asArray } = require('../../../shared/utils/asArray');
const { randomToken } = require('../../../shared/utils/token');
const { getSetting } = require('../../../shared/utils/settings');
const { parsePagination, paginated } = require('../../../shared/utils/pagination');

/** 1:1 port of Admin/OfflinePaymentController.php. */

const PUBLIC_ROOT = path.resolve(__dirname, '../../../../../public');

async function list(query) {
  const where = {};
  const { status } = query;
  if (status === 'approved') where.status = 1;
  else if (status === 'suspended') where.status = 2;
  else if (status === 'pending') where[Op.or] = [{ status: 0 }, { status: null }];

  const pg = parsePagination(query, { page: 1, perPage: 10, max: 100 });
  const { rows, count } = await OfflinePayment.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return paginated(rows, count, pg);
}

async function downloadDoc(id) {
  if (!id) throw new AppError('Data not found.', 404);
  const row = await OfflinePayment.findByPk(id);
  if (!row || !row.doc) throw new AppError('Data not found.', 404);
  const absPath = path.join(PUBLIC_ROOT, row.doc);
  if (!fs.existsSync(absPath)) throw new AppError('Data not found.', 404);
  return { absPath, filename: path.basename(row.doc) };
}

async function creatorRole(courseId) {
  const c = await Course.findByPk(courseId, { attributes: ['user_id'] });
  if (!c) return 'admin';
  const u = await User.findByPk(c.user_id, { attributes: ['role'] });
  return u ? u.role : 'admin';
}

async function tutorRole(tutorId) {
  const u = await User.findByPk(tutorId, { attributes: ['role'] });
  return u ? u.role : 'admin';
}

async function acceptPayment(id) {
  if (!id) throw new AppError('Id can not be empty.', 422);
  const row = await OfflinePayment.findOne({ where: { id, status: 0 } });
  if (!row) throw new AppError('Data not found.', 404);

  const couponCode = row.coupon;
  const items = asArray(row.items);

  if (row.item_type === 'course') {
    for (const itemId of items) {
      const course = await Course.findByPk(itemId);
      if (!course) continue;

      let amount = course.discount_flag === 1 || course.discount_flag === '1'
        ? Number(course.discounted_price || 0)
        : Number(course.price || 0);

      let discountedPrice = 0;
      if (couponCode) {
        const coupon = await Coupon.findOne({ where: { code: couponCode } });
        if (coupon) discountedPrice = amount * (Number(coupon.discount || 0) / 100);
      }
      const finalAmount = amount - discountedPrice;
      const taxRate = Number((await getSetting('course_selling_tax')) || 0);
      const tax = (taxRate / 100) * finalAmount;

      const role = await creatorRole(course.id);
      let adminRevenue;
      let instructorRevenue = null;
      if (role === 'admin') {
        adminRevenue = finalAmount;
      } else {
        const instructorPct = Number((await getSetting('instructor_revenue')) || 0);
        instructorRevenue = finalAmount * (instructorPct / 100);
        adminRevenue = finalAmount - instructorRevenue;
      }

      await PaymentHistory.create({
        invoice: randomToken(10),
        user_id: row.user_id,
        payment_type: 'offline',
        coupon: couponCode,
        course_id: course.id,
        amount: finalAmount,
        tax,
        admin_revenue: String(adminRevenue),
        instructor_revenue: instructorRevenue == null ? null : String(instructorRevenue),
      });

      const expiryPeriod = Number(course.expiry_period || 0);
      const entry = Math.floor(Date.now() / 1000);
      const expiry = expiryPeriod > 0 ? entry + expiryPeriod * 30 * 86400 : null;
      await Enrollment.create({
        user_id: row.user_id,
        course_id: course.id,
        enrollment_type: 'paid',
        entry_date: entry,
        expiry_date: expiry,
      });
    }
  } else if (row.item_type === 'bootcamp') {
    const bootcamps = await Bootcamp.findAll({ where: { id: { [Op.in]: items } } });
    for (const b of bootcamps) {
      const price = b.discount_flag === 1 || b.discount_flag === '1'
        ? Number(b.price || 0) - Number(b.discounted_price || 0)
        : Number(b.price || 0);
      await BootcampPurchase.create({
        invoice: `#${randomToken(10)}`,
        user_id: row.user_id,
        bootcamp_id: b.id,
        price,
        tax: 0,
        payment_method: 'offline',
        status: 1,
      });
    }
  } else if (row.item_type === 'package') {
    const packages = await TeamTrainingPackage.findAll({ where: { id: { [Op.in]: items } } });
    for (const p of packages) {
      await TeamPackagePurchase.create({
        invoice: `#${randomToken(10)}`,
        user_id: row.user_id,
        package_id: p.id,
        price: Number(p.price || 0),
        tax: 0,
        payment_method: 'offline',
        status: 1,
      });
    }
  } else if (row.item_type === 'tutor_booking') {
    const schedules = await TutorSchedule.findAll({ where: { id: { [Op.in]: items } } });
    for (const s of schedules) {
      const totalAmount = Number(row.total_amount || 0);
      const tax = Number(row.tax || 0);
      const role = await tutorRole(s.tutor_id);
      let adminRevenue;
      let instructorRevenue = null;
      if (role === 'admin') {
        adminRevenue = totalAmount - tax;
      } else {
        const instructorPct = Number((await getSetting('instructor_revenue')) || 0);
        instructorRevenue = totalAmount * (instructorPct / 100);
        adminRevenue = totalAmount - instructorRevenue;
      }
      await TutorBooking.create({
        invoice: `#${randomToken(10)}`,
        student_id: row.user_id,
        schedule_id: s.id,
        price: totalAmount,
        tax,
        payment_method: 'offline',
        admin_revenue: adminRevenue,
        instructor_revenue: instructorRevenue,
        tutor_id: s.tutor_id,
        start_time: s.start_time,
        end_time: s.end_time,
      });
    }
  }

  await OfflinePayment.update({ status: 1 }, { where: { id } });
  return { id: Number(id), status: 1 };
}

async function declinePayment(id) {
  await OfflinePayment.update({ status: 2 }, { where: { id } });
  return { id: Number(id), status: 2 };
}

async function deletePayment(id) {
  await OfflinePayment.destroy({ where: { id } });
  return { id: Number(id) };
}

module.exports = { list, downloadDoc, acceptPayment, declinePayment, deletePayment };
