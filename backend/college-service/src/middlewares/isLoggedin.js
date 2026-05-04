import jwt from "jsonwebtoken";


export default function isLoggedIn(req, res, next) {
  try {
    // Accept either source so callers from different services work:
    //   - Public site (auth-service): logs in by setting an `accessToken` cookie.
    //   - Admin UI (admin-service): stores the JWT in localStorage and sends
    //     it as `Authorization: Bearer ...` (no cookie is set).
    // The signature is what we trust, not the transport.
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.accessToken || bearer;

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
