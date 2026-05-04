/**
 * One-shot DB sync for the certificate module:
 *   - creates `certificates` (no FK constraints, since this DB's users/courses
 *     schema may differ from the Sequelize model)
 *   - creates `settings` (via the model's own sync, which is FK-free)
 *
 * Idempotent: uses CREATE TABLE IF NOT EXISTS / sync({ alter: false }).
 */
const { sequelize, Setting } = require('../src/models');

const CERTIFICATES_DDL = `
CREATE TABLE IF NOT EXISTS \`certificates\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` BIGINT UNSIGNED NULL,
  \`course_id\` BIGINT UNSIGNED NULL,
  \`bootcamp_id\` BIGINT UNSIGNED NULL,
  \`identifier\` VARCHAR(100) NULL,
  \`title\` VARCHAR(255) NULL,
  \`description\` TEXT NULL,
  \`template_image\` VARCHAR(255) NULL,
  \`status\` INT DEFAULT 1,
  \`issued_at\` DATETIME NULL,
  \`created_at\` DATETIME NOT NULL,
  \`updated_at\` DATETIME NOT NULL,
  UNIQUE KEY \`certificates_identifier_unique\` (\`identifier\`),
  KEY \`certificates_user_idx\` (\`user_id\`),
  KEY \`certificates_course_idx\` (\`course_id\`)
) ENGINE=InnoDB
`;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('[db] connected');

    await sequelize.query(CERTIFICATES_DDL);
    console.log('[db] certificates table ensured');

    await Setting.sync({ alter: false });
    console.log('[db] settings table ensured');

    process.exit(0);
  } catch (err) {
    console.error('[db] FAILED:', err.message);
    process.exit(1);
  }
})();
