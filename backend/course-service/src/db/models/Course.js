import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Course = sequelize.define('Course', {
  courseId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER, // in hours or minutes, your choice
    allowNull: false,
  },
  isPreAssessmentNeeded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  modules: {
    type: DataTypes.JSON, // store modules as an array of objects
    allowNull: true,
  },
}, {
  tableName: 'courses',
  timestamps: true, // adds createdAt & updatedAt automatically
});

export default Course;


// ==============Notes===================
// modules is stored as JSON so you can save an array like:
// [
//   { "moduleId": "M1", "title": "Introduction", "duration": 30 },
//   { "moduleId": "M2", "title": "Advanced Concepts", "duration": 60 }
// ]