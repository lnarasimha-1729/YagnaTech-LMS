
// generate college ID
const generateCollegeId = () => {
  return 'clg_' + Math.random().toString(36).substr(2, 9);
  // Example output: clg_k9x8w2z1q
}

// generate access key
const generateAccessKey = () => {
  return Math.random().toString(36).substr(2, 15);
  // Example output: k9x8w2z1q3m5n7p
}

export { generateCollegeId, generateAccessKey };
