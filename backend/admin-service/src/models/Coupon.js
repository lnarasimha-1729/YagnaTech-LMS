const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Coupon = sequelize.define('Coupon', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        code: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        discount: { type: DataTypes.INTEGER, allowNull: false },
        expiry: { type: DataTypes.BIGINT, allowNull: false },
        status: { type: DataTypes.TINYINT, defaultValue: 1 },
    }, { tableName: 'coupons', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

    return Coupon;
};
