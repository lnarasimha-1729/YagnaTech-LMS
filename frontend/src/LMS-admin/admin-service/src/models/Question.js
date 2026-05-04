const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Question',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      quiz_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.TEXT('long'), allowNull: true },
      type: { type: DataTypes.STRING(255), allowNull: true },
      answer: { type: DataTypes.TEXT('medium'), allowNull: true },
      options: { type: DataTypes.TEXT('long'), allowNull: true },
      sort: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'questions',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
