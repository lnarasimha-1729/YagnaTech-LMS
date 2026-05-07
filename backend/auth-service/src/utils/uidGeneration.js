// user id generation
const generateUserID = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000); // 9 random digits
    return `20${randomDigits}`; // Prefix "20"
  };

// generate role id with prefix parameter
  const generateRoleID = (prefix) => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 random digits
    return `${prefix}${randomDigits}`; // Prefix + random digits
  };

// generate our uuid
  const generateCustomUUID = () => {
    const randomPart1 = Math.floor(Math.random() * 1e8).toString(16).padStart(8, '0');
    const randomPart2 = Math.floor(Math.random() * 1e8).toString(16).padStart(8, '0');
    const randomPart3 = Math.floor(Math.random() * 1e8).toString(16).padStart(8, '0');
    const randomPart4 = Math.floor(Math.random() * 1e8).toString(16).padStart(8, '0');
    return `${randomPart1}-${randomPart2}-${randomPart3}-${randomPart4}`;
  };




  export {generateUserID, generateRoleID, generateCustomUUID};
