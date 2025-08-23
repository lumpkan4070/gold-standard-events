import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Music, Plus, TrendingUp, Clock, CheckCircle, XCircle, Play } from "lucide-react";
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

interface DJ {
  id: string;
  name: string;
}

interface UserVote {
  song_request_id: string;
}

const SongRequests = () => {
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [djs, setDJs] = useState<DJ[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [selectedDJ, setSelectedDJ] = useState("");
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
      fetchDJs();
      fetchUserVotes();
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

  const fetchDJs = async () => {
    const { data, error } = await supabase
      .from('djs')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Failed to load DJs:', error);
    } else {
      setDJs(data || []);
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
          dj_id: selectedDJ || null,
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
      setSelectedDJ("");
      setIsRequestDialogOpen(false);
      fetchSongRequests();
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
        return 'bg-green-100 text-green-800';
      case 'played':
        return 'bg-blue-100 text-blue-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const hasUserVoted = (songRequestId: string) => {
    return userVotes.some(vote => vote.song_request_id === songRequestId);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="victory-text-gradient text-4xl font-bold mb-4">
              Song Requests
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Request songs and vote for your favorites
            </p>
            
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="luxury-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Request a Song
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-foreground">Request a Song</DialogTitle>
                  <DialogDescription>
                    Let the DJ know what you'd like to hear tonight
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="song-title">Song Title</Label>
                    <Input
                      id="song-title"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="Enter song title..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                      id="artist"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Enter artist name..."
                    />
                  </div>

                  {djs.length > 0 && (
                    <div>
                      <Label htmlFor="dj">DJ (Optional)</Label>
                      <Select value={selectedDJ} onValueChange={setSelectedDJ}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a DJ" />
                        </SelectTrigger>
                        <SelectContent>
                          {djs.map((dj) => (
                            <SelectItem key={dj.id} value={dj.id}>
                              {dj.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
          </div>

          <div className="space-y-4">
            {songRequests.map((request, index) => (
              <Card key={request.id} className="luxury-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{request.song_title}</h3>
                        <p className="text-muted-foreground">by {request.artist}</p>
                        {request.requested_by_name && (
                          <p className="text-sm text-muted-foreground">
                            Requested by {request.requested_by_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>

                      <Button
                        variant={hasUserVoted(request.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleVote(request.id)}
                        className={hasUserVoted(request.id) ? "bg-red-500 hover:bg-red-600" : ""}
                      >
                        <Heart 
                          className={`w-4 h-4 mr-2 ${
                            hasUserVoted(request.id) ? "fill-current" : ""
                          }`} 
                        />
                        {request.vote_count}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {songRequests.length === 0 && (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Song Requests Yet</h3>
              <p className="text-muted-foreground">Be the first to request a song for tonight!</p>
            </div>
          )}

          <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-2">How it works:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Request your favorite songs for tonight's event</li>
              <li>• Vote for songs you'd like to hear</li>
              <li>• Most voted songs get priority with the DJ</li>
              <li>• Track the status of your requests in real-time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongRequests;