const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Newsletter',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      subject: { type: DataTypes.STRING(255), allowNull: false },
      body: { type: DataTypes.TEXT('long'), allowNull: true },
      sent_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'newsletters', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
