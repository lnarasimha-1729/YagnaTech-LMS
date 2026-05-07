import { Router } from "express";
import * as controller from "../controllers/questionSet.controller.js";
import isLoggedIn from "../middlewares/isLoggedin.js";
import authRoles from "../middlewares/authRoles.js";

const router = Router();

// CRUD routes
router.post("/add", isLoggedIn, authRoles(["admin"]), controller.addQuestionSet);
router.get("/all", isLoggedIn, controller.getAllQuestionSets);
router.get("/:id", isLoggedIn, controller.getQuestionSetById);
router.put("/:id", isLoggedIn, authRoles(["admin"]), controller.updateQuestionSet);
router.delete("/:id", isLoggedIn, authRoles(["admin"]), controller.deleteQuestionSet);

export default router;
