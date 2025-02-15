import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import PrivateRoute from '@/components/privateRoute';
import Quiz from './pages/Quiz';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path='/quiz/:id' element={<PrivateRoute><Quiz /></PrivateRoute>} />
        <Route path="/create-quiz" element={<PrivateRoute><CreateQuiz /></PrivateRoute>} />
        <Route path="/edit-quiz/:id" element={<PrivateRoute><EditQuiz /></PrivateRoute>} />
  
      </Routes>
    </Router>
  );
}

export default App;