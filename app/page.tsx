"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';
import { LandingScreen } from '@/components/LandingScreen';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { SubjectSelector } from "@/components/SubjectSelector";
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface RawQuestion {
  api_url: string;
  bonus_answer: string;
  bonus_format: string;
  bonus_question: string;
  category: string;
  id: number;
  search_vector: string;
  source: string;
  tossup_answer: string;
  tossup_format: string;
  tossup_question: string;
  uri: string;
}

interface MappedQuestion {
  type: "toss-up" | "multiple";
  subject: string;
  question: string;
  answer: string;
  options?: {
    [key: string]: string;
  };
  bonus: {
    type: "toss-up";
    subject: string;
    question: string;
    answer: string;
  };
}

export default function Page() {
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [rawQuestions, setRawQuestions] = useState<RawQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<MappedQuestion | null>(null);
  const [status, setStatus] = useState("Loading questions...");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isBonusQuestion, setIsBonusQuestion] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const [lockoutPeriod, setLockoutPeriod] = useState(false);

  // Answer-specific states for visual feedback
  const [tossUpAnswer, setTossUpAnswer] = useState("");
  const [tossUpStatus, setTossUpStatus] = useState<"correct" | "incorrect" | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [mcqResult, setMcqResult] = useState<"correct" | "incorrect" | null>(null);

  // Filter selections (subjects and question set)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "physics",
    "biology",
    "chemistry",
    "general_science",
    "energy",
    "earth_science",
    "astronomy",
    "math",
    "computer_science"
  ]);
  const [selectedSet, setSelectedSet] = useState("all");
  const [includeBonusQuestions, setIncludeBonusQuestions] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [questionType, setQuestionType] = useState<"multiple" | "short" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  // Start loading data as soon as the component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Your existing data loading logic here
        await fetch("/questions.json")
          .then((res) => res.json())
          .then((data) => {
            setRawQuestions(data.questions);
            setStatus("Right click for configuration settings. Press Start to begin!");
          });
        
        // Add any other initialization logic here
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setStatus("Error loading questions.");
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Only allow proceeding past the landing screen if data is loaded
  const handleComplete = () => {
    if (!isLoading) {
      setShowContent(true);
    }
  };

  // Mapping function: Convert a raw JSON question into our expected format
  function mapQuestion(raw: RawQuestion): MappedQuestion {
    if (raw.tossup_format.toLowerCase().includes("multiple")) {
      const parts = raw.tossup_question.split("\n");
      const prompt = parts[0];
      let options: { [key: string]: string } = {};
      for (let i = 1; i < parts.length; i++) {
        const match = parts[i].match(/^([A-Z])\)\s*(.*)/);
        if (match) {
          options[match[1]] = match[2];
        }
      }
      const answerLetter = raw.tossup_answer.trim()[0];
      return {
        type: "multiple",
        subject: raw.category,
        question: prompt,
        answer: answerLetter,
        options,
        bonus: {
          type: "toss-up",
          subject: raw.category,
          question: raw.bonus_question,
          answer: raw.bonus_answer,
        },
      };
    } else {
      return {
        type: "toss-up",
        subject: raw.category,
        question: raw.tossup_question,
        answer: raw.tossup_answer,
        bonus: {
          type: "toss-up",
          subject: raw.category,
          question: raw.bonus_question,
          answer: raw.bonus_answer,
        },
      };
    }
  }

  // Start a new round
  function startGame() {
    setIsTransitioning(true);
    setGameStarted(true);
    stopSpeech();
    resetUI();
    
    if (isBonusQuestion && currentQuestion && currentQuestion.bonus) {
      // Create a proper MappedQuestion object from the bonus
      const bonusQuestion: MappedQuestion = {
        type: "toss-up",
        subject: currentQuestion.bonus.subject,
        question: currentQuestion.bonus.question,
        answer: currentQuestion.bonus.answer,
        bonus: {
          type: "toss-up",
          subject: currentQuestion.bonus.subject,
          question: currentQuestion.bonus.question,
          answer: currentQuestion.bonus.answer
        }
      };
      setCurrentQuestion(bonusQuestion);
      presentQuestion(bonusQuestion);
    } else {
      if (rawQuestions.length === 0) {
        setStatus("No questions loaded.");
        return;
      }
      
      // Filter questions based on selected subjects
      let filtered = rawQuestions.filter((q) => {
        const category = q.category.toLowerCase().replace(/\s+/g, '_');
        return selectedSubjects.includes(category);
      });

      if (filtered.length === 0) {
        setStatus("No questions available for selected subjects.");
        return;
      }

      const randomRaw = filtered[Math.floor(Math.random() * filtered.length)];
      const mapped = mapQuestion(randomRaw);
      setCurrentQuestion(mapped);
      
      // Immediately determine and set the question type
      const newType = mapped.type === "multiple" ? "multiple" : "short";
      setQuestionType(newType);
      
      setIsBonusQuestion(false);
      setCountdown(5);
      presentQuestion(mapped);
    }
    
    // Clear transition state after a brief delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }

  // Uses speech synthesis to read the question then starts the timer
  function presentQuestion(question: MappedQuestion) {
    setStatus("Listen carefully...");
    const prefix = isBonusQuestion ? "Bonus, " : "";
    let utteranceText = "";
    if (question.type === "multiple") {
      utteranceText = `${prefix}Multiple choice, ${question.subject}, ${question.question}. `;
      if (question.options) {
        utteranceText += `W (${question.options.W}), X (${question.options.X}), Y (${question.options.Y}), Z (${question.options.Z}).`;
      }
    } else {
      utteranceText = `${prefix}Short answer, ${question.subject}, ${question.question}.`;
    }
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.onend = () => {
      setSpeechActive(false);
      startTimer();
    };
    setSpeechActive(true);
    window.speechSynthesis.speak(utterance);
  }

  // Reset UI and answer states
  function resetUI() {
    setTossUpAnswer("");
    setTossUpStatus(null);
    setSelectedOption(null);
    setMcqResult(null);
    setStatus("Listen carefully...");
    setCountdown(5);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Start timer function
  function startTimer() {
    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setOpponentScore(prev => prev + 1); // Opponent gets a point
          setStatus("Time's up! Opponent scores!");
          return 0;
        }
        return prev - 0.1; // Count down in tenths of a second
      });
    }, 100); // Update every 100ms for smooth animation
  }

  // Format timer display
  const formatTime = (time: number | null): string => {
    if (time === null) return "00:00";
    return time <= 0 ? "00" : `${time.toFixed(2).padStart(5, '0')}`;
  };

  function stopSpeech() {
    window.speechSynthesis.cancel();
    setSpeechActive(false);
  }

  // Handle the buzz-in action
  function buzzIn() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus("Buzzed in!");
    setLockoutPeriod(true);
    if (speechActive) {
      stopSpeech();
    }
    const utterance = new SpeechSynthesisUtterance("Bee one");
    window.speechSynthesis.speak(utterance);
    setTimeout(() => {
      setLockoutPeriod(false);
      setStatus("Select an answer!");
    }, 1000);
  }

  // Checks the toss‑up (short answer) response
  function submitTossUp() {
    if (!currentQuestion) return;
    if (tossUpAnswer.trim() === currentQuestion.answer.trim()) {
      setStatus("Correct!");
      setTossUpStatus("correct");
      setUserScore((score) => score + (isBonusQuestion ? 10 : 1));
      setIsBonusQuestion((prev) => !prev);
      const utterance = new SpeechSynthesisUtterance("Correct");
      window.speechSynthesis.speak(utterance);
    } else {
      setStatus(`Incorrect! The answer was ${currentQuestion.answer}.`);
      setTossUpStatus("incorrect");
      setOpponentScore((score) => score + 1);
      setIsBonusQuestion(false);
      const utterance = new SpeechSynthesisUtterance("Incorrect");
      window.speechSynthesis.speak(utterance);
    }
  }

  // Handles multiple choice button clicks
  function handleMultipleChoice(letter: string) {
    if (!currentQuestion || lockoutPeriod) return;
    setSelectedOption(letter);
    if (letter === currentQuestion.answer) {
      setStatus("Correct!");
      setMcqResult("correct");
      setUserScore((score) => score + (isBonusQuestion ? 10 : 1));
      setIsBonusQuestion((prev) => !prev);
      const utterance = new SpeechSynthesisUtterance("Correct");
      window.speechSynthesis.speak(utterance);
    } else {
      setStatus(`Incorrect! The correct answer was ${currentQuestion.answer}.`);
      setMcqResult("incorrect");
      setOpponentScore((score) => score + 1);
      setIsBonusQuestion(false);
      const utterance = new SpeechSynthesisUtterance("Incorrect");
      window.speechSynthesis.speak(utterance);
    }
  }

  // Lists for the UI selections
  const subjects = [
    "PHYSICS",
    "BIOLOGY",
    "CHEMISTRY",
    "GENERAL SCIENCE",
    "ENERGY",
    "EARTH SCIENCE",
    "ASTRONOMY",
    "MATH",
    "COMPUTER SCIENCE",
  ];

  // Helper: Compute Tailwind classes for MCQ buttons based on feedback
  function getMCQButtonClass(letter: string): string {
    let base = "w-20 h-20 rounded transition hover:bg-gray-600 bg-gray-700 text-white";
    if (selectedOption === letter) {
      if (mcqResult === "correct") {
        base += " bg-green-500";
      } else if (mcqResult === "incorrect") {
        base += " bg-red-500";
      }
    }
    return base;
  }

  // Handler for subject changes
  const handleSubjectsChange = (newSubjects: string[]) => {
    setSelectedSubjects(newSubjects);
  };

  return (
    <>
      <AnimatePresence>
        {!showContent && (
          <LandingScreen 
            onComplete={handleComplete} 
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: showContent ? 0 : '100%', opacity: showContent ? 1 : 0 }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
        className="fixed inset-0 bg-white dark:bg-black flex flex-col"
      >
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 h-20 bg-white dark:bg-black z-50 flex items-center justify-between px-6 border-b dark:border-gray-800">
          <a 
            href="https://github.com/drwoosy/Scibowl-Study" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-3xl sm:text-5xl font-semibold dark:text-white transition-all duration-300 hover:opacity-80"
          >
            scibuddy
          </a>
          
          <Button 
            variant="outline" 
            onClick={() => setIsLoginOpen(true)}
            className="transition-all duration-300 hover:bg-gray-700 hover:text-white active:bg-gray-800"
          >
            Log In
          </Button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pt-20">
          <ContextMenu>
            <ContextMenuTrigger className="min-h-full w-full">
              <div className="mx-auto p-4 text-center flex flex-col">
                {/* Timer Section */}
                <motion.div 
                  className="flex flex-col items-center"
                  animate={{ 
                    marginTop: gameStarted ? "2rem" : "4rem"
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.p 
                    className="text-7xl font-mono font-bold tracking-wider"
                    animate={{ scale: countdown && countdown <= 1 ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {formatTime(countdown)}
                  </motion.p>
                </motion.div>

                {/* Game Controls */}
                <div className="flex flex-col items-center gap-6 mt-6 w-full max-w-xs mx-auto">
                  {!gameStarted && <SubjectSelector onSubjectsChange={handleSubjectsChange} />}
                  
                  {/* Question Area */}
                  {gameStarted && !isTransitioning && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full max-w-2xl mx-auto"
                    >
                      {questionType === "multiple" ? (
                        <motion.div 
                          key="multiple"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="grid grid-cols-2 gap-4 mb-32"
                        >
                          {['W', 'X', 'Y', 'Z'].map((letter) => (
                            <button
                              key={letter}
                              onClick={() => handleMultipleChoice(letter)}
                              className={`${
                                selectedOption === letter 
                                  ? mcqResult === "correct"
                                    ? "bg-green-500"
                                    : mcqResult === "incorrect"
                                      ? "bg-red-500"
                                      : "bg-gray-700"
                                  : "bg-gray-700"
                              } w-full aspect-square rounded-lg text-4xl font-bold text-white 
                              transition-colors duration-150 hover:bg-gray-600 active:bg-gray-800
                              flex items-center justify-center`}
                            >
                              {letter}
                            </button>
                          ))}
                        </motion.div>
                      ) : questionType === "short" ? (
                        <motion.div 
                          key="short"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="max-w-md mx-auto w-full"
                        >
                          <input
                            type="text"
                            value={tossUpAnswer}
                            onChange={(e) => setTossUpAnswer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitTossUp()}
                            className="w-full p-2 rounded border dark:bg-gray-800 dark:text-white"
                            placeholder="Type your answer..."
                            autoFocus
                          />
                          <Button 
                            onClick={submitTossUp}
                            className="mt-2 w-full"
                          >
                            Submit
                          </Button>
                        </motion.div>
                      ) : null}
                    </motion.div>
                  )}

                  {/* Game Buttons */}
                  <motion.div 
                    className="w-full flex flex-col gap-4"
                    animate={{ 
                      marginTop: gameStarted ? (questionType === "multiple" ? "-8rem" : "2rem") : "0"
                    }}
                  >
                    <Button 
                      onClick={buzzIn}
                      className="w-full transition-all duration-300 hover:bg-gray-700 hover:text-white active:bg-gray-800"
                    >
                      Buzz In
                    </Button>
                    <Button 
                      onClick={startGame}
                      className="w-full transition-all duration-300 hover:scale-105 hover:bg-gray-700 hover:text-white active:bg-gray-800"
                    >
                      {gameStarted ? "Next Question" : "Start Game"}
                    </Button>
                  </motion.div>
                </div>

                {/* Stats section - lower portion */}
                <div className="flex flex-col items-center mt-auto mb-16 gap-4">
                  <div className="text-lg">
                    {status && <p>{status}</p>}
                  </div>
                  <div className="text-lg">
                    <p>Opponent Score: {opponentScore}</p>
                  </div>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64 bg-white dark:bg-gray-900 border-2">
              <ContextMenuRadioGroup value={selectedSet} onValueChange={setSelectedSet}>
                <ContextMenuLabel inset>Question Bank</ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuRadioItem value="all">All</ContextMenuRadioItem>
                <ContextMenuRadioItem value="official">Official</ContextMenuRadioItem>
                <ContextMenuRadioItem value="csub">CSUB</ContextMenuRadioItem>
                <ContextMenuRadioItem value="05nats">05Nats</ContextMenuRadioItem>
                <ContextMenuRadioItem value="98nats">98Nats</ContextMenuRadioItem>
                <ContextMenuRadioItem value="16exchange">16Exchange</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem 
                checked={includeBonusQuestions}
                onCheckedChange={setIncludeBonusQuestions}
              >
                Include Bonus Questions
              </ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => window.location.href = "mailto:zayan@mit.edu"}>
                Report a Bug
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>

        {/* Fixed bottom hover card */}
        <div className="fixed bottom-8 left-4 dark:text-white">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link" className="text-lg">@drwsy</Button>
            </HoverCardTrigger>
            <HoverCardContent 
              className="w-80 border-2 border-black/30 dark:border-white/30 rounded-lg !important"
              align="start"
              sideOffset={10}
              style={{ borderRadius: '0.5rem' }}
            >
              <div className="flex justify-between space-x-4">
                <Avatar className="rounded-none w-16 h-16 top-3">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/170767427?s=400&u=9ce63ad143bed5730a77f010c2dcf61a4c317082&v=4" />
                  <AvatarFallback>ZI</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold dark:text-white">@drwsy</h4>
                  <p className="text-sm dark:text-white">
                    scibowl study app – created and maintained by @zxyanislam.
                  </p>
                  <div className="flex items-center pt-2">
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70 dark:text-white" />{" "}
                    <span className="text-xs text-muted-foreground dark:text-white">
                      Updated February 2024
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </motion.div>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="fixed top-6 right-6 z-50 transition-all duration-300 hover:bg-gray-700 hover:text-white active:bg-gray-800"
          >
            Log In / Register
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 z-[100] rounded-xl overflow-hidden">
          <DialogTitle className="sr-only">Authentication</DialogTitle>
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle>{isLogin ? "Login" : "Create Account"}</CardTitle>
              <CardDescription>
                {isLogin ? "Enter your credentials to log in." : "Fill in your details to create an account."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <TabsTrigger 
                    value="login" 
                    className="transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>
                <AnimatePresence mode="wait">
                  {isLogin ? (
                    <motion.div
                      key="login"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <LoginForm />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <RegisterForm />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button 
            type="submit" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
          >
            Log in
          </Button>
        </>
      )}
    </form>
  )
}

function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" required />
          </div>
          <Button 
            type="submit" 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
          >
            Create Account
          </Button>
        </>
      )}
    </form>
  )
}