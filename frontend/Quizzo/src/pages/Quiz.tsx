import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Navbar from '@/components/navbar';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  text: string;
  type: 'multiple_choice' | 'fill_blank';
  options?: Option[];
  answer?: string;
}

export default function Quiz() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [questions, setQuestions] = useState<Question[]>([]);


  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        await axios.get(import.meta.env.VITE_BACKEND_URL+'/api/quizzes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    verifyAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!isAuthenticated) return;
  
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(import.meta.env.VITE_BACKEND_URL+ `/api/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { title, description, questions } = response.data;
        setFormData({ title, description });
        // console.log(response)
        // Ensure questions array only contains necessary fields
        const sanitizedQuestions = questions.map((q: any) => ({
          text: q.text,
          type: q.type,
          options: q.options?.map((opt: any) => ({
            text: opt.text,
            isCorrect: opt.is_correct,
          })),
          answer: q.answer,
        }));
        setQuestions(sanitizedQuestions);
      } catch (error) {
        console.error('Failed to fetch quiz:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          navigate('/');
        }
      }
    };
  
    if (isAuthenticated) {
      fetchQuiz();
    }
  }, [id, navigate, isAuthenticated]);


  return (
    <div>
        <Navbar/>
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">{formData.title}</CardTitle>
          
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <div className='w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm'>
                    <p>{formData.description}</p>
                  </div>
                </div>
              </div>
  
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Questions</h3>
                
                {questions.map((q, index) => (
                  <div key={index} className="mb-4 p-4 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{index + 1}. {q.text}</p>
                        {q.type === 'multiple_choice' && q.options?.map((opt, i) => (
                          <div key={i} className="ml-4 mt-2">
                            <span className={opt.isCorrect ? 'text-green-600' : ''}>
                              • {opt.text}
                            </span>
                          </div>
                        ))}
                        {q.type === 'fill_blank' && (
                          <div className="ml-4 mt-2">Answer: {q.answer}</div>
                        )}
                      </div>
                     
                    </div>
                  </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}