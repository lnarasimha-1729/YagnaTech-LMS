import { DataTypes, INTEGER } from 'sequelize';
import sequelize from '../index.js';
import Role from './Role.js';

const User = sequelize.define('User', {
  userId: { 
    type: DataTypes.STRING,
    primaryKey: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false,
    unique: true, 
  },
  passwordHash: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  phone: { 
    type: DataTypes.STRING 
  },
  dob: { 
    type: DataTypes.DATEONLY 
  },
  gender: { 
    type: DataTypes.ENUM('male', 'female') 
  },
  yearOfEducation: {
    type: DataTypes.STRING
  },
  branchId: {
    type: DataTypes.STRING
  },
  collegeId: {
    type: DataTypes.STRING
  },
  yearOfStudy: {
    type: DataTypes.INTEGER
  },
  // === Academic Information (optional signup fields) ===
  educationLevel: {
    type: DataTypes.ENUM('inter', 'bachelor', 'master', 'phd', 'other'),
    allowNull: true
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: true
  },
  collegeName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  graduationYear: {
    type: DataTypes.STRING,
    allowNull: true
  },
  collegeCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  orgId: { 
    type: DataTypes.STRING 
  },
  assessmentId: { 
    type: DataTypes.STRING
  },
  programInterested: {
    type: DataTypes.STRING
  },
  // === Instructor-specific profile fields (all optional, null for non-instructors)
  expertise: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bio: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  linkedinUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  profileStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'pending'
  },
  // College-admin approval of a student's signup. false until the college admin
  // approves them in the Student Requests tab. The college dashboard only counts
  // approved students.
  isApproved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  location: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  lastLogin: { 
    type: DataTypes.DATE 
  },
  preScore: {
    type : DataTypes.INTEGER
  },
  // Seconds the student spent on the pre-assessment (timer start → submit).
  // Lives alongside preScore in the student schema.
  preScoreDuration: {
    type : DataTypes.INTEGER,
    allowNull: true
  },
  postScore: {
    type : INTEGER
  },
  // Seconds the student spent on the post-assessment (timer start → submit).
  // Mirrors preScoreDuration. The admin-service adds the underlying column
  // on startup if it's missing, so this works without a manual migration.
  postScoreDuration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING(1024),
    allowNull: true
  },
  // SHA-256 hash of the raw reset token mailed to the user. We never store
  // the raw token so a DB leak can't be used to reset accounts directly.
  passwordResetToken: {
    type: DataTypes.STRING(128),
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  roleId: {  // foreign key reference
    type: DataTypes.STRING,
    references: {
      model: Role,
      key: 'roleId'
    },
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true, // adds createdAt and updatedAt automatically
});

// Associations
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });


export default User;
