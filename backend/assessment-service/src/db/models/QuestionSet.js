import { DataTypes } from "sequelize";
import sequelize from "../index.js";

const QuestionSet = sequelize.define("QuestionSet", {
  setId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  setName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  questions: {
    type: DataTypes.JSON,   // stores array of quesIds
    allowNull: false,
    defaultValue: []        // e.g. ["Q1", "Q2", "Q3"]
  }
}, {
  tableName: "questionsets",
  timestamps: true
});

export default QuestionSet;
