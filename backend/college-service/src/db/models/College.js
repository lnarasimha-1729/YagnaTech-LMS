import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

const College = sequelize.define("College", {
  clgId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  accesskey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  clgName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clgAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: "organisations",
      key: "orgId"
    }
  },
  branchIds: {
    type: DataTypes.JSON, // stores array of branch PKs like ["CSE", "ECE"]
    allowNull: true
  }
}, {
  tableName: "colleges",
  timestamps: true
});

export default College;
