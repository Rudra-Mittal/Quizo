import express from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['multiple_choice', 'fill_blank']),
  options: z.array(optionSchema).max(4).optional(),
  answer: z.string().optional(),
});

const quizSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  questions: z.array(questionSchema),
});
// @ts-ignore
router.use(authMiddleware);

// Create quiz with questions
router.post('/', async (req: AuthRequest, res) => {
  try {
    // console.log('req.user?.id', req.body.questions[0]);
    const { title, description, questions } = quizSchema.parse(req.body);

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create quiz
      const quizResult = await client.query(
        'INSERT INTO quizzes (title, description, teacher_id) VALUES ($1, $2, $3) RETURNING id',
        [title, description, req.user?.id]
      );
      const quizId = quizResult.rows[0].id;

      // Add questions
      for (const question of questions) {
        const questionResult = await client.query(
          'INSERT INTO questions (quiz_id, text, type) VALUES ($1, $2, $3) RETURNING id',
          [quizId, question.text, question.type]
        );
        const questionId = questionResult.rows[0].id;

        if (question.type === 'multiple_choice' && question.options) {
          for (const option of question.options) {
            await client.query(
              'INSERT INTO options (question_id, text, is_correct) VALUES ($1, $2, $3)',
              [questionId, option.text, option.isCorrect]
            );
          }
        } else if (question.type === 'fill_blank' && question.answer) {
          await client.query(
            'INSERT INTO fill_blank_answers (question_id, answer) VALUES ($1, $2)',
            [questionId, question.answer]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Quiz created successfully', quizId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    // console.error('Error creating quiz:', error);
    res.status(400).json({ message: 'Invalid request' });
  }
});

// Get all quizzes for logged-in teacher
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quizzes WHERE teacher_id = $1 ORDER BY created_at DESC',
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific quiz with questions and options
router.get('/:id', async (req: any, res:any) => {
  try {
    const quizResult = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND teacher_id = $2',
      [req.params.id, req.user?.id]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const quiz = quizResult.rows[0];

    // Get questions
    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY id',
      [quiz.id]
    );
    const questions = questionsResult.rows;

    // Get options and answers for each question
    for (const question of questions) {
      if (question.type === 'multiple_choice') {
        const optionsResult = await pool.query(
          'SELECT * FROM options WHERE question_id = $1',
          [question.id]
        );
        question.options = optionsResult.rows;
      } else if (question.type === 'fill_blank') {
        const answerResult = await pool.query(
          'SELECT answer FROM fill_blank_answers WHERE question_id = $1',
          [question.id]
        );
        question.answer = answerResult.rows[0]?.answer;
      }
    }
    // console.log('questions', questions);
    quiz.questions = questions;
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update quiz
router.put('/:id', async (req: any, res:any) => {
  try {
    // console.log('req.user?.id', req.body.questions[0]);
    const { title, description, questions } = quizSchema.parse(req.body);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update quiz
      const quizResult = await client.query(
        'UPDATE quizzes SET title = $1, description = $2 WHERE id = $3 AND teacher_id = $4 RETURNING *',
        [title, description, req.params.id, req.user?.id]
      );

      if (quizResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Quiz not found' });
      }

      // Delete existing questions and their related data
      await client.query('DELETE FROM questions WHERE quiz_id = $1', [req.params.id]);

      // Add new questions
      for (const question of questions) {
        const questionResult = await client.query(
          'INSERT INTO questions (quiz_id, text, type) VALUES ($1, $2, $3) RETURNING id',
          [req.params.id, question.text, question.type]
        );
        const questionId = questionResult.rows[0].id;

        if (question.type === 'multiple_choice' && question.options) {
          for (const option of question.options) {
            await client.query(
              'INSERT INTO options (question_id, text, is_correct) VALUES ($1, $2, $3)',
              [questionId, option.text, option.isCorrect]
            );
          }
        } else if (question.type === 'fill_blank' && question.answer) {
          await client.query(
            'INSERT INTO fill_blank_answers (question_id, answer) VALUES ($1, $2)',
            [questionId, question.answer]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Quiz updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    // console.log(error);
    res.status(400).json({ message: 'Invalid request' });
  }
});

// Delete quiz
router.delete('/:id', async (req: any, res:any) => {
  try {
    const result = await pool.query(
      'DELETE FROM quizzes WHERE id = $1 AND teacher_id = $2 RETURNING *',
      [req.params.id, req.user?.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;