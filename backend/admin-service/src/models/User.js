const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        role: { type: DataTypes.STRING(100), allowNull: false },
        email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
        status: { type: DataTypes.INTEGER },
        name: { type: DataTypes.STRING(255) },
        phone: { type: DataTypes.STRING(255) },
        website: { type: DataTypes.STRING(255) },
        skills: { type: DataTypes.TEXT },
        facebook: { type: DataTypes.TEXT },
        twitter: { type: DataTypes.STRING(255) },
        linkedin: { type: DataTypes.STRING(255) },
        address: { type: DataTypes.STRING(255) },
        college_name: { type: DataTypes.STRING(255) },
        // FK to colleges.clgId in the auth-service DB (lucy_devdb). Null for root
        // admins; set for college admins so the dashboard can scope its KPIs.
        college_id: { type: DataTypes.STRING(255), allowNull: true },
        about: { type: DataTypes.TEXT },
        biography: { type: DataTypes.TEXT('long') },
        educations: { type: DataTypes.TEXT('long') },
        photo: { type: DataTypes.STRING(255) },
        email_verified_at: { type: DataTypes.DATE },
        password: { type: DataTypes.STRING(255) },
        remember_token: { type: DataTypes.STRING(100) },
        paymentkeys: { type: DataTypes.TEXT('long') },
        video_url: { type: DataTypes.STRING(255) },
    }, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

    User.associate = (models) => {
        User.hasMany(models.Course, { foreignKey: 'user_id', as: 'courses' });
    };
    return User;
};
