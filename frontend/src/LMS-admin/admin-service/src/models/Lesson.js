const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'Lesson',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(255), allowNull: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      section_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      lesson_type: { type: DataTypes.STRING(255), allowNull: true },
      duration: { type: DataTypes.STRING(255), allowNull: true },
      total_mark: { type: DataTypes.INTEGER, allowNull: true },
      pass_mark: { type: DataTypes.INTEGER, allowNull: true },
      retake: { type: DataTypes.INTEGER, allowNull: true },
      lesson_src: { type: DataTypes.STRING(255), allowNull: true },
      attachment: { type: DataTypes.TEXT('long'), allowNull: true },
      attachment_type: { type: DataTypes.STRING(255), allowNull: true },
      video_type: { type: DataTypes.TEXT, allowNull: true },
      thumbnail: { type: DataTypes.STRING(255), allowNull: true },
      is_free: { type: DataTypes.INTEGER, allowNull: true },
      sort: { type: DataTypes.INTEGER, allowNull: true },
      description: { type: DataTypes.TEXT('long'), allowNull: true },
      summary: { type: DataTypes.TEXT('long'), allowNull: true },
      status: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'lessons',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
