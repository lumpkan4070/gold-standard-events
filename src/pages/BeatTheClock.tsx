import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowLeft, Zap, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const BeatTheClock = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-orange-50 dark:from-red-950/20 dark:via-background dark:to-orange-950/20">
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
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              Beat the Clock
            </span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Quick-fire timed challenges to test your speed and reflexes!
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="luxury-card border-red-200 dark:border-red-800/30">
            <CardHeader className="text-center pb-8">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="relative">
                  <Clock className="w-12 h-12 text-red-600 dark:text-red-400 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
                Beat the Clock Coming Soon
              </CardTitle>
              <CardDescription className="text-lg">
                Get ready to play!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-xl">
                <h3 className="text-xl font-semibold mb-3 text-red-700 dark:text-red-300">What to Expect:</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>⚡ Lightning-fast reaction challenges</li>
                  <li>🎯 Precision timing tests</li>
                  <li>🏃 Speed-based mini-games</li>
                  <li>🏆 Compete for the fastest times</li>
                  <li>💎 Earn Victory Points for your speed</li>
                </ul>
              </div>

              <div className="flex items-center justify-center space-x-2 text-orange-600 dark:text-orange-400">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">Beat your friends' best times!</span>
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

export default BeatTheClock;