const { DataTypes } = require('sequelize');
const authDb = require('../config/authDatabase');

// Bound to the auth/college-service DB (lucy_devdb), not admin-service's
// lms_admin schema, because the canonical `colleges` table lives there and
// college-service writes to it directly. We share the row shape so records
// created from either side are interchangeable.
const College = authDb.define('College', {
    clgId: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    // Deterministic 4-char [A-Z0-9] code derived from clgId, shared with
    // college-service. Generated on create; immutable thereafter.
    yagId: {
        type: DataTypes.CHAR(4),
        allowNull: false,
        unique: true,
    },
    accesskey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    clgName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    clgAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    orgId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    branchIds: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    // Toggled from Manage Colleges → Options → Revoke / Give Access.
    // Defaults true so existing rows (where the column is added on the fly
    // via the startup ALTER in server.js) remain accessible by default.
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'colleges',
    timestamps: true,
});

module.exports = College;
