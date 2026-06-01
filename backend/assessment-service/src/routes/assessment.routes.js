import { Router } from "express";
import * as controller from "../controllers/assessment.controller.js";
import isLoggedIn from "../middlewares/isLoggedin.js";
import authRoles from "../middlewares/authRoles.js";

const router = Router();

// CRUD routes
router.post("/add", isLoggedIn, authRoles(["admin"]), controller.addAssessment);
router.get("/all", isLoggedIn, authRoles(["admin"]), controller.getAllAssessments);
// Student-readable: resolve the active pre-assessment for the welcome page.
// Declared before "/:id" so the literal segment isn't swallowed by the param.
router.get("/active/pre", isLoggedIn, controller.getActivePreAssessment);
router.get("/:id", isLoggedIn, controller.getAssessmentById);
router.put("/:id", isLoggedIn, authRoles(["admin"]), controller.updateAssessment);
router.delete("/:id", isLoggedIn, authRoles(["admin"]), controller.deleteAssessment);

export default router;
