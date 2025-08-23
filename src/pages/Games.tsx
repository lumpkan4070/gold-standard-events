import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Mic, Music, Trophy, Gamepad2, Zap, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Games = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-20">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Sign In Required</CardTitle>
              <CardDescription className="text-center">
                You need to be signed in to access the Games Hub
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="luxury-button">
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const gameCards = [
    {
      id: 'trivia-blast',
      title: 'Trivia Blast',
      description: 'Quick trivia questions for your table.',
      icon: Clock,
      gradient: 'from-red-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
      iconColor: 'text-red-600 dark:text-red-400',
      difficulty: 'Medium',
      players: '1-8 Players'
    },
    {
      id: 'word-chain',
      title: 'Word Chain',
      description: 'Connect words around your table.',
      icon: Mic,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      difficulty: 'Hard',
      players: '2+ Players'
    },
    {
      id: 'memory-match',
      title: 'Memory Match',
      description: 'Test your memory with quick challenges.',
      icon: Music,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      difficulty: 'Easy',
      players: '1+ Players'
    }
  ];

  const handleGameClick = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Games Hub
            </span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
            Competitive mini-games that bring the energy! Challenge your friends and climb the leaderboards.
          </p>
        </div>

        {/* Victory Points Section */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="luxury-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Victory Points</p>
                  <p className="text-3xl font-bold text-primary">0</p>
                </div>
                <div className="relative">
                  <Trophy className="w-10 h-10 text-primary" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Zap className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Games Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gameCards.map((game, index) => (
              <Card 
                key={game.id}
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 border-2 border-transparent hover:border-primary/20 luxury-card"
                onClick={() => handleGameClick(game.id)}
              >
                <div className={`p-6 rounded-t-lg ${game.bgColor} relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-white/80 dark:bg-black/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <game.icon className={`w-6 h-6 ${game.iconColor}`} />
                      </div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {game.difficulty}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                  </div>
                </div>
                
                <CardContent className="p-6 pt-4">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {game.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Target className="w-4 h-4 mr-1" />
                      {game.players}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full luxury-button group-hover:shadow-lg transition-shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGameClick(game.id);
                    }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Play Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-16 text-center">
          <div className="max-w-md mx-auto p-8 rounded-2xl bg-gradient-to-br from-muted/20 to-primary/5 border border-primary/10">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mb-2">More Games Coming Soon!</h3>
            <p className="text-muted-foreground text-sm">
              We're working on even more exciting mini-games. Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;