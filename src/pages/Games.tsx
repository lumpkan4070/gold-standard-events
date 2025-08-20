import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dice1, Camera, Share2, Trophy, Sparkles, Users, Clock, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TruthPrompt {
  id: string;
  text: string;
  category: string;
}

interface DarePrompt {
  id: string;
  text: string;
  category: string;
  points_reward: number;
}

interface GameSession {
  sessionId: string;
  currentPrompt: TruthPrompt | DarePrompt | null;
  promptType: 'truth' | 'dare' | null;
  totalPoints: number;
}

const Games = () => {
  const [user, setUser] = useState<any>(null);
  const [truthPrompts, setTruthPrompts] = useState<TruthPrompt[]>([]);
  const [darePrompts, setDarePrompts] = useState<DarePrompt[]>([]);
  const [gameSession, setGameSession] = useState<GameSession>({
    sessionId: crypto.randomUUID(),
    currentPrompt: null,
    promptType: null,
    totalPoints: 0
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [completionCaption, setCompletionCaption] = useState('');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [userStats, setUserStats] = useState({ victoryPoints: 0, totalGames: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadGameData();
      loadUserStats();
    }
  }, [user]);

  const loadGameData = async () => {
    try {
      // Load truth prompts
      const { data: truths, error: truthError } = await supabase
        .from('truth_prompts')
        .select('*')
        .eq('is_active', true);

      if (truthError) throw truthError;

      // Load dare prompts
      const { data: dares, error: dareError } = await supabase
        .from('dare_prompts')
        .select('*')
        .eq('is_active', true);

      if (dareError) throw dareError;

      setTruthPrompts(truths || []);
      setDarePrompts(dares || []);
    } catch (error) {
      console.error('Error loading game data:', error);
      toast.error('Failed to load game data');
    }
  };

  const loadUserStats = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('victory_points')
        .eq('user_id', user.id)
        .single();

      const { data: gameHistory } = await supabase
        .from('user_game_activity')
        .select('id')
        .eq('user_id', user.id);

      setUserStats({
        victoryPoints: profile?.victory_points || 0,
        totalGames: gameHistory?.length || 0
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const getRandomPrompt = (type: 'truth' | 'dare') => {
    const prompts = type === 'truth' ? truthPrompts : darePrompts;
    const filteredPrompts = selectedCategory === 'all' 
      ? prompts 
      : prompts.filter(p => p.category === selectedCategory);
    
    if (filteredPrompts.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * filteredPrompts.length);
    return filteredPrompts[randomIndex];
  };

  const drawPrompt = (type: 'truth' | 'dare') => {
    const prompt = getRandomPrompt(type);
    if (!prompt) {
      toast.error('No prompts available for this category');
      return;
    }

    setGameSession(prev => ({
      ...prev,
      currentPrompt: prompt,
      promptType: type
    }));

    // Track the draw in analytics
    trackGameEvent('prompt_drawn', { 
      promptType: type, 
      category: prompt.category,
      promptId: prompt.id 
    });
  };

  const completePrompt = async (shareToPhotoWall = false) => {
    if (!gameSession.currentPrompt || !user) return;

    try {
      const pointsAwarded = gameSession.promptType === 'dare' 
        ? (gameSession.currentPrompt as DarePrompt).points_reward 
        : 5; // Truth prompts give 5 points

      // Record game activity
      const { error: activityError } = await supabase
        .from('user_game_activity')
        .insert({
          user_id: user.id,
          game_session_id: gameSession.sessionId,
          prompt_id: gameSession.currentPrompt.id,
          prompt_type: gameSession.promptType,
          completed: true,
          points_awarded: pointsAwarded,
          posted_to_photo_wall: shareToPhotoWall,
          completion_data: {
            caption: completionCaption,
            category: gameSession.currentPrompt.category
          }
        });

      if (activityError) throw activityError;

      // Award victory points
      const { error: pointsError } = await supabase.rpc('award_victory_points', {
        user_uuid: user.id,
        points: pointsAwarded
      });

      if (pointsError) throw pointsError;

      // If sharing to photo wall and has photo
      if (shareToPhotoWall && completionPhoto) {
        const fileName = `${user.id}/${Date.now()}_${completionPhoto.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('photo-wall')
          .upload(fileName, completionPhoto);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photo-wall')
          .getPublicUrl(fileName);

        const { error: photoError } = await supabase
          .from('photo_wall')
          .insert({
            user_id: user.id,
            image_url: publicUrl,
            caption: completionCaption || `Completed: ${gameSession.currentPrompt.text}`,
            is_approved: false
          });

        if (photoError) throw photoError;
      }

      // Update local state
      setGameSession(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + pointsAwarded,
        currentPrompt: null,
        promptType: null
      }));

      setUserStats(prev => ({
        ...prev,
        victoryPoints: prev.victoryPoints + pointsAwarded,
        totalGames: prev.totalGames + 1
      }));

      toast.success(`Great job! You earned ${pointsAwarded} Victory Points! 🎉`);
      
      // Track completion
      trackGameEvent('prompt_completed', {
        pointsAwarded,
        sharedToPhotoWall: shareToPhotoWall
      });

      // Reset completion state
      setCompletionPhoto(null);
      setCompletionCaption('');
      setShowCompletionDialog(false);

    } catch (error) {
      console.error('Error completing prompt:', error);
      toast.error('Failed to complete prompt');
    }
  };

  const trackGameEvent = async (eventType: string, eventData: any) => {
    try {
      await supabase.from('analytics').insert({
        user_id: user?.id,
        event_type: `game_${eventType}`,
        event_data: eventData
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const shareToSocial = () => {
    if (!gameSession.currentPrompt) return;
    
    const text = `Just played Truth or Dare at Victory Bistro! ${gameSession.currentPrompt.text} #VictoryBistro #TruthOrDare`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    trackGameEvent('social_share', { platform: 'twitter' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'icebreakers': return <Users className="h-4 w-4" />;
      case 'party_fun': return <Sparkles className="h-4 w-4" />;
      case 'memory_lane': return <Clock className="h-4 w-4" />;
      case 'victory_specials': return <Trophy className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'icebreakers': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'party_fun': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'memory_lane': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'victory_specials': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Sign In Required</CardTitle>
              <CardDescription className="text-center">
                You need to be signed in to play Truth or Dare: Adult Edition
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent mb-4">
            Truth or Dare: Adult Edition
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get the conversation started with fun, engaging prompts designed for memorable moments at Victory Bistro!
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Victory Points</p>
                <p className="text-2xl font-bold text-primary">{userStats.victoryPoints}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Games Played</p>
                <p className="text-2xl font-bold">{userStats.totalGames}</p>
              </div>
              <Dice1 className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Session Points</p>
                <p className="text-2xl font-bold text-green-600">{gameSession.totalPoints}</p>
              </div>
              <Sparkles className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {['all', 'icebreakers', 'party_fun', 'memory_lane', 'victory_specials'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-2"
              >
                {category !== 'all' && getCategoryIcon(category)}
                {category === 'all' ? 'All Categories' : 
                 category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>

        {/* Game Interface */}
        {!gameSession.currentPrompt ? (
          // Prompt Selection
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Truth Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => drawPrompt('truth')}>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                  </div>
                  <CardTitle className="text-2xl">Truth</CardTitle>
                  <CardDescription>
                    Share stories, memories, and personal insights that spark great conversations
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge variant="secondary" className="mb-4">5 Victory Points</Badge>
                  <Button className="w-full" size="lg">
                    <Dice1 className="h-5 w-5 mr-2" />
                    Draw Truth
                  </Button>
                </CardContent>
              </Card>

              {/* Dare Card */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => drawPrompt('dare')}>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                  </div>
                  <CardTitle className="text-2xl">Dare</CardTitle>
                  <CardDescription>
                    Take on fun challenges that create amazing memories and photo opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge variant="secondary" className="mb-4">10-30 Victory Points</Badge>
                  <Button className="w-full" size="lg" variant="secondary">
                    <Dice1 className="h-5 w-5 mr-2" />
                    Draw Dare
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Current Prompt Display
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge className={getCategoryColor(gameSession.currentPrompt.category)}>
                    {getCategoryIcon(gameSession.currentPrompt.category)}
                    <span className="ml-2">
                      {gameSession.currentPrompt.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </Badge>
                  <Badge variant="outline">
                    {gameSession.promptType === 'dare' 
                      ? `${(gameSession.currentPrompt as DarePrompt).points_reward} Points`
                      : '5 Points'
                    }
                  </Badge>
                </div>
                <CardTitle className="text-xl text-center mb-4">
                  {gameSession.promptType === 'truth' ? '🤔 Truth' : '⚡ Dare'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-center mb-6 font-medium">
                  {gameSession.currentPrompt.text}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={shareToSocial} variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  {gameSession.promptType === 'dare' && (
                    <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Camera className="h-4 w-4 mr-2" />
                          Complete Dare
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Complete Your Dare!</DialogTitle>
                          <DialogDescription>
                            Share your completion with Victory Moments or just earn your points
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Add a photo (optional)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setCompletionPhoto(e.target.files?.[0] || null)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Caption
                            </label>
                            <Textarea
                              placeholder="Tell us about your dare experience..."
                              value={completionCaption}
                              onChange={(e) => setCompletionCaption(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => completePrompt(false)}
                              variant="outline"
                              className="flex-1"
                            >
                              Just Complete
                            </Button>
                            <Button 
                              onClick={() => completePrompt(true)}
                              className="flex-1"
                              disabled={!completionPhoto}
                            >
                              Post to Victory Moments
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {gameSession.promptType === 'truth' && (
                    <Button onClick={() => completePrompt(false)}>
                      <Trophy className="h-4 w-4 mr-2" />
                      Complete Truth
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setGameSession(prev => ({ ...prev, currentPrompt: null, promptType: null }))}
                  >
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Tips */}
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-center">How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Dice1 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Choose Your Challenge</h3>
                <p className="text-sm text-muted-foreground">
                  Pick Truth for stories and conversations, or Dare for fun photo opportunities
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Complete & Share</h3>
                <p className="text-sm text-muted-foreground">
                  Complete your dare and optionally share to Victory Moments photo wall
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Earn Victory Points</h3>
                <p className="text-sm text-muted-foreground">
                  Collect points to redeem for drinks, discounts, and special offers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Games;