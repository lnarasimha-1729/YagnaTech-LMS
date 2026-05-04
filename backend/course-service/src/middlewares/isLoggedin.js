import jwt from "jsonwebtoken";


export default function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies?.accessToken; // check cookies only
    // console.log("isLoggedIn - Retrieved token from cookies:", token);

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        console.error("isLoggedIn - JWT verification error:", err);
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Attach payload to request for later use
      req.user = decoded;
      // console.log("isLoggedIn - req.user set to:", req.user);
      next();
    });
  } catch (error) {
    console.error("isLoggedIn middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
