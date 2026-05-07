import { DataTypes } from "sequelize";
import sequelize from "../index.js";

const Question = sequelize.define("Question", {
  quesId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  correctAns: {
    type: DataTypes.STRING,
    allowNull: false
  },
  options: {
    type: DataTypes.JSON,  // { option1: "A", option2: "B", option3: "C", option4: "D" }
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  questionSeverity: {
    type: DataTypes.ENUM("easy", "medium", "hard"),
    allowNull: true
  }
}, {
  tableName: "questions",
  timestamps: true
});

export default Question;
