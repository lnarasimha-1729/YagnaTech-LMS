// import 'dotenv/config';
// import express from 'express';
// import helmet from 'helmet';
// import cors from 'cors';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import sequelize from './db/index.js';
// import cookieParser from "cookie-parser";
// import assessmentRoutes from './routes/assessment.routes.js';
// import questionSetRoutes from './routes/questionSet.routes.js';
// import questionRoutes from './routes/question.routes.js';



// import dotenv from 'dotenv';

// dotenv.config()

// const app = express();

// const allowedOrigin = (origin, cb) => {
//   if (!origin) return cb(null, true);
//   if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
//   return cb(new Error('Not allowed by CORS'));
// };

// app.use(cors({
//   origin: allowedOrigin,
//   credentials: true,
// }));

// app.use(helmet());
// app.use(express.json());
// app.use(morgan('dev'));
// app.use(cookieParser());
// app.use(rateLimit({ windowMs: 60_000, max: 200 }));

// app.get('/health', (req, res) => {
//   res.json({ status: 'ok', service: process.env.SERVICE_NAME });
// });

// app.get("/", (req, res) => {
//   res.send("Welcome to the Assessment Service API");
// });

// app.use('/', assessmentRoutes);
// app.use('/question', questionRoutes);
// app.use('/question-set', questionSetRoutes);

// export async function initDb() {
//   await sequelize.authenticate();
//   await sequelize.sync();
//   console.log('🗄️  Database connected and synced---');
// }

// export default app;



import './loadEnv.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import sequelize from './db/index.js';
import Question from './db/models/Question.js';
import QuestionSet from './db/models/QuestionSet.js';
import Assessment from './db/models/Assessment.js';
import cookieParser from "cookie-parser";
import assessmentRoutes from './routes/assessment.routes.js';
import questionSetRoutes from './routes/questionSet.routes.js';
import questionRoutes from './routes/question.routes.js';
import preAssessmentRegistrationRoutes from './routes/preAssessmentRegistration.routes.js';
import './db/models/PreAssessmentRegistration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

// `crossOriginResourcePolicy` blocks cross-origin <img>/iframe loads of the
// uploaded proofs by default — relax it so the admin frontend (different
// origin in dev) can preview the proof file.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: process.env.SERVICE_NAME });
});

app.get("/", (req, res) => {
  res.send("Welcome to the Assessment Service API");
});

// Serve uploaded files (college proofs) for admin previews. The folder is
// auto-created by the upload middleware on first run.
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    fallthrough: false,
    maxAge: '1h',
  })
);

app.use('/', assessmentRoutes);
app.use('/question', questionRoutes);
app.use('/question-set', questionSetRoutes);
app.use('/pre-assessment-registration', preAssessmentRegistrationRoutes);

// ─── Pre-assessment seed data ────────────────────────────────────────────────
const ALL_QUESTIONS = [
  // ── Original 10 ──────────────────────────────────────────────────────────
  {
    quesId: 'Q1',
    question: 'What does AI stand for?',
    correctAns: 'option2',
    options: { option1: 'Automated Intelligence', option2: 'Artificial Intelligence', option3: 'Applied Integration', option4: 'Analytical Interface' },
    category: 'AI', questionSeverity: 'easy',
  },
  {
    quesId: 'Q2',
    question: 'Which of the following is an example of machine learning?',
    correctAns: 'option3',
    options: { option1: 'A calculator performing arithmetic', option2: 'A thermostat turning on heat at a set time', option3: 'A spam filter learning to identify junk emails from examples', option4: 'A search engine returning hardcoded results' },
    category: 'ML', questionSeverity: 'easy',
  },
  {
    quesId: 'Q3',
    question: 'What is a neural network inspired by?',
    correctAns: 'option1',
    options: { option1: 'The structure and function of the human brain', option2: 'The architecture of modern computer CPUs', option3: 'Graph theory in mathematics', option4: 'Relational database design' },
    category: 'Deep Learning', questionSeverity: 'easy',
  },
  {
    quesId: 'Q4',
    question: 'Which of the following is NOT a type of machine learning?',
    correctAns: 'option4',
    options: { option1: 'Supervised learning', option2: 'Unsupervised learning', option3: 'Reinforcement learning', option4: 'Procedural learning' },
    category: 'ML', questionSeverity: 'easy',
  },
  {
    quesId: 'Q5',
    question: 'What is the main goal of a recommendation system?',
    correctAns: 'option2',
    options: { option1: 'To classify data into predefined categories', option2: 'To suggest relevant items to users based on their preferences and behaviour', option3: 'To detect anomalies in network traffic', option4: 'To translate text from one language to another' },
    category: 'AI', questionSeverity: 'easy',
  },
  {
    quesId: 'Q6',
    question: 'Which Python library is most widely used for machine learning?',
    correctAns: 'option3',
    options: { option1: 'NumPy', option2: 'Pandas', option3: 'Scikit-learn', option4: 'Matplotlib' },
    category: 'ML', questionSeverity: 'easy',
  },
  {
    quesId: 'Q7',
    question: 'What does "training a model" mean in machine learning?',
    correctAns: 'option1',
    options: { option1: 'Adjusting the model\'s parameters using data so it can make accurate predictions', option2: 'Writing the source code for the model from scratch', option3: 'Testing the model on unseen data to measure accuracy', option4: 'Deploying the model to a production server' },
    category: 'ML', questionSeverity: 'easy',
  },
  {
    quesId: 'Q8',
    question: 'What is the purpose of a training dataset?',
    correctAns: 'option2',
    options: { option1: 'To evaluate the final performance of the model', option2: 'To teach the model by exposing it to labeled examples during learning', option3: 'To store the model weights after training is complete', option4: 'To tune hyperparameters before deployment' },
    category: 'ML', questionSeverity: 'easy',
  },
  {
    quesId: 'Q9',
    question: 'Which of the following best describes a classification task?',
    correctAns: 'option4',
    options: { option1: 'Predicting a continuous numerical value such as house price', option2: 'Grouping similar data points without any labels', option3: 'Learning an optimal action policy through trial and error', option4: 'Assigning an input to one of several predefined categories (e.g. spam or not spam)' },
    category: 'AI', questionSeverity: 'easy',
  },
  {
    quesId: 'Q10',
    question: 'What is computer vision primarily concerned with?',
    correctAns: 'option3',
    options: { option1: 'Teaching computers to understand spoken language', option2: 'Optimising database query performance', option3: 'Enabling computers to interpret and understand visual information from images or video', option4: 'Building user interfaces for desktop applications' },
    category: 'AI', questionSeverity: 'easy',
  },
  // ── Additional 10 ────────────────────────────────────────────────────────
  {
    quesId: 'Q11',
    question: 'Which of the following best describes supervised learning?',
    correctAns: 'option2',
    options: { option1: 'The model learns by exploring an environment and receiving rewards', option2: 'The model is trained on labeled input-output pairs to learn a mapping function', option3: 'The model groups data points without any labels', option4: 'The model generates new data samples from a distribution' },
    category: 'AI', questionSeverity: 'easy',
  },
  {
    quesId: 'Q12',
    question: 'What does "overfitting" mean in machine learning?',
    correctAns: 'option3',
    options: { option1: 'The model performs poorly on both training and test data', option2: 'The model has too few parameters to capture the data complexity', option3: 'The model performs well on training data but poorly on unseen test data', option4: 'The model takes too long to converge during training' },
    category: 'ML', questionSeverity: 'easy',
  },
  {
    quesId: 'Q13',
    question: 'Which activation function is most commonly used in hidden layers of deep neural networks today?',
    correctAns: 'option1',
    options: { option1: 'ReLU (Rectified Linear Unit)', option2: 'Sigmoid', option3: 'Tanh', option4: 'Softmax' },
    category: 'Deep Learning', questionSeverity: 'medium',
  },
  {
    quesId: 'Q14',
    question: 'What is the primary purpose of a confusion matrix?',
    correctAns: 'option4',
    options: { option1: 'To visualize the loss curve during model training', option2: 'To reduce the dimensionality of the feature space', option3: 'To select the best hyperparameters for a model', option4: 'To evaluate classification model performance by showing correct and incorrect predictions' },
    category: 'AI', questionSeverity: 'easy',
  },
  {
    quesId: 'Q15',
    question: 'In the context of neural networks, what is "backpropagation"?',
    correctAns: 'option2',
    options: { option1: 'A technique to initialize weights close to zero', option2: 'An algorithm that computes gradients of the loss with respect to weights and updates them', option3: 'A regularization method that randomly drops neurons during training', option4: 'A forward pass of data through all layers of the network' },
    category: 'Deep Learning', questionSeverity: 'medium',
  },
  {
    quesId: 'Q16',
    question: 'Which of the following is a correct description of Natural Language Processing (NLP)?',
    correctAns: 'option3',
    options: { option1: 'A branch of AI focused on enabling computers to see and interpret images', option2: 'A method for robots to navigate physical environments', option3: 'A field of AI that enables computers to understand, interpret, and generate human language', option4: 'A technique for optimising numerical computations on GPUs' },
    category: 'NLP', questionSeverity: 'easy',
  },
  {
    quesId: 'Q17',
    question: 'What is the role of the learning rate in gradient descent?',
    correctAns: 'option1',
    options: { option1: 'It controls the size of the step taken towards the minimum of the loss function during each update', option2: 'It determines the number of training epochs', option3: 'It sets the proportion of neurons dropped during training', option4: 'It defines the depth of the neural network' },
    category: 'ML', questionSeverity: 'medium',
  },
  {
    quesId: 'Q18',
    question: 'Which algorithm is typically used to build decision trees?',
    correctAns: 'option4',
    options: { option1: 'K-Means', option2: 'Gradient Descent', option3: 'Backpropagation', option4: 'ID3 / CART (based on information gain or Gini impurity)' },
    category: 'ML', questionSeverity: 'medium',
  },
  {
    quesId: 'Q19',
    question: 'What distinguishes a Large Language Model (LLM) like GPT from a traditional rule-based chatbot?',
    correctAns: 'option2',
    options: { option1: 'LLMs follow hand-crafted decision trees to generate responses', option2: 'LLMs learn statistical patterns from vast text data and generate contextually relevant responses without explicit rules', option3: 'LLMs can only answer questions from a fixed knowledge base', option4: 'LLMs require a human to review every response before delivery' },
    category: 'AI', questionSeverity: 'hard',
  },
  {
    quesId: 'Q20',
    question: 'Which of the following best describes the concept of "transfer learning"?',
    correctAns: 'option3',
    options: { option1: 'Moving a trained model from a development server to a production server', option2: 'Copying weights from one neural network layer to another within the same model', option3: 'Reusing a model pre-trained on a large dataset as the starting point for a different but related task', option4: 'Transferring training data from one organisation to another for collaborative learning' },
    category: 'Deep Learning', questionSeverity: 'hard',
  },
];

const PRE_ASSESSMENT_SET_ID  = 'QS-AI-PRE';
const PRE_ASSESSMENT_ID      = 'A1';
const PRE_ASSESSMENT_TIMER   = 1800; // 30 minutes in seconds

const POST_QUESTIONS = [
  {
    quesId: 'Q21',
    question: 'What is the vanishing gradient problem in deep neural networks?',
    correctAns: 'option2',
    options: { option1: 'Gradients become too large, causing weight updates to overshoot', option2: 'Gradients become extremely small in early layers, making learning very slow or stopping it altogether', option3: 'The network forgets previously learned weights during fine-tuning', option4: 'Loss converges to zero too quickly before the model is fully trained' },
    category: 'Deep Learning', questionSeverity: 'hard',
  },
  {
    quesId: 'Q22',
    question: 'Which technique is used to prevent overfitting by randomly deactivating neurons during training?',
    correctAns: 'option3',
    options: { option1: 'Batch normalisation', option2: 'Weight decay (L2 regularisation)', option3: 'Dropout', option4: 'Early stopping' },
    category: 'Deep Learning', questionSeverity: 'medium',
  },
  {
    quesId: 'Q23',
    question: 'In the Transformer architecture, what is the purpose of the "attention mechanism"?',
    correctAns: 'option1',
    options: { option1: 'To allow the model to focus on relevant parts of the input sequence when producing each output token', option2: 'To compress the input sequence into a fixed-size vector', option3: 'To randomly mask tokens so the model learns bidirectional context', option4: 'To normalise the activations between encoder and decoder layers' },
    category: 'NLP', questionSeverity: 'hard',
  },
  {
    quesId: 'Q24',
    question: 'What does "precision" measure in a classification model?',
    correctAns: 'option4',
    options: { option1: 'The proportion of actual positives that were correctly identified', option2: 'The overall percentage of correct predictions across all classes', option3: 'The harmonic mean of precision and recall', option4: 'Of all instances predicted as positive, the proportion that are actually positive' },
    category: 'AI', questionSeverity: 'medium',
  },
  {
    quesId: 'Q25',
    question: 'What is the main difference between bagging and boosting in ensemble learning?',
    correctAns: 'option2',
    options: { option1: 'Bagging trains models sequentially; boosting trains them in parallel', option2: 'Bagging trains models in parallel on random data subsets; boosting trains sequentially, each correcting the previous model\'s errors', option3: 'Bagging reduces bias; boosting reduces variance', option4: 'Bagging uses only decision trees; boosting can use any model type' },
    category: 'ML', questionSeverity: 'hard',
  },
  {
    quesId: 'Q26',
    question: 'Which of the following best describes a Convolutional Neural Network (CNN)?',
    correctAns: 'option3',
    options: { option1: 'A network that processes sequences using hidden states passed between time steps', option2: 'A network trained with rewards and penalties to learn optimal actions', option3: 'A network that uses learnable filters to detect spatial features (edges, textures) in images', option4: 'A network that maps sentences to fixed-dimensional embedding vectors' },
    category: 'Deep Learning', questionSeverity: 'medium',
  },
  {
    quesId: 'Q27',
    question: 'What is "feature engineering" in the context of machine learning?',
    correctAns: 'option1',
    options: { option1: 'The process of selecting, transforming, and creating input variables to improve model performance', option2: 'Automatically learning hierarchical representations from raw data using deep networks', option3: 'Tuning hyperparameters such as learning rate and batch size', option4: 'Splitting the dataset into training, validation, and test sets' },
    category: 'ML', questionSeverity: 'medium',
  },
  {
    quesId: 'Q28',
    question: 'What does "k" represent in K-Fold Cross-Validation?',
    correctAns: 'option4',
    options: { option1: 'The number of features selected for training', option2: 'The number of nearest neighbours used in the KNN algorithm', option3: 'The number of clusters formed during K-Means clustering', option4: 'The number of equally sized subsets the dataset is split into for validation' },
    category: 'ML', questionSeverity: 'medium',
  },
  {
    quesId: 'Q29',
    question: 'Which algorithm forms the foundation of the Random Forest model?',
    correctAns: 'option2',
    options: { option1: 'Logistic Regression', option2: 'Decision Tree', option3: 'Support Vector Machine', option4: 'K-Nearest Neighbours' },
    category: 'ML', questionSeverity: 'easy',
  },
  {
    quesId: 'Q30',
    question: 'What is the purpose of the softmax function in the output layer of a neural network?',
    correctAns: 'option3',
    options: { option1: 'To introduce non-linearity so the network can learn complex patterns', option2: 'To normalise activations within a batch to stabilise training', option3: 'To convert raw output scores into a probability distribution that sums to 1', option4: 'To clip large gradients and prevent exploding gradients' },
    category: 'Deep Learning', questionSeverity: 'medium',
  },
  {
    quesId: 'Q31',
    question: 'What is "word embedding" in NLP?',
    correctAns: 'option1',
    options: { option1: 'A dense vector representation of words that captures semantic similarity in continuous space', option2: 'A lookup table that maps every word to a unique integer index', option3: 'A technique that splits words into subword tokens for vocabulary efficiency', option4: 'A frequency-based weighting scheme that downscales common words' },
    category: 'NLP', questionSeverity: 'medium',
  },
  {
    quesId: 'Q32',
    question: 'Which metric is most appropriate for evaluating a model on a highly imbalanced dataset?',
    correctAns: 'option4',
    options: { option1: 'Accuracy', option2: 'Mean Squared Error', option3: 'R-squared', option4: 'F1-score (harmonic mean of precision and recall)' },
    category: 'AI', questionSeverity: 'medium',
  },
  {
    quesId: 'Q33',
    question: 'What is the role of an encoder in a sequence-to-sequence model?',
    correctAns: 'option2',
    options: { option1: 'To generate the output sequence token by token using attention', option2: 'To compress the input sequence into a context vector capturing its meaning', option3: 'To rank candidate output sequences by probability', option4: 'To tokenise and embed the input text before training' },
    category: 'NLP', questionSeverity: 'hard',
  },
  {
    quesId: 'Q34',
    question: 'What does the term "hyperparameter" refer to in machine learning?',
    correctAns: 'option3',
    options: { option1: 'A weight learned by the model during training on data', option2: 'A feature derived from the raw input through feature engineering', option3: 'A configuration value set before training that controls the learning process (e.g. learning rate, depth)', option4: 'A statistical parameter computed from the training set distribution' },
    category: 'ML', questionSeverity: 'easy',
  },
  {
    quesId: 'Q35',
    question: 'What is Retrieval-Augmented Generation (RAG)?',
    correctAns: 'option1',
    options: { option1: 'A technique that enhances LLM responses by retrieving relevant documents from a knowledge base before generating an answer', option2: 'A training method where the model is fine-tuned on retrieval tasks', option3: 'A data augmentation strategy for low-resource NLP tasks', option4: 'An evaluation framework that scores generated text against retrieved references' },
    category: 'AI', questionSeverity: 'hard',
  },
  {
    quesId: 'Q36',
    question: 'What is the primary purpose of batch normalisation in a neural network?',
    correctAns: 'option2',
    options: { option1: 'To reduce the number of parameters and speed up inference', option2: 'To normalise layer inputs across a mini-batch, stabilising and accelerating training', option3: 'To randomly zero out activations to prevent co-adaptation of neurons', option4: 'To scale the learning rate adaptively based on gradient history' },
    category: 'Deep Learning', questionSeverity: 'medium',
  },
  {
    quesId: 'Q37',
    question: 'Which of the following describes "prompt engineering" for large language models?',
    correctAns: 'option4',
    options: { option1: 'Retraining an LLM from scratch on domain-specific data', option2: 'Adjusting the model\'s weights using a small labelled dataset', option3: 'Compressing an LLM into a smaller model via knowledge distillation', option4: 'Crafting and structuring input prompts to guide an LLM towards desired outputs without changing its weights' },
    category: 'AI', questionSeverity: 'medium',
  },
  {
    quesId: 'Q38',
    question: 'What is the difference between parametric and non-parametric models?',
    correctAns: 'option3',
    options: { option1: 'Parametric models require more data; non-parametric models require less', option2: 'Parametric models are always deep neural networks; non-parametric models are shallow', option3: 'Parametric models have a fixed number of parameters determined before training; non-parametric models grow in complexity with data', option4: 'Parametric models support classification only; non-parametric models support regression only' },
    category: 'ML', questionSeverity: 'hard',
  },
  {
    quesId: 'Q39',
    question: 'What is "fine-tuning" in the context of pre-trained language models?',
    correctAns: 'option2',
    options: { option1: 'Training a model from random weights on a large general corpus', option2: 'Further training a pre-trained model on a smaller task-specific dataset to adapt it for that task', option3: 'Freezing all layers and only training a new classification head', option4: 'Reducing model size by removing low-magnitude weights' },
    category: 'NLP', questionSeverity: 'medium',
  },
  {
    quesId: 'Q40',
    question: 'In reinforcement learning, what is the "exploration vs exploitation" trade-off?',
    correctAns: 'option1',
    options: { option1: 'Balancing trying new actions to discover higher rewards (exploration) against using known good actions (exploitation)', option2: 'Deciding between on-policy and off-policy learning algorithms', option3: 'Choosing between model-based and model-free reinforcement learning', option4: 'Adjusting the discount factor to balance immediate and future rewards' },
    category: 'AI', questionSeverity: 'hard',
  },
];

const POST_ASSESSMENT_SET_ID = 'QS-AI-POST';
const POST_ASSESSMENT_ID     = 'A2';
const POST_ASSESSMENT_TIMER  = 2700; // 45 minutes in seconds

async function seedPreAssessment() {
  const allIds = ALL_QUESTIONS.map((q) => q.quesId);

  // 1. Upsert all 20 questions
  for (const q of ALL_QUESTIONS) {
    await Question.findOrCreate({ where: { quesId: q.quesId }, defaults: q });
  }

  // 2. Ensure the QuestionSet exists BEFORE the assessment row references it.
  //    The Assessment.setId column has a FK to questionsets.setId; on a fresh
  //    DB the parent row must be in place first or the insert blows up.
  await QuestionSet.findOrCreate({
    where: { setId: PRE_ASSESSMENT_SET_ID },
    defaults: {
      setId: PRE_ASSESSMENT_SET_ID,
      setName: 'AI Pre-Assessment Set',
      category: 'AI',
      questions: allIds,
    },
  });

  // 3. Find Assessment A1 (create it if it doesn't exist yet)
  const [assessment, aCreated] = await Assessment.findOrCreate({
    where: { assessmentId: PRE_ASSESSMENT_ID },
    defaults: {
      assessmentId: PRE_ASSESSMENT_ID,
      type: 'pre',
      setId: PRE_ASSESSMENT_SET_ID,
      timer: PRE_ASSESSMENT_TIMER,
      score: 100,
      status: 'available',
    },
  });

  // Fix timer or score if wrong
  const preUpdates = {};
  if (assessment.timer !== PRE_ASSESSMENT_TIMER) preUpdates.timer = PRE_ASSESSMENT_TIMER;
  if (assessment.score !== 100) preUpdates.score = 100;
  if (Object.keys(preUpdates).length) {
    await assessment.update(preUpdates);
    console.log(`  ✅ Assessment A1 updated:`, preUpdates);
  }

  // 3. Update the QuestionSet that A1 actually uses (may differ from PRE_ASSESSMENT_SET_ID
  //    if A1 was created manually before this seed ran)
  const actualSetId = assessment.setId;
  let qs = await QuestionSet.findByPk(actualSetId);

  if (!qs) {
    // QuestionSet referenced by A1 doesn't exist — create it with all 20 questions
    qs = await QuestionSet.create({
      setId: actualSetId,
      setName: 'AI Pre-Assessment Set',
      category: 'AI',
      questions: allIds,
    });
    console.log(`  ✅ QuestionSet "${actualSetId}" created with ${allIds.length} questions`);
  } else {
    // Replace the questions array with exactly the 20 canonical IDs
    await qs.update({ questions: allIds });
    console.log(`  ✅ QuestionSet "${actualSetId}" set to exactly ${allIds.length} questions`);
  }

  if (aCreated) {
    console.log(`  ✅ Assessment A1 created (setId: ${actualSetId}, timer: ${PRE_ASSESSMENT_TIMER} s)`);
  }
}
async function seedPostAssessment() {
  const allIds = POST_QUESTIONS.map((q) => q.quesId);

  // 1. Upsert all 20 post-assessment questions
  for (const q of POST_QUESTIONS) {
    await Question.findOrCreate({ where: { quesId: q.quesId }, defaults: q });
  }

  // 2. Ensure the QuestionSet exists BEFORE the assessment row references it
  //    (FK constraint on assessments.setId).
  await QuestionSet.findOrCreate({
    where: { setId: POST_ASSESSMENT_SET_ID },
    defaults: {
      setId: POST_ASSESSMENT_SET_ID,
      setName: 'AI Post-Assessment Set',
      category: 'AI',
      questions: allIds,
    },
  });

  // 3. Find Assessment A2 (create if it doesn't exist)
  const [assessment, aCreated] = await Assessment.findOrCreate({
    where: { assessmentId: POST_ASSESSMENT_ID },
    defaults: {
      assessmentId: POST_ASSESSMENT_ID,
      type: 'post',
      setId: POST_ASSESSMENT_SET_ID,
      timer: POST_ASSESSMENT_TIMER,
      score: 100,
      status: 'available',
    },
  });

  // Fix timer or score if wrong
  const postUpdates = {};
  if (assessment.timer !== POST_ASSESSMENT_TIMER) postUpdates.timer = POST_ASSESSMENT_TIMER;
  if (assessment.score !== 100) postUpdates.score = 100;
  if (Object.keys(postUpdates).length) {
    await assessment.update(postUpdates);
    console.log(`  ✅ Assessment A2 updated:`, postUpdates);
  }

  // 3. Update the QuestionSet that A2 actually uses
  const actualSetId = assessment.setId;
  let qs = await QuestionSet.findByPk(actualSetId);

  if (!qs) {
    await QuestionSet.create({
      setId: actualSetId,
      setName: 'AI Post-Assessment Set',
      category: 'AI',
      questions: allIds,
    });
    console.log(`  ✅ QuestionSet "${actualSetId}" created with ${allIds.length} questions`);
  } else {
    await qs.update({ questions: allIds });
    console.log(`  ✅ QuestionSet "${actualSetId}" set to exactly ${allIds.length} questions`);
  }

  if (aCreated) {
    console.log(`  ✅ Assessment A2 created (setId: ${actualSetId}, timer: ${POST_ASSESSMENT_TIMER} s)`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();

  // pre_assessment_registrations migrations:
  //   • selectedProgramId — new INT column linking the chosen program to
  //     admin-service programs.id. Nullable so legacy rows stay valid.
  //   • selectedProgram   — was an ENUM of 3 hardcoded titles; widen to
  //     VARCHAR so admin-created program titles fit.
  // Both run idempotently on every startup — same pattern admin-service uses
  // for its on-the-fly column adds.
  try {
    const { QueryTypes } = await import('sequelize');
    const cols = await sequelize.query('DESCRIBE pre_assessment_registrations', {
      type: QueryTypes.SELECT,
    });
    const hasProgramId = cols.some((c) => c.Field === 'selectedProgramId');
    if (!hasProgramId) {
      await sequelize.query(
        'ALTER TABLE pre_assessment_registrations ADD COLUMN selectedProgramId INT NULL'
      );
      console.log('🛠️  Added pre_assessment_registrations.selectedProgramId column');
    }
    const programCol = cols.find((c) => c.Field === 'selectedProgram');
    if (programCol && /^enum/i.test(programCol.Type)) {
      await sequelize.query(
        'ALTER TABLE pre_assessment_registrations MODIFY COLUMN selectedProgram VARCHAR(255) NOT NULL'
      );
      console.log('🛠️  Widened pre_assessment_registrations.selectedProgram ENUM → VARCHAR(255)');
    }
  } catch (e) {
    console.warn('[pre_assessment_registrations] column migration skipped:', e.message);
  }

  // assessments.shuffleQuestions — when true, questions are served in a
  // per-student deterministic random order. sequelize.sync() doesn't ADD
  // columns to existing tables, so add it on the fly the same way the
  // registrations table migrates.
  try {
    const { QueryTypes } = await import('sequelize');
    const cols = await sequelize.query('DESCRIBE assessments', { type: QueryTypes.SELECT });
    const hasShuffle = cols.some((c) => c.Field === 'shuffleQuestions');
    if (!hasShuffle) {
      await sequelize.query(
        'ALTER TABLE assessments ADD COLUMN shuffleQuestions TINYINT(1) NOT NULL DEFAULT 0'
      );
      console.log('🛠️  Added assessments.shuffleQuestions column');
    }
  } catch (e) {
    console.warn('[assessments] shuffleQuestions migration skipped:', e.message);
  }

  await seedPreAssessment();
  await seedPostAssessment();
  console.log('🗄️  Database connected and synced---');
}

export default app;