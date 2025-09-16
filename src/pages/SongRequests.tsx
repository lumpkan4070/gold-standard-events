import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Music, Plus, Search, Zap, Crown, Star, Disc3, Volume2, TrendingUp, Users, Clock, CheckCircle, XCircle, Play, Sparkles, VolumeX, Mic, Headphones, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";
import Filter from "bad-words";

interface SongRequest {
  id: string;
  song_title: string;
  artist: string;
  requested_by_name?: string;
  vote_count: number;
  status: string;
  created_at: string;
  user_id: string;
}

interface UserVote {
  song_request_id: string;
}

interface DJRating {
  id: string;
  rating: number;
  comment?: string;
  performance_date?: string;
  created_at: string;
  user_id: string;
}

interface DJ {
  id: string;
  name: string;
  bio?: string;
  average_rating: number;
  total_ratings: number;
}

const SongRequests = () => {
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [currentDJ, setCurrentDJ] = useState<DJ | null>(null);
  const [djRatings, setDJRatings] = useState<DJRating[]>([]);
  const [userVoteCount, setUserVoteCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const filter = new Filter();
  const cardStackRef = useRef<HTMLDivElement>(null);

  // Max votes per user per night
  const MAX_VOTES_PER_USER = 3;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchSongRequests();
      fetchUserVotes();
      fetchCurrentDJ();
      
      // Polling for real-time updates
      const interval = setInterval(() => {
        fetchSongRequests();
        fetchUserVotes();
        fetchDJRatings();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchSongRequests = async () => {
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('song_requests')
      .select('*')
      .eq('event_date', new Date().toISOString().split('T')[0])
      .gte('created_at', cutoff)
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Connection Issue",
        description: "Failed to load song requests",
        variant: "destructive",
      });
    } else {
      setSongRequests(data || []);
    }
  };

  const fetchCurrentDJ = async () => {
    const { data, error } = await supabase
      .from('djs')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (data && !error) {
      setCurrentDJ(data);
      fetchDJRatings(data.id);
    }
  };

  const fetchDJRatings = async (djId?: string) => {
    const targetDjId = djId || currentDJ?.id;
    if (!targetDjId) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('dj_ratings')
      .select('*')
      .eq('dj_id', targetDjId)
      .eq('performance_date', today)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setDJRatings(data);
    }
  };

  const fetchUserVotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('song_votes')
      .select('song_request_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to load user votes:', error);
    } else {
      setUserVotes(data || []);
      setUserVoteCount(data?.length || 0);
    }
  };

  const submitSongRequest = async () => {
    if (!songTitle.trim() || !artist.trim() || !user) return;
    if (filter.isProfane(songTitle) || filter.isProfane(artist)) {
      toast({
        title: "Keep it Clean! 🎵",
        description: "Let's keep the vibes positive tonight",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('song_requests')
      .insert([
        {
          song_title: songTitle.trim(),
          artist: artist.trim(),
          user_id: user.id,
          requested_by_name: user.user_metadata?.first_name || 'Anonymous',
        }
      ]);

    if (error) {
      toast({
        title: "Oops! 😅",
        description: "Couldn't submit your request. Try again!",
        variant: "destructive",
      });
    } else {
      toast({
        title: "🎵 Song Added to the Mix!",
        description: "Your request is now live for everyone to vote on",
      });
      setSongTitle("");
      setArtist("");
      setIsRequestDialogOpen(false);
      fetchSongRequests();
    }
  };

  const submitDJRating = async () => {
    if (userRating === 0 || !user) return;

    const { data: djData, error: djError } = await supabase
      .from('djs')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (djError || !djData) {
      toast({
        title: "No DJ to Rate",
        description: "The DJ isn't available for rating right now",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('dj_ratings')
      .insert([
        {
          dj_id: djData.id,
          user_id: user.id,
          rating: userRating,
          comment: userComment || null,
          performance_date: new Date().toISOString().split('T')[0],
        }
      ]);

    if (error) {
      if (error.message.includes('duplicate key value violates unique constraint')) {
        toast({
          title: "Already Rated Tonight! ⭐",
          description: "You've already shared your thoughts on tonight's DJ",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Rating Failed",
          description: "Couldn't submit your rating. Try again!",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "🌟 Thanks for the Feedback!",
        description: "Your rating helps us keep the vibes perfect",
      });
      setUserRating(0);
      setUserComment("");
      setIsRatingDialogOpen(false);
      fetchCurrentDJ();
    }
  };

  const toggleVote = async (songRequestId: string) => {
    if (!user) return;

    const hasVoted = userVotes.some(vote => vote.song_request_id === songRequestId);

    if (hasVoted) {
      // Remove vote
      const { error } = await supabase
        .from('song_votes')
        .delete()
        .eq('song_request_id', songRequestId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Vote Error",
          description: "Couldn't remove your vote",
          variant: "destructive",
        });
      } else {
        fetchSongRequests();
        fetchUserVotes();
      }
    } else {
      // Check vote limit
      if (userVoteCount >= MAX_VOTES_PER_USER) {
        toast({
          title: "Vote Limit Reached! 🗳️",
          description: `You can only vote for ${MAX_VOTES_PER_USER} songs per night`,
          variant: "destructive",
        });
        return;
      }

      // Add vote
      const { error } = await supabase
        .from('song_votes')
        .insert([
          {
            song_request_id: songRequestId,
            user_id: user.id,
          }
        ]);

      if (error) {
        toast({
          title: "Vote Error",
          description: "Couldn't add your vote",
          variant: "destructive",
        });
      } else {
        toast({
          title: "🔥 Vote Added!",
          description: "Pushing this track up the charts",
        });
        fetchSongRequests();
        fetchUserVotes();
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-neon-green" />;
      case 'played':
        return <Play className="w-5 h-5 text-neon-cyan" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-primary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-neon-green/20 text-neon-green border-neon-green/30';
      case 'played':
        return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30';
      case 'declined':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const hasUserVoted = (songRequestId: string) => {
    return userVotes.some(vote => vote.song_request_id === songRequestId);
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (star: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 smooth-transition ${
              star <= rating
                ? 'fill-primary text-primary'
                : 'text-muted-foreground hover:text-primary/50'
            } ${interactive ? 'cursor-pointer hover:scale-125' : ''}`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    );
  };

  const filteredRequests = songRequests.filter(request => 
    searchQuery === "" || 
    request.song_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const trendingRequests = filteredRequests.slice(0, 3);
  const otherRequests = filteredRequests.slice(3);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-burgundy/10 flex items-center justify-center">
        <div className="premium-card p-12 text-center animate-pulse">
          <Radio className="w-16 h-16 text-primary mx-auto mb-6 animate-bounce" />
          <h2 className="urban-heading text-2xl text-foreground mb-4">Loading the Vibe...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-gradient overflow-hidden">
      <Navigation user={user} />
      
      {/* Hero Section */}
      <div className="relative pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 animate-pulse-neon"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <Disc3 className="w-20 h-20 text-primary animate-spin mr-6" style={{ animationDuration: '8s' }} />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-glow-pulse"></div>
              </div>
              <div className="relative">
                <h1 className="urban-heading text-6xl md:text-8xl urban-text-gradient mb-2">
                  TONIGHT'S
                </h1>
                <h2 className="urban-heading text-4xl md:text-6xl neon-text-gradient">
                  REQUEST LOUNGE
                </h2>
                <div className="absolute -inset-4 bg-gradient-to-r from-neon-cyan/20 via-transparent to-neon-purple/20 blur-2xl animate-pulse"></div>
              </div>
              <Volume2 className="w-16 h-16 text-neon-cyan animate-float-gentle ml-6" />
            </div>
            <p className="urban-body text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Request your favorites • Vote for the hottest tracks • Rate tonight's DJ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="urban-button text-xl px-12 py-6 animate-bounce-in">
                  <Plus className="w-6 h-6 mr-3" />
                  Drop a Request
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="neon-button text-xl px-12 py-6 animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                  <Star className="w-6 h-6 mr-3" />
                  Rate the DJ
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search songs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 pr-6 py-6 text-lg bg-card/50 border-primary/20 rounded-2xl backdrop-blur-sm focus:border-neon-cyan/50 focus:ring-neon-cyan/20 smooth-transition"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-20">
        {/* Current DJ Section */}
        {currentDJ && (
          <div className="mb-16">
            <Card className="premium-card overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-accent rounded-full flex items-center justify-center border-4 border-primary/30">
                        <Crown className="w-10 h-10 text-primary-foreground" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-neon-green rounded-full flex items-center justify-center animate-pulse-neon">
                        <Zap className="w-5 h-5 text-background" />
                      </div>
                    </div>
                    <div>
                      <h3 className="urban-heading text-3xl text-foreground mb-2">
                        DJ {currentDJ.name}
                      </h3>
                      <div className="flex items-center space-x-4 mb-2">
                        {renderStars(currentDJ.average_rating)}
                        <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 animate-pulse">
                          LIVE NOW
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {currentDJ.total_ratings} ratings tonight
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="urban-body text-sm text-muted-foreground mb-2">Your Vote Power</p>
                    <div className="flex space-x-2">
                      {Array.from({ length: MAX_VOTES_PER_USER }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full border-2 ${
                            i < userVoteCount 
                              ? 'bg-neon-cyan border-neon-cyan animate-glow-pulse' 
                              : 'border-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {MAX_VOTES_PER_USER - userVoteCount} votes left
                    </p>
                  </div>
                </div>
                
                {currentDJ.bio && (
                  <p className="urban-body text-muted-foreground text-lg mb-6 leading-relaxed">
                    {currentDJ.bio}
                  </p>
                )}

                {/* Recent Reviews */}
                {djRatings.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="urban-heading text-lg text-foreground flex items-center">
                      <Users className="w-5 h-5 mr-2 text-primary" />
                      Live Reviews
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {djRatings.slice(0, 3).map((rating, index) => (
                        <Card key={rating.id} className="neon-card animate-bounce-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              {renderStars(rating.rating)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(rating.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            {rating.comment && (
                              <p className="urban-body text-sm text-foreground/90 leading-relaxed">
                                "{rating.comment}"
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trending Section */}
        {trendingRequests.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <TrendingUp className="w-8 h-8 text-neon-pink mr-4 animate-pulse" />
              <h3 className="urban-heading text-3xl text-foreground">
                🔥 TRENDING NOW
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingRequests.map((request, index) => (
                <Card key={request.id} className={`trending-card animate-swipe-in ${index === 0 ? 'md:col-span-1 row-span-2' : ''}`} style={{ animationDelay: `${index * 0.2}s` }}>
                  <CardContent className="p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center space-x-2">
                        <Crown className={`w-6 h-6 ${index === 0 ? 'text-neon-purple' : index === 1 ? 'text-neon-pink' : 'text-neon-cyan'} animate-bounce`} />
                        <span className="urban-heading text-xl text-foreground">#{index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="mb-6 mt-4">
                      <h4 className="urban-heading text-xl text-foreground mb-2 leading-tight">
                        {request.song_title}
                      </h4>
                      <p className="urban-body text-lg text-muted-foreground">
                        by {request.artist}
                      </p>
                      {request.requested_by_name && (
                        <p className="urban-body text-sm text-muted-foreground/70 mt-2 flex items-center">
                          <Mic className="w-4 h-4 mr-1" />
                          {request.requested_by_name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(request.status)}
                        <Badge className={`${getStatusColor(request.status)} font-medium`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>

                      <Button
                        variant={hasUserVoted(request.id) ? "default" : "outline"}
                        size="lg"
                        onClick={() => toggleVote(request.id)}
                        disabled={!hasUserVoted(request.id) && userVoteCount >= MAX_VOTES_PER_USER}
                        className={`min-w-[100px] ${
                          hasUserVoted(request.id) 
                            ? "bg-gradient-to-r from-neon-pink to-neon-purple text-background shadow-lg animate-glow-pulse" 
                            : "border-primary/30 hover:border-neon-cyan/50 hover:bg-neon-cyan/10"
                        } smooth-transition hover:scale-105`}
                      >
                        <Heart 
                          className={`w-5 h-5 mr-2 ${
                            hasUserVoted(request.id) ? "fill-current" : ""
                          }`} 
                        />
                        <span className="urban-heading text-lg">{request.vote_count}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Requests */}
        {otherRequests.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Headphones className="w-8 h-8 text-primary mr-4 animate-float-gentle" />
                <h3 className="urban-heading text-3xl text-foreground">
                  ALL REQUESTS
                </h3>
                <Badge variant="outline" className="ml-4 text-primary border-primary/30 animate-pulse">
                  {otherRequests.length} songs
                </Badge>
              </div>
            </div>

            <div className="space-y-4" ref={cardStackRef}>
              {otherRequests.map((request, index) => (
                <Card key={request.id} className="swipe-card animate-swipe-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-card to-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
                            <Music className="w-7 h-7 text-primary" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="urban-heading text-xl text-foreground mb-1 truncate">
                            {request.song_title}
                          </h4>
                          <p className="urban-body text-lg text-muted-foreground">
                            by {request.artist}
                          </p>
                          {request.requested_by_name && (
                            <p className="urban-body text-sm text-muted-foreground/70 mt-1 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {request.requested_by_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(request.status)}
                          <Badge className={`${getStatusColor(request.status)} font-medium px-3 py-1`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>

                        <Button
                          variant={hasUserVoted(request.id) ? "default" : "outline"}
                          size="lg"
                          onClick={() => toggleVote(request.id)}
                          disabled={!hasUserVoted(request.id) && userVoteCount >= MAX_VOTES_PER_USER}
                          className={`min-w-[100px] ${
                            hasUserVoted(request.id) 
                              ? "bg-gradient-to-r from-neon-pink to-neon-purple text-background shadow-lg animate-glow-pulse" 
                              : "border-primary/30 hover:border-neon-cyan/50 hover:bg-neon-cyan/10"
                          } smooth-transition hover:scale-105`}
                        >
                          <Heart 
                            className={`w-5 h-5 mr-2 ${
                              hasUserVoted(request.id) ? "fill-current" : ""
                            }`} 
                          />
                          <span className="urban-heading text-lg">{request.vote_count}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <div className="text-center py-20 animate-bounce-in">
            <div className="relative inline-block mb-8">
              <VolumeX className="w-32 h-32 text-muted-foreground mx-auto" />
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full flex items-center justify-center animate-pulse-neon">
                <Plus className="w-8 h-8 text-background" />
              </div>
            </div>
            <h3 className="urban-heading text-4xl text-foreground mb-4">
              Silence is Golden... But Music is Better! 🎵
            </h3>
            <p className="urban-body text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Be the first to drop a request and get this party started. The DJ is waiting for your vibe!
            </p>
          </div>
        )}

        {/* How It Works Section */}
        <div className="mt-20">
          <Card className="premium-card overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center mb-8">
                <Sparkles className="w-8 h-8 text-primary mr-4 animate-pulse" />
                <h3 className="urban-heading text-3xl text-foreground">
                  How the Lounge Works
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-neon-cyan rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="urban-heading text-xs text-background">1</span>
                    </div>
                    <div>
                      <h4 className="urban-heading text-lg text-foreground mb-2">Drop Your Request</h4>
                      <p className="urban-body text-muted-foreground">Submit your favorite tracks and let the crowd know what you want to hear</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-neon-pink rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="urban-heading text-xs text-background">2</span>
                    </div>
                    <div>
                      <h4 className="urban-heading text-lg text-foreground mb-2">Vote for the Heat</h4>
                      <p className="urban-body text-muted-foreground">You get 3 votes per night - use them to push the hottest tracks to the top</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-neon-purple rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="urban-heading text-xs text-background">3</span>
                    </div>
                    <div>
                      <h4 className="urban-heading text-lg text-foreground mb-2">DJ Takes Control</h4>
                      <p className="urban-body text-muted-foreground">Most voted songs get priority, but the DJ curates the perfect flow</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-neon-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="urban-heading text-xs text-background">4</span>
                    </div>
                    <div>
                      <h4 className="urban-heading text-lg text-foreground mb-2">Rate the Experience</h4>
                      <p className="urban-body text-muted-foreground">Let us know how the DJ performed to keep improving every night</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Song Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="premium-card border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="urban-heading text-2xl text-foreground mb-2">
              🎵 Drop Your Request
            </DialogTitle>
            <DialogDescription className="urban-body text-lg text-muted-foreground">
              What track would make your night perfect?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <label className="urban-heading text-lg text-foreground">Song Title</label>
              <Input
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="Enter the song title..."
                className="text-lg py-6 bg-card/50 border-primary/20 rounded-xl focus:border-neon-cyan/50 focus:ring-neon-cyan/20"
              />
            </div>

            <div className="space-y-3">
              <label className="urban-heading text-lg text-foreground">Artist</label>
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Enter the artist name..."
                className="text-lg py-6 bg-card/50 border-primary/20 rounded-xl focus:border-neon-cyan/50 focus:ring-neon-cyan/20"
              />
            </div>
          </div>

          <DialogFooter className="space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setIsRequestDialogOpen(false)}
              className="px-8 py-4 text-lg border-muted hover:border-primary/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitSongRequest}
              disabled={!songTitle.trim() || !artist.trim()}
              className="urban-button px-8 py-4 text-lg"
            >
              🚀 Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DJ Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="premium-card border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="urban-heading text-2xl text-foreground mb-2">
              ⭐ Rate Tonight's DJ
            </DialogTitle>
            <DialogDescription className="urban-body text-lg text-muted-foreground">
              How did {currentDJ?.name || 'the DJ'} do tonight? Your feedback helps us keep the vibes perfect.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-6">
            <div className="text-center">
              <label className="urban-heading text-lg text-foreground mb-6 block">Your Rating</label>
              <div className="flex justify-center">
                {renderStars(userRating, true, setUserRating)}
              </div>
            </div>

            <div className="space-y-3">
              <label className="urban-heading text-lg text-foreground">Comments (Optional)</label>
              <Textarea
                placeholder="Tell us about tonight's performance..."
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="min-h-[120px] text-lg bg-card/50 border-primary/20 rounded-xl focus:border-neon-cyan/50 focus:ring-neon-cyan/20 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setIsRatingDialogOpen(false)}
              className="px-8 py-4 text-lg border-muted hover:border-primary/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitDJRating}
              disabled={userRating === 0}
              className="neon-button px-8 py-4 text-lg"
            >
              🌟 Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SongRequests;
