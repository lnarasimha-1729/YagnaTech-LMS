const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'BootcampLiveClass',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      module_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT('long'), allowNull: true },
      start_time: { type: DataTypes.INTEGER, allowNull: true },
      end_time: { type: DataTypes.INTEGER, allowNull: true },
      sort: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.STRING(255), allowNull: true },
      provider: { type: DataTypes.STRING(255), allowNull: true },
      joining_data: { type: DataTypes.TEXT('long'), allowNull: true },
      force_stop: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    },
    { tableName: 'bootcamp_live_classes', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
