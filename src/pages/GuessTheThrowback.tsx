import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, ArrowLeft, Zap, Calendar, Headphones } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const GuessTheThrowback = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-cyan-50 dark:from-blue-950/20 dark:via-background dark:to-cyan-950/20">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/games">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </Link>
        </div>

        {/* Game Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Guess the Throwback
            </span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Test your music knowledge with classic tracks from the past!
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="luxury-card border-blue-200 dark:border-blue-800/30">
            <CardHeader className="text-center pb-8">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="relative">
                  <Music className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                    <Headphones className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                Guess the Throwback Coming Soon
              </CardTitle>
              <CardDescription className="text-lg">
                Get ready to play!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                <h3 className="text-xl font-semibold mb-3 text-blue-700 dark:text-blue-300">What to Expect:</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>🎵 Classic tracks from the 70s, 80s, 90s, and 2000s</li>
                  <li>🎤 Guess the artist AND the year</li>
                  <li>⏰ Multiple difficulty levels and time limits</li>
                  <li>🏆 Score points for correct guesses</li>
                  <li>📊 Track your music knowledge stats</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Multi-Decade</p>
                  <p className="text-xs text-muted-foreground">50+ years of hits</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg">
                  <Zap className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Quick Play</p>
                  <p className="text-xs text-muted-foreground">Fast-paced rounds</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  🎧 Perfect for music lovers and trivia fans - challenge your friends to see who knows their throwbacks best!
                </p>
              </div>

              <Link to="/games">
                <Button className="luxury-button w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Games Hub
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GuessTheThrowback;