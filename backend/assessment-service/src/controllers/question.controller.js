import Question from "../db/models/Question.js";

// ------------------ CREATE ------------------
export async function addQuestion(req, res) {
  try {
    const { quesId, question, correctAns, options, category, questionSeverity } = req.body;

    if (!quesId || !question || !correctAns || !options) {
      return res.status(400).json({ message: "quesId, question, correctAns, and options are required" });
    }

    const existing = await Question.findByPk(quesId);
    if (existing) return res.status(409).json({ message: "Question already exists" });

    const newQuestion = await Question.create({
      quesId,
      question,
      correctAns,
      options,
      category,
      questionSeverity
    });

    res.status(201).json(newQuestion);
  } catch (err) {
    console.error("Error adding question:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------ GET ALL ------------------
export async function getAllQuestions(req, res) {
  try {
    const questions = await Question.findAll();
    res.json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------ GET BY ID ------------------
export async function getQuestionById(req, res) {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);

    if (!question) return res.status(404).json({ message: "Question not found" });

    res.json(question);
  } catch (err) {
    console.error("Error fetching question:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------ UPDATE ------------------
export async function updateQuestion(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const question = await Question.findByPk(id);
    if (!question) return res.status(404).json({ message: "Question not found" });

    await question.update(updates);
    res.json(question);
  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------ DELETE ------------------
export async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);
    if (!question) return res.status(404).json({ message: "Question not found" });

    await question.destroy();
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
