const { DataTypes } = require('sequelize');

/** `courses` — canonical columns per migrations/2026_02_21_000039_create_courses_table. */
module.exports = (sequelize) => {
  return sequelize.define(
    'Course',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      short_description: { type: DataTypes.TEXT, allowNull: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      course_type: { type: DataTypes.STRING(255), allowNull: true },
      status: { type: DataTypes.STRING(255), allowNull: true },
      level: { type: DataTypes.STRING(255), allowNull: true },
      language: { type: DataTypes.STRING(255), allowNull: true },
      is_paid: { type: DataTypes.INTEGER, allowNull: true },
      is_best: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      price: { type: DataTypes.DOUBLE, allowNull: true },
      discounted_price: { type: DataTypes.DOUBLE, allowNull: true },
      discount_flag: { type: DataTypes.INTEGER, allowNull: true },
      enable_drip_content: { type: DataTypes.INTEGER, allowNull: true },
      drip_content_settings: { type: DataTypes.TEXT('long'), allowNull: true },
      meta_keywords: { type: DataTypes.TEXT, allowNull: true },
      meta_description: { type: DataTypes.TEXT, allowNull: true },
      thumbnail: { type: DataTypes.STRING(255), allowNull: true },
      banner: { type: DataTypes.STRING(255), allowNull: true },
      preview: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT('medium'), allowNull: true },
      requirements: { type: DataTypes.TEXT('medium'), allowNull: true },
      outcomes: { type: DataTypes.TEXT('medium'), allowNull: true },
      faqs: { type: DataTypes.TEXT('medium'), allowNull: true },
      instructor_ids: { type: DataTypes.TEXT, allowNull: true },
      average_rating: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      expiry_period: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'courses', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
