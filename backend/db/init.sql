-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('multiple_choice', 'fill_blank')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create options table for multiple choice questions
CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false
);

-- Create fill_blank_answers table
CREATE TABLE IF NOT EXISTS fill_blank_answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_id ON quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_fill_blank_answers_question_id ON fill_blank_answers(question_id);

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at columns and triggers
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
CREATE  TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
CREATE TRIGGER update_quizzes_timestamp
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
CREATE TRIGGER update_questions_timestamp
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Create view for quiz statistics
CREATE OR REPLACE VIEW quiz_statistics AS
SELECT 
    q.id AS quiz_id,
    q.title,
    q.teacher_id,
    COUNT(DISTINCT que.id) AS total_questions,
    SUM(CASE WHEN que.type = 'multiple_choice' THEN 1 ELSE 0 END) AS multiple_choice_questions,
    SUM(CASE WHEN que.type = 'fill_blank' THEN 1 ELSE 0 END) AS fill_blank_questions
FROM quizzes q
LEFT JOIN questions que ON q.id = que.quiz_id
GROUP BY q.id, q.title, q.teacher_id;

-- Create function to get quiz details with questions and answers
CREATE OR REPLACE FUNCTION get_quiz_details(p_quiz_id INTEGER)
RETURNS TABLE (
    quiz_id INTEGER,
    quiz_title VARCHAR(255),
    quiz_description TEXT,
    question_id INTEGER,
    question_text TEXT,
    question_type VARCHAR(20),
    options JSON,
    fill_blank_answer TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id AS quiz_id,
        q.title AS quiz_title,
        q.description AS quiz_description,
        que.id AS question_id,
        que.text AS question_text,
        que.type AS question_type,
        CASE 
            WHEN que.type = 'multiple_choice' THEN
                (SELECT json_agg(json_build_object(
                    'id', o.id,
                    'text', o.text,
                    'is_correct', o.is_correct
                ))
                FROM options o
                WHERE o.question_id = que.id)
            ELSE NULL
        END AS options,
        CASE 
            WHEN que.type = 'fill_blank' THEN
                (SELECT answer
                FROM fill_blank_answers
                WHERE question_id = que.id
                LIMIT 1)
            ELSE NULL
        END AS fill_blank_answer
    FROM quizzes q
    LEFT JOIN questions que ON q.id = que.quiz_id
    WHERE q.id = p_quiz_id
    ORDER BY que.id;
END;
$$ LANGUAGE plpgsql;

-- Add some helpful comments
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE quizzes IS 'Stores quiz information created by teachers';
COMMENT ON TABLE questions IS 'Stores questions for each quiz';
COMMENT ON TABLE options IS 'Stores multiple choice options for questions';
COMMENT ON TABLE fill_blank_answers IS 'Stores answers for fill in the blank questions';
COMMENT ON VIEW quiz_statistics IS 'Provides statistics about quizzes including question counts';
COMMENT ON FUNCTION get_quiz_details IS 'Returns detailed information about a quiz including all questions and answers';