const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'NewsletterSubscriber',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      subscribed_at: { type: DataTypes.DATE, allowNull: true },
      unsubscribed_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'newsletter_subscribers', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );
};
