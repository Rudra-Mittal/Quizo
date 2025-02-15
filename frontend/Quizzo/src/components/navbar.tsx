import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Button } from "./ui/button";
import { LogOut, Plus, User } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setUsername(decodedToken.username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-black text-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-white hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            >
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="min-w-[200px] bg-white text-black border border-black rounded-lg shadow-lg mt-2 p-1 animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            sideOffset={5}
            align="start"
          >
            <DropdownMenuItem className="flex items-center px-3 py-2 text-sm cursor-pointer rounded-md outline-none focus:bg-black focus:text-white hover:bg-black hover:text-white transition-colors duration-200">
              <User className="mr-2 h-4 w-4" />
              <span>{username}</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm cursor-pointer rounded-md outline-none focus:bg-black focus:text-white hover:bg-black hover:text-white transition-colors duration-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate("/create-quiz")}
              className="flex items-center px-3 py-2 text-sm cursor-pointer rounded-md outline-none focus:bg-black focus:text-white hover:bg-black hover:text-white transition-colors duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create Quiz</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <motion.h1
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Quizo
        </motion.h1>
      </div>
    </nav>
  );
}