import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, ArrowLeft, Users, Zap, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WordChain = () => {
  const [user, setUser] = useState<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentWord, setCurrentWord] = useState("");
  const [wordChain, setWordChain] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameMode, setGameMode] = useState<'setup' | 'playing'>('setup');
  const [lastValidWord, setLastValidWord] = useState("");
  const [feedback, setFeedback] = useState("");
  const [round, setRound] = useState(1);
  const navigate = useNavigate();

  const startingWords = ["MUSIC", "PARTY", "DANCE", "SOUND", "BEAT", "RHYTHM", "VIBES", "ENERGY"];

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

  const startGame = () => {
    const randomWord = startingWords[Math.floor(Math.random() * startingWords.length)];
    setCurrentWord(randomWord);
    setWordChain([randomWord]);
    setGameStarted(true);
    setGameMode('playing');
    setCurrentPlayer(1);
    setInputValue("");
    setLastValidWord(randomWord);
    setFeedback(`Starting word: ${randomWord}`);
    setRound(1);
  };

  const validateWord = (word: string): boolean => {
    if (word.length < 2) return false;
    if (wordChain.includes(word.toUpperCase())) return false;
    if (lastValidWord && word.charAt(0).toUpperCase() !== lastValidWord.slice(-1).toUpperCase()) return false;
    return true;
  };

  const submitWord = () => {
    const word = inputValue.trim().toUpperCase();
    
    if (!word) return;
    
    if (validateWord(word)) {
      setWordChain([...wordChain, word]);
      setLastValidWord(word);
      setCurrentWord(word);
      setFeedback(`✓ Good! "${word}" added to chain`);
      
      // Move to next player
      const nextPlayer = currentPlayer >= playerCount ? 1 : currentPlayer + 1;
      setCurrentPlayer(nextPlayer);
      
      if (nextPlayer === 1) {
        setRound(round + 1);
      }
    } else {
      if (wordChain.includes(word)) {
        setFeedback(`✗ "${word}" already used!`);
      } else if (lastValidWord && word.charAt(0) !== lastValidWord.slice(-1)) {
        setFeedback(`✗ "${word}" must start with "${lastValidWord.slice(-1)}"`);
      } else {
        setFeedback(`✗ "${word}" is not valid`);
      }
    }
    
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitWord();
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameMode('setup');
    setWordChain([]);
    setCurrentWord("");
    setInputValue("");
    setCurrentPlayer(1);
    setLastValidWord("");
    setFeedback("");
    setRound(1);
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/10">
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
              Hard Difficulty
            </Badge>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">Word Chain</h1>
            <p className="text-muted-foreground">Connect words around your table</p>
          </div>

          {gameMode === 'setup' && (
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-center text-foreground">Game Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Number of Players
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6, 8].map((num) => (
                      <Button
                        key={num}
                        variant={playerCount === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayerCount(num)}
                        className="flex-1"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">How to Play:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Each player creates a word that starts with the last letter of the previous word</li>
                    <li>• Pass the device around the table</li>
                    <li>• No repeating words that were already used</li>
                    <li>• Keep the chain going as long as possible!</li>
                  </ul>
                </div>
                
                <Button onClick={startGame} className="w-full luxury-button">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Word Chain
                </Button>
              </CardContent>
            </Card>
          )}

          {gameMode === 'playing' && (
            <div className="space-y-6">
              {/* Current Status */}
              <Card className="luxury-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Player {currentPlayer}'s Turn</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Round {round}</div>
                  </div>
                  
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Current word ends with:</p>
                    <div className="text-6xl font-bold text-primary mb-2">
                      {lastValidWord ? lastValidWord.slice(-1) : "?"}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your word must start with this letter
                    </p>
                  </div>

                  {feedback && (
                    <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${
                      feedback.startsWith('✓') 
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                        : feedback.startsWith('✗')
                        ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    }`}>
                      {feedback.startsWith('✓') ? <Check className="w-4 h-4" /> : 
                       feedback.startsWith('✗') ? <X className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span className="text-sm">{feedback}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      placeholder={`Enter word starting with "${lastValidWord ? lastValidWord.slice(-1) : '?'}"`}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="text-center text-lg font-bold"
                      autoFocus
                    />
                    <Button onClick={submitWord} className="px-6">
                      Submit
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Word Chain History */}
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Word Chain ({wordChain.length} words)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {wordChain.map((word, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {word}
                      </Badge>
                    ))}
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
                  onClick={() => {
                    setCurrentPlayer(currentPlayer >= playerCount ? 1 : currentPlayer + 1);
                    setFeedback("Turn skipped");
                  }}
                  className="flex-1"
                >
                  Skip Turn
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordChain;