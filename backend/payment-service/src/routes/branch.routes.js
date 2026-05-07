import { Router } from "express";
import isLoggedIn from "../middlewares/isLoggedin.js";
import authRoles from "../middlewares/authRoles.js";
import * as controller from "../controllers/branch.controller.js";

const router = Router();

// Branch management
router.post("/add", isLoggedIn, authRoles(["admin"]), controller.addBranch);
router.get("/all", isLoggedIn, authRoles(["admin", "user"]), controller.getAllBranches);
router.put("/update/:branchId", isLoggedIn, authRoles(["admin"]), controller.updateBranch);
router.delete("/delete/:branchId", isLoggedIn, authRoles(["admin"]), controller.deleteBranch);

// College-Branch relations
router.post("/assign", isLoggedIn, authRoles(["admin"]), controller.assignBranchesToCollege);

export default router;
