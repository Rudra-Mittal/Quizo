import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL||"", 'http://localhost:5173'],
  methods:['GET','POST'],
}));
app.use(express.json());
app.get("/", (req, res) => {
  console.log("request received");
  res.send("Hello World!");
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});