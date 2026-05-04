// Sequelize migration: add Academic Information columns to users.
// Usage (sequelize-cli): npx sequelize-cli db:migrate
// Or run programmatically via queryInterface.

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'educationLevel', {
    type: Sequelize.ENUM('inter', 'bachelor', 'master', 'phd', 'other'),
    allowNull: true
  });
  await queryInterface.addColumn('users', 'branch', {
    type: Sequelize.STRING,
    allowNull: true
  });
  await queryInterface.addColumn('users', 'collegeName', {
    type: Sequelize.STRING,
    allowNull: true
  });
  await queryInterface.addColumn('users', 'graduationYear', {
    type: Sequelize.STRING,
    allowNull: true
  });
  await queryInterface.addColumn('users', 'collegeCode', {
    type: Sequelize.STRING,
    allowNull: true
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'collegeCode');
  await queryInterface.removeColumn('users', 'graduationYear');
  await queryInterface.removeColumn('users', 'collegeName');
  await queryInterface.removeColumn('users', 'branch');
  await queryInterface.removeColumn('users', 'educationLevel');
}
