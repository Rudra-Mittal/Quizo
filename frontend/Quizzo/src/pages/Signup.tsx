import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(import.meta.env.VITE_BACKEND_URL+'/api/auth/signup', formData);
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 
          (error.response?.status === 409 ? 'Username already exists' : 'Signup failed. Please try again.');
        setError(errorMessage);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign up for Quizzo</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4"
              >
                <Alert variant="destructive" className="border-red-500 text-red-500 bg-red-50">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setError(null);
                }}
                required
                className={error ? "border-red-500 focus:ring-red-500" : ""}
                disabled={isLoading}
                placeholder="Enter your username"
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError(null);
                }}
                required
                className={error ? "border-red-500 focus:ring-red-500" : ""}
                disabled={isLoading}
                placeholder="Enter your password"
                minLength={6}
              />
              <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              variant={error ? "destructive" : "default"}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                'Sign Up'
              )}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline"
                disabled={isLoading}
              >
                Log in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}