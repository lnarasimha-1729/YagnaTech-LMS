const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'PasswordResetToken',
    {
      email: { type: DataTypes.STRING(255), primaryKey: true },
      token: { type: DataTypes.STRING(255), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'password_reset_tokens', timestamps: false }
  );
};
