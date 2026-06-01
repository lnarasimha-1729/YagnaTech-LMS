const { DataTypes } = require('sequelize');

/**
 * Submissions from the public "Get in Touch" / "Partner with Us" contact form.
 * One row per message. The public POST /api/public/contact endpoint persists a
 * row here AND enqueues an admin notification email (email_jobs). Lives in the
 * admin DB so it shares the connection and an admin view can list it later.
 */
module.exports = (sequelize) => {
    const ContactMessage = sequelize.define('ContactMessage', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        first_name: { type: DataTypes.STRING(120), allowNull: false },
        last_name: { type: DataTypes.STRING(120), allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: false },
        subject: { type: DataTypes.STRING(255), allowNull: true },
        message: { type: DataTypes.TEXT, allowNull: false },
        // 'new' until an admin marks it handled — leaves room for a simple
        // inbox view without another migration.
        status: {
            type: DataTypes.ENUM('new', 'read', 'archived'),
            allowNull: false,
            defaultValue: 'new',
        },
    }, {
        tableName: 'contact_messages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ fields: ['status', 'created_at'] }],
    });

    return ContactMessage;
};
