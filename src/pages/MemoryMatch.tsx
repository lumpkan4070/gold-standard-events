import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, ArrowLeft, Brain, Zap, Timer, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MemoryMatch = () => {
  const [user, setUser] = useState<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const navigate = useNavigate();

  const buttonColors = [
    { bg: "bg-red-500 hover:bg-red-600", active: "bg-red-300" },
    { bg: "bg-blue-500 hover:bg-blue-600", active: "bg-blue-300" },
    { bg: "bg-green-500 hover:bg-green-600", active: "bg-green-300" },
    { bg: "bg-yellow-500 hover:bg-yellow-600", active: "bg-yellow-300" },
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

  const generateSequence = (length: number): number[] => {
    return Array.from({ length }, () => Math.floor(Math.random() * 4));
  };

  const startGame = () => {
    const newSequence = generateSequence(3);
    setCurrentSequence(newSequence);
    setPlayerSequence([]);
    setGameStarted(true);
    setGameOver(false);
    setLevel(1);
    setScore(0);
    setFeedback("Watch the sequence!");
    playSequence(newSequence);
  };

  const playSequence = async (sequence: number[]) => {
    setShowSequence(true);
    setPlayerSequence([]);
    
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setActiveButton(sequence[i]);
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveButton(null);
    }
    
    setShowSequence(false);
    setFeedback("Now repeat the sequence!");
  };

  const handleButtonClick = (buttonIndex: number) => {
    if (showSequence || gameOver) return;

    const newPlayerSequence = [...playerSequence, buttonIndex];
    setPlayerSequence(newPlayerSequence);

    // Flash the button
    setActiveButton(buttonIndex);
    setTimeout(() => setActiveButton(null), 200);

    // Check if the current input matches the sequence so far
    if (buttonIndex !== currentSequence[newPlayerSequence.length - 1]) {
      setGameOver(true);
      setFeedback(`Game Over! You reached level ${level} with ${score} points`);
      return;
    }

    // If player completed the current sequence
    if (newPlayerSequence.length === currentSequence.length) {
      const newScore = score + (level * 10);
      setScore(newScore);
      setLevel(level + 1);
      setFeedback(`Level ${level} complete! Next level...`);
      
      setTimeout(() => {
        const nextLength = Math.min(3 + level, 8); // Cap at 8 items
        const newSequence = generateSequence(nextLength);
        setCurrentSequence(newSequence);
        setFeedback("Watch the new sequence!");
        playSequence(newSequence);
      }, 1500);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setCurrentSequence([]);
    setPlayerSequence([]);
    setShowSequence(false);
    setLevel(1);
    setScore(0);
    setFeedback("");
    setActiveButton(null);
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-500/10">
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
              Easy Difficulty
            </Badge>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">Memory Match</h1>
            <p className="text-muted-foreground">Test your memory with quick challenges</p>
          </div>

          {!gameStarted ? (
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-center text-foreground">
                  {gameOver ? 'Game Complete!' : 'Ready to Test Your Memory?'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {gameOver && (
                  <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                    <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground mb-1">Final Score</p>
                    <p className="text-4xl font-bold text-primary">{score}</p>
                    <p className="text-muted-foreground mt-2">Level {level} • Great memory!</p>
                  </div>
                )}
                
                <div className="p-4 bg-muted/50 rounded-lg text-left">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    How to Play:
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Watch the sequence of colored buttons</li>
                    <li>• Repeat the sequence by tapping the buttons</li>
                    <li>• Each level adds more buttons to remember</li>
                    <li>• Perfect for passing around your table!</li>
                  </ul>
                </div>
                
                <Button onClick={startGame} className="w-full luxury-button">
                  <Zap className="w-4 h-4 mr-2" />
                  {gameOver ? 'Play Again' : 'Start Memory Game'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Game Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="luxury-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{level}</div>
                    <div className="text-sm text-muted-foreground">Level</div>
                  </CardContent>
                </Card>
                <Card className="luxury-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{score}</div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </CardContent>
                </Card>
                <Card className="luxury-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{currentSequence.length}</div>
                    <div className="text-sm text-muted-foreground">Length</div>
                  </CardContent>
                </Card>
              </div>

              {/* Feedback */}
              {feedback && (
                <Card className="luxury-card">
                  <CardContent className="p-4 text-center">
                    <p className="text-foreground font-medium">{feedback}</p>
                  </CardContent>
                </Card>
              )}

              {/* Game Buttons */}
              <Card className="luxury-card">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {buttonColors.map((color, index) => (
                      <button
                        key={index}
                        className={`
                          h-24 w-full rounded-xl transition-all duration-200 transform
                          ${activeButton === index ? color.active : color.bg}
                          ${showSequence ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                          shadow-lg
                        `}
                        onClick={() => handleButtonClick(index)}
                        disabled={showSequence}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Indicator */}
              <Card className="luxury-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {playerSequence.length}/{currentSequence.length}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${currentSequence.length > 0 ? (playerSequence.length / currentSequence.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Game Controls */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetGame} className="flex-1">
                  New Game
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => playSequence(currentSequence)}
                  disabled={showSequence}
                  className="flex-1"
                >
                  <Timer className="w-4 h-4 mr-2" />
                  Replay Sequence
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryMatch;