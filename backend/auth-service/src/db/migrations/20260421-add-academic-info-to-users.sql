-- Migration: add Academic Information columns to users table
-- All columns are nullable so existing users remain valid (backward compatible).

ALTER TABLE `users`
  ADD COLUMN `educationLevel` ENUM('inter', 'bachelor', 'master', 'phd', 'other') NULL AFTER `yearOfStudy`,
  ADD COLUMN `branch` VARCHAR(255) NULL AFTER `educationLevel`,
  ADD COLUMN `collegeName` VARCHAR(255) NULL AFTER `branch`,
  ADD COLUMN `graduationYear` VARCHAR(255) NULL AFTER `collegeName`,
  ADD COLUMN `collegeCode` VARCHAR(255) NULL AFTER `graduationYear`;

-- Rollback:
-- ALTER TABLE `users`
--   DROP COLUMN `educationLevel`,
--   DROP COLUMN `branch`,
--   DROP COLUMN `collegeName`,
--   DROP COLUMN `graduationYear`,
--   DROP COLUMN `collegeCode`;
