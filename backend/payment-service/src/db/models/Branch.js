import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const Branch = sequelize.define("Branch", {
  branchId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  branchName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: "branches",
  timestamps: false
});

export default Branch;
