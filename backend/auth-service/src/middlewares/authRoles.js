const authRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userRole = req.user.role; // comes from JWT payload

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "Access denied. You do not have authority to access this.",
        });
      }

      next(); 
    } catch (error) {
      console.error("authorizeRoles middleware error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

export default authRoles;
