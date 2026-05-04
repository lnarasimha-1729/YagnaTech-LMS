const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Mirrors c:/lms-cp/database/migrations/2026_02_21_000050_create_certificates_table.php
const Certificate = sequelize.define('Certificate', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    course_id: { type: DataTypes.INTEGER, allowNull: true },
    identifier: { type: DataTypes.STRING(255), allowNull: false, unique: true },
}, { tableName: 'certificates', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// Mirrors the existing settings table — only the two keys this module touches.
const Setting = sequelize.define('Setting', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT('long'), allowNull: true },
}, { tableName: 'settings', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// Lightweight User and Course shapes so we can join when DB is available.
const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING(255),
    email: DataTypes.STRING(255),
}, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const Course = sequelize.define('Course', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: DataTypes.STRING(255),
    slug: DataTypes.STRING(255),
    level: DataTypes.STRING(100),
    language: DataTypes.STRING(100),
    user_id: DataTypes.INTEGER,
}, { tableName: 'courses', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

Certificate.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Certificate.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

module.exports = { sequelize, Certificate, Setting, User, Course };
