const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'LanguagePhrase',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      language_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      phrase_key: { type: DataTypes.STRING(255), allowNull: false },
      translated_text: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'language_phrases', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
