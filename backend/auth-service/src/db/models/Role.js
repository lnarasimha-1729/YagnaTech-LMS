// models/Role.js
import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Role = sequelize.define('Role', {
  roleId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('student', 'instructor', 'admin', 'auditor'),
    allowNull: false,
  }
}, {
  tableName: 'roles',
  timestamps: false
});

export default Role;
