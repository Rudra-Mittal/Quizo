import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import {Edit, Trash2 } from "lucide-react"
import Navbar from "@/components/navbar"
interface Quiz {
  id: string
  title: string
  description: string
  created_at: string
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])


  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(import.meta.env.VITE_BACKEND_URL+ "/api/quizzes", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setQuizzes(response.data)
      } catch (error) {
        console.error("Failed to fetch quizzes:", error)
      }
    }
    fetchQuizzes()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(import.meta.env.VITE_BACKEND_URL+`/api/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setQuizzes(quizzes.filter((quiz) => quiz.id !== id))
    } catch (error) {
      console.error("Failed to delete quiz:", error)
    }
  }

 

  return (
    <div className="min-h-screen bg-white">
      <Navbar/>

      <div className="container mx-auto py-8 px-4">
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-black">My Quizzes</h2>
          <Button
            onClick={() => navigate("/create-quiz")}
            className="bg-black text-white hover:bg-white hover:text-black border border-black font-semibold transition-all duration-300 px-6"
          >
            Create New Quiz
          </Button>
        </motion.div>
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {quizzes.map((quiz) => (
            <motion.div key={quiz.id} variants={cardVariants}>
              <Card className="border border-black hover:shadow-xl transition-all duration-300" onClick={() => navigate(`/quiz/${quiz.id}`)}>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-black line-clamp-2">{quiz.description}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Created: {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="border-black hover:bg-black hover:text-white"
                    onClick={(e) => { e.stopPropagation(); navigate(`/edit-quiz/${quiz.id}`); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="border-black bg-black text-white hover:bg-white hover:text-black" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}