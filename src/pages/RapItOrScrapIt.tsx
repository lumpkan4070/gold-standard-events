import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, ArrowLeft, Zap, Users, Volume2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const RapItOrScrapIt = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-background to-pink-50 dark:from-purple-950/20 dark:via-background dark:to-pink-950/20">
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
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Rap It or Scrap It
            </span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Spit one bar with a random word and show off your freestyle skills!
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="luxury-card border-purple-200 dark:border-purple-800/30">
            <CardHeader className="text-center pb-8">
              <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="relative">
                  <Mic className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                    <Volume2 className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                Rap It or Scrap It Coming Soon
              </CardTitle>
              <CardDescription className="text-lg">
                Get ready to play!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="p-6 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-300">What to Expect:</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>🎤 Freestyle rap challenges with random words</li>
                  <li>⏱️ 30-second freestyle rounds</li>
                  <li>🎵 Beat-dropping background tracks</li>
                  <li>👥 Battle mode against friends</li>
                  <li>🏆 Vote on the best bars and earn points</li>
                </ul>
              </div>

              <div className="flex items-center justify-center space-x-2 text-pink-600 dark:text-pink-400">
                <Users className="w-5 h-5" />
                <span className="font-medium">Perfect for group battles!</span>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800/30">
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  💡 Pro Tip: Start warming up your freestyle skills - this game will test your creativity and quick thinking!
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

export default RapItOrScrapIt;