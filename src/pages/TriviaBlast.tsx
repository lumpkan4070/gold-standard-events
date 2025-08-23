import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TriviaBlast = () => {
  const [user, setUser] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const navigate = useNavigate();

  const triviaQuestions = [
    {
      question: "What year was hip-hop born?",
      options: ["1970", "1973", "1975", "1977"],
      correct: "1973"
    },
    {
      question: "Which city is known as the birthplace of jazz?",
      options: ["Chicago", "New York", "New Orleans", "Detroit"],
      correct: "New Orleans"
    },
    {
      question: "What does 'DJ' stand for?",
      options: ["Disc Jockey", "Dance Judge", "Digital Jukebox", "Dance Junction"],
      correct: "Disc Jockey"
    },
    {
      question: "Which rapper is known as 'The King of Pop'?",
      options: ["Jay-Z", "Drake", "Michael Jackson", "Kanye West"],
      correct: "Michael Jackson"
    },
    {
      question: "What's the most streamed song on Spotify?",
      options: ["Shape of You", "Blinding Lights", "Someone Like You", "Rockstar"],
      correct: "Blinding Lights"
    }
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && timeLeft > 0 && !showResult) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !showResult) {
      handleNextQuestion();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameStarted, showResult]);

  const startGame = () => {
    setGameStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(15);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer === triviaQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      handleNextQuestion();
    }, 2000);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < triviaQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
    } else {
      setGameStarted(false);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(15);
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-500/10">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/games')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </Button>
            <Badge variant="secondary" className="text-sm">
              Medium Difficulty
            </Badge>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">Trivia Blast</h1>
            <p className="text-muted-foreground">Quick trivia questions for your table</p>
          </div>

          {!gameStarted ? (
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-center text-foreground">
                  {currentQuestion === 0 ? 'Ready to Play?' : `Game Complete!`}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {currentQuestion > 0 && (
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                    <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground mb-1">Final Score</p>
                    <p className="text-4xl font-bold text-primary">{score}/{triviaQuestions.length}</p>
                    <p className="text-muted-foreground mt-2">
                      {score === triviaQuestions.length ? "Perfect!" : 
                       score >= triviaQuestions.length / 2 ? "Great job!" : "Keep practicing!"}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Button onClick={startGame} className="w-full luxury-button">
                    <Zap className="w-4 h-4 mr-2" />
                    {currentQuestion === 0 ? 'Start Game' : 'Play Again'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    5 questions • 15 seconds each • Pass device around table
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="luxury-card">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-foreground">
                    Question {currentQuestion + 1}/{triviaQuestions.length}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-foreground'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>
                <CardTitle className="text-xl text-foreground leading-relaxed">
                  {triviaQuestions[currentQuestion].question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {triviaQuestions[currentQuestion].options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === option ? 
                        (option === triviaQuestions[currentQuestion].correct ? "default" : "destructive") : 
                        "outline"
                      }
                      className={`p-4 text-left justify-start h-auto ${
                        showResult && option === triviaQuestions[currentQuestion].correct
                          ? "bg-green-500 text-white hover:bg-green-600" 
                          : showResult && selectedAnswer === option && option !== triviaQuestions[currentQuestion].correct
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : ""
                      }`}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult}
                    >
                      <span className="text-foreground">{String.fromCharCode(65 + index)}.</span>
                      <span className="ml-2 text-foreground">{option}</span>
                    </Button>
                  ))}
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Score: {score}/{currentQuestion + (showResult ? 1 : 0)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetGame}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    End Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriviaBlast;