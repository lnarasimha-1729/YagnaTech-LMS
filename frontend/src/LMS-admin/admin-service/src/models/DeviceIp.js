const { DataTypes } = require('sequelize');

/**
 * Mirrors Laravel `device_ips` migration (2026_02_21_000035).
 * NOTE: `user_agent` stores the base64(user_id + real-user-agent) fingerprint,
 * not the raw UA string — matches Laravel's AuthenticatedSessionController logic.
 */
module.exports = (sequelize) => {
  return sequelize.define(
    'DeviceIp',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      ip_address: { type: DataTypes.STRING(255), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
      session_id: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'device_ips',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
