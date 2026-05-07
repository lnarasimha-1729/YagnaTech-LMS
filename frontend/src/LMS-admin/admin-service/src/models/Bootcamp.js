const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Bootcamp',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      description: { type: DataTypes.TEXT('long'), allowNull: true },
      short_description: { type: DataTypes.TEXT, allowNull: true },
      is_paid: { type: DataTypes.INTEGER, allowNull: true },
      price: { type: DataTypes.DOUBLE, allowNull: true },
      discount_flag: { type: DataTypes.INTEGER, allowNull: true },
      discounted_price: { type: DataTypes.DOUBLE, allowNull: true },
      publish_date: { type: DataTypes.INTEGER, allowNull: true },
      thumbnail: { type: DataTypes.STRING(255), allowNull: true },
      faqs: { type: DataTypes.TEXT('long'), allowNull: true },
      requirements: { type: DataTypes.TEXT('long'), allowNull: true },
      outcomes: { type: DataTypes.TEXT('long'), allowNull: true },
      meta_keywords: { type: DataTypes.TEXT, allowNull: true },
      meta_description: { type: DataTypes.TEXT('long'), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'bootcamps', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
