const { DataTypes } = require('sequelize');

/** Mirrors Laravel `users` table (0001_01_01_000000). Keep column names in sync. */
module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      role: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      status: { type: DataTypes.INTEGER, allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(255), allowNull: true },
      website: { type: DataTypes.STRING(255), allowNull: true },
      skills: { type: DataTypes.TEXT, allowNull: true },
      facebook: { type: DataTypes.TEXT, allowNull: true },
      twitter: { type: DataTypes.STRING(255), allowNull: true },
      linkedin: { type: DataTypes.STRING(255), allowNull: true },
      address: { type: DataTypes.STRING(255), allowNull: true },
      about: { type: DataTypes.TEXT, allowNull: true },
      biography: { type: DataTypes.TEXT('long'), allowNull: true },
      educations: { type: DataTypes.TEXT('long'), allowNull: true },
      photo: { type: DataTypes.STRING(255), allowNull: true },
      email_verified_at: { type: DataTypes.DATE, allowNull: true },
      password: { type: DataTypes.STRING(255), allowNull: true },
      remember_token: { type: DataTypes.STRING(100), allowNull: true },
      paymentkeys: { type: DataTypes.TEXT('long'), allowNull: true },
      video_url: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      defaultScope: { attributes: { exclude: ['password', 'remember_token'] } },
      scopes: { withSecrets: { attributes: {} } },
    }
  );

  return User;
};
