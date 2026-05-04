const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'KnowledgeBase',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    },
    { tableName: 'knowledge_bases', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
