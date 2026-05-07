import { Router } from "express";
import * as controller from "../controllers/question.controller.js";
import isLoggedIn from "../middlewares/isLoggedin.js";
import authRoles from "../middlewares/authRoles.js";

const router = Router();

// CRUD routes
router.post("/add", isLoggedIn, authRoles(["admin"]), controller.addQuestion);
router.get("/all", isLoggedIn, controller.getAllQuestions);
router.get("/:id", isLoggedIn, controller.getQuestionById);
router.put("/:id", isLoggedIn, authRoles(["admin"]), controller.updateQuestion);
router.delete("/:id", isLoggedIn, authRoles(["admin"]), controller.deleteQuestion);

export default router;
