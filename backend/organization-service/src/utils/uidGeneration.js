
// generate organization ID
const generateOrganizationId = () => {
  return 'org_' + Math.random().toString(36).substr(2, 9);
  // Example output: org_k9x8w2z1q
}

// generate access key
const generateAccessKey = () => {
  return Math.random().toString(36).substr(2, 15);
  // Example output: k9x8w2z1q3m5n7p
}

export { generateOrganizationId, generateAccessKey };
