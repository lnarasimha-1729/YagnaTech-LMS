const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'KnowledgeBaseTopick',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      knowledge_base_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      topic_name: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'knowledge_base_topicks', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
