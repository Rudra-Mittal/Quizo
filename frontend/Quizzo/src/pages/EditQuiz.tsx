import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Navbar from '@/components/navbar';
import { Loader2 } from 'lucide-react';

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

export default function EditQuiz() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    type: 'multiple_choice',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

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
        const response = await axios.get(import.meta.env.VITE_BACKEND_URL+`/api/quizzes/${id}`, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        import.meta.env.VITE_BACKEND_URL+`/api/quizzes/${id}`,
        { ...formData, questions },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to update quiz:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(import.meta.env.VITE_BACKEND_URL+`/api/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const addQuestion = () => {
    if (currentQuestion.text.trim() === '') return;
    
    if (currentQuestion.type === 'multiple_choice') {
      const hasCorrectAnswer = currentQuestion.options?.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) return;
    }

    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({
      text: '',
      type: 'multiple_choice',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = () => {
    if (!currentQuestion.options || currentQuestion.options.length >= 4) return;
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: '', isCorrect: false }],
    });
  };

  const updateOption = (index: number, text: string, isCorrect: boolean) => {
    if (!currentQuestion.options) return;
    const newOptions = [...currentQuestion.options];
    newOptions[index] = { text, isCorrect };
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Navbar/>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Edit Quiz</CardTitle>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Quiz
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea title='description'
                    className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
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
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeQuestion(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
  
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Question Type</label>
                    <select title='Question Type'
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm mt-1"
                      value={currentQuestion.type}
                      onChange={(e) => setCurrentQuestion({
                        text: '',
                        type: e.target.value as 'multiple_choice' | 'fill_blank',
                        ...(e.target.value === 'multiple_choice' 
                          ? { options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }
                          : { answer: '' }
                        ),
                      })}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="fill_blank">Fill in the Blank</option>
                    </select>
                  </div>
  
                  <div>
                    <label className="text-sm font-medium">Question Text</label>
                    <Input
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                      placeholder="Enter question text"
                    />
                  </div>
  
                {currentQuestion.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(index, e.target.value, option.isCorrect)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant={option.isCorrect ? "default" : "outline"}
                          onClick={() => updateOption(index, option.text, !option.isCorrect)}
                        >
                          Correct
                        </Button>
                      </div>
                    ))}
                    {currentQuestion.options && currentQuestion.options.length < 4 && (
                      <Button type="button" variant="outline" onClick={addOption}>
                        Add Option
                      </Button>
                    )}
                  </div>
                )}

                {currentQuestion.type === 'fill_blank' && (
                  <div>
                    <label className="text-sm font-medium">Correct Answer</label>
                    <Input
                      value={currentQuestion.answer || ''}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                      placeholder="Enter correct answer"
                    />
                  </div>
                )}

                <Button
                  type="button"
                  onClick={addQuestion}
                  className="mt-2"
                >
                  Add Question
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={questions.length === 0 || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Quiz'
                )}
              </Button>
            </div>          
            </form>
        </CardContent>
      </Card>
    </div>
  );
}