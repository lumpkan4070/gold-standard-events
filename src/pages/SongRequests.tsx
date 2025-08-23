import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Music, Plus, Clock, CheckCircle, XCircle, Play, Star, Disc3, Sparkles, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";

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

const SongRequests = () => {
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      
      // Set up real-time subscription for song requests
      const channel = supabase
        .channel('song-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'song_requests'
          },
          (payload) => {
            console.log('Real-time song request change:', payload);
            fetchSongRequests(); // Refresh the list when any changes occur
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'song_votes'
          },
          (payload) => {
            console.log('Real-time vote change:', payload);
            fetchSongRequests(); // Refresh when votes change
            fetchUserVotes(); // Refresh user votes
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchSongRequests = async () => {
    const { data, error } = await supabase
      .from('song_requests')
      .select('*')
      .eq('event_date', new Date().toISOString().split('T')[0])
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load song requests",
        variant: "destructive",
      });
    } else {
      setSongRequests(data || []);
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
    }
  };

  const submitSongRequest = async () => {
    if (!songTitle.trim() || !artist.trim() || !user) return;

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
        title: "Error",
        description: "Failed to submit song request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Submitted",
        description: "Your song request has been submitted!",
      });
      setSongTitle("");
      setArtist("");
      setIsRequestDialogOpen(false);
      fetchSongRequests();
    }
  };

  const submitDJRating = async () => {
    if (userRating === 0 || !user) return;

    // Get the first active DJ (tonight's DJ)
    const { data: djData, error: djError } = await supabase
      .from('djs')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (djError || !djData) {
      toast({
        title: "Error",
        description: "No DJ available to rate",
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
          title: "Already Rated",
          description: "You've already rated tonight's DJ",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit rating",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Rating Submitted",
        description: "Thank you for rating tonight's DJ!",
      });
      setUserRating(0);
      setUserComment("");
      setIsRatingDialogOpen(false);
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
          title: "Error",
          description: "Failed to remove vote",
          variant: "destructive",
        });
      } else {
        fetchSongRequests();
        fetchUserVotes();
      }
    } else {
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
          title: "Error",
          description: "Failed to add vote",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Vote Added",
          description: "Thanks for voting!",
        });
        fetchSongRequests();
        fetchUserVotes();
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'played':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'played':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
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
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Disc3 className="w-12 h-12 text-primary mr-3 animate-spin-slow" />
              <h1 className="victory-text-gradient text-5xl font-bold">
                Tonight's Vibes
              </h1>
              <Sparkles className="w-8 h-8 text-primary ml-3" />
            </div>
            <p className="text-muted-foreground text-xl mb-8">
              Request songs, vote for favorites, and rate tonight's DJ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="luxury-button text-lg px-8 py-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Request a Song
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-lg px-8 py-6 border-primary/20 hover:bg-primary/10">
                  <Star className="w-5 h-5 mr-2" />
                  Rate Tonight DJ
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {/* Song Requests Grid */}
          <div className="grid gap-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Headphones className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Live Requests</h2>
                <Badge variant="secondary" className="animate-pulse">
                  {songRequests.length} requests
                </Badge>
              </div>
            </div>

            {songRequests.map((request, index) => (
              <Card key={request.id} className="luxury-card overflow-hidden group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-bold text-lg border-2 border-primary/30">
                          #{index + 1}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-yellow-600 fill-current" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl text-foreground truncate group-hover:text-primary transition-colors">
                          {request.song_title}
                        </h3>
                        <p className="text-muted-foreground text-lg">
                          by <span className="font-medium">{request.artist}</span>
                        </p>
                        {request.requested_by_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Requested by {request.requested_by_name}
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
                        className={`min-w-[80px] ${
                          hasUserVoted(request.id) 
                            ? "bg-red-500 hover:bg-red-600 text-white" 
                            : "hover:bg-primary/10 border-primary/30"
                        } transition-all duration-200`}
                      >
                        <Heart 
                          className={`w-5 h-5 mr-2 ${
                            hasUserVoted(request.id) ? "fill-current" : ""
                          }`} 
                        />
                        <span className="font-bold">{request.vote_count}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {songRequests.length === 0 && (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <Music className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-bounce">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">No Requests Yet</h3>
              <p className="text-muted-foreground text-lg">Be the first to request a song for tonight!</p>
            </div>
          )}

          {/* How it Works Section */}
          <div className="mt-16 p-8 bg-gradient-to-r from-muted/20 to-primary/5 rounded-2xl border border-border/50">
            <div className="flex items-center mb-6">
              <Sparkles className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-foreground">How Tonight Works</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-muted-foreground">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Request your favorite songs for tonight's event</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Vote for songs you'd like to hear next</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Most voted songs get priority with the DJ</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Rate tonight's DJ to help future events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Song Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Request a Song</DialogTitle>
            <DialogDescription>
              Let tonight's DJ know what you'd like to hear
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="song-title" className="text-base font-medium">Song Title</Label>
              <Input
                id="song-title"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="Enter song title..."
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="artist" className="text-base font-medium">Artist</Label>
              <Input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Enter artist name..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitSongRequest}
              disabled={!songTitle.trim() || !artist.trim()}
              className="luxury-button"
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DJ Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Rate Tonight's DJ</DialogTitle>
            <DialogDescription>
              Share your experience and help us improve future events
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <label className="text-base font-medium mb-3 block">Your Rating</label>
              {renderStars(userRating, true, setUserRating)}
            </div>

            <div>
              <Label htmlFor="dj-comment" className="text-base font-medium">Comment (Optional)</Label>
              <Textarea
                id="dj-comment"
                placeholder="Tell us about tonight's performance..."
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="min-h-[100px] mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitDJRating}
              disabled={userRating === 0}
              className="luxury-button"
            >
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SongRequests;