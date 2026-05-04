
// generate enrollment ID
const generateEnrollmentId = () => {
  return 'enr_' + Math.random().toString(36).substr(2, 9);
  // Example output: enr_k9x8w2z1q
}

export { generateEnrollmentId };
