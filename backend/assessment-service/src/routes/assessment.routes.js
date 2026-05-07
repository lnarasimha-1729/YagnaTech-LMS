import { Router } from "express";
import * as controller from "../controllers/assessment.controller.js";
import isLoggedIn from "../middlewares/isLoggedin.js";
import authRoles from "../middlewares/authRoles.js";

const router = Router();

// CRUD routes
router.post("/add", isLoggedIn, authRoles(["admin"]), controller.addAssessment);
router.get("/all", isLoggedIn, authRoles(["admin"]), controller.getAllAssessments);
router.get("/:id", isLoggedIn, controller.getAssessmentById);
router.put("/:id", isLoggedIn, authRoles(["admin"]), controller.updateAssessment);
router.delete("/:id", isLoggedIn, authRoles(["admin"]), controller.deleteAssessment);

export default router;
