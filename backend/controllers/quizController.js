import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

// @desc    Create quiz
// @route   POST /api/quizzes
export const createQuiz = async (req, res) => {
  try {
    const { title, description, questions, moduleId, room, timeLimit } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      questions,
      module: moduleId,
      teacher: req.user._id,
      room: room || 'classroom',
      timeLimit
    });

    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ msg: 'Invalid quiz data' });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/quizzes/submit
export const submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }

    // Calculate score
    let score = 0;
    const answerResults = answers.map((selectedOption, index) => {
      const question = quiz.questions[index];
      const isCorrect = selectedOption === question.correctIndex;
      
      if (isCorrect) {
        score += question.points || 10;
      }

      return {
        questionIndex: index,
        selectedOption,
        isCorrect
      };
    });

    // Create quiz attempt
    const attempt = await QuizAttempt.create({
      quiz: quizId,
      student: studentId,
      answers: answerResults,
      score,
      totalQuestions: quiz.questions.length,
      completedAt: new Date()
    });

    // Update user XP (10 XP per correct answer)
    const xpGain = score; // 1 XP per point

    res.json({
      score,
      total: quiz.questions.length,
      xpGain,
      answers: answerResults
    });
  } catch (error) {
    res.status(400).json({ msg: 'Error submitting quiz' });
  }
};

// @desc    Get quiz attempts for student
// @route   GET /api/quizzes/attempts
export const getQuizAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id })
      .populate('quiz', 'title description')
      .sort({ completedAt: -1 });
    
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};