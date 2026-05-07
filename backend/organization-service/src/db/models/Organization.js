import { DataTypes } from "sequelize";
import sequelize from "../index.js";

const Organisation = sequelize.define("Organisation", {
  orgId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  accesskey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  orgName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orgState: {
    type: DataTypes.STRING,
    allowNull: true
  },
  orgCountry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  orgAddress: {
    type: DataTypes.TEXT, // address can be long
    allowNull: true
  },
  orgPin: {
    type: DataTypes.STRING, // in case postal codes contain letters (e.g., Canada/UK)
    allowNull: true
  }
}, {
  tableName: "organisations",
  timestamps: true // adds createdAt & updatedAt
});

export default Organisation;
