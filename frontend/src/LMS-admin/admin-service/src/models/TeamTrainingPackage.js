const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'TeamTrainingPackage',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      price: { type: DataTypes.DOUBLE, allowNull: true },
      course_privacy: { type: DataTypes.STRING(255), allowNull: true },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      allocation: { type: DataTypes.INTEGER, allowNull: true },
      expiry_type: { type: DataTypes.STRING(255), allowNull: true },
      start_date: { type: DataTypes.INTEGER, allowNull: true },
      expiry_date: { type: DataTypes.INTEGER, allowNull: true },
      features: { type: DataTypes.TEXT('long'), allowNull: true },
      thumbnail: { type: DataTypes.STRING(255), allowNull: true },
      pricing_type: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'team_training_packages', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
