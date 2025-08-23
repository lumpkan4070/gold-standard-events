import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Music, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";

interface DJ {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  genre_specialties: string[];
  average_rating: number;
  total_ratings: number;
}

interface Rating {
  id: string;
  rating: number;
  comment?: string;
  performance_date?: string;
  created_at: string;
}

const DJs = () => {
  const [djs, setDJs] = useState<DJ[]>([]);
  const [selectedDJ, setSelectedDJ] = useState<DJ | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [performanceDate, setPerformanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [djRatings, setDJRatings] = useState<Rating[]>([]);
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
    fetchDJs();
  }, []);

  const fetchDJs = async () => {
    const { data, error } = await supabase
      .from('djs')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load DJs",
        variant: "destructive",
      });
    } else {
      setDJs(data || []);
    }
  };

  const fetchDJRatings = async (djId: string) => {
    const { data, error } = await supabase
      .from('dj_ratings')
      .select('*')
      .eq('dj_id', djId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load ratings",
        variant: "destructive",
      });
    } else {
      setDJRatings(data || []);
    }
  };

  const handleRateDJ = (dj: DJ) => {
    setSelectedDJ(dj);
    setUserRating(0);
    setUserComment("");
    setPerformanceDate(new Date().toISOString().split('T')[0]);
    setIsRatingDialogOpen(true);
    fetchDJRatings(dj.id);
  };

  const submitRating = async () => {
    if (!selectedDJ || userRating === 0 || !user) return;

    const { error } = await supabase
      .from('dj_ratings')
      .insert([
        {
          dj_id: selectedDJ.id,
          user_id: user.id,
          rating: userRating,
          comment: userComment || null,
          performance_date: performanceDate,
        }
      ]);

    if (error) {
      if (error.message.includes('duplicate key value violates unique constraint')) {
        toast({
          title: "Already Rated",
          description: "You've already rated this DJ for this performance date",
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
        description: "Thank you for rating this DJ!",
      });
      setIsRatingDialogOpen(false);
      fetchDJs();
      fetchDJRatings(selectedDJ.id);
    }
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
        {!interactive && (
          <span className="ml-2 text-sm text-muted-foreground">
            ({rating.toFixed(1)})
          </span>
        )}
      </div>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="victory-text-gradient text-4xl font-bold mb-4">
              Our DJs
            </h1>
            <p className="text-muted-foreground text-lg">
              Rate your favorite DJs and see what others think
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {djs.map((dj) => (
              <Card key={dj.id} className="luxury-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{dj.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {renderStars(dj.average_rating)}
                        <span className="text-sm text-muted-foreground">
                          ({dj.total_ratings} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dj.bio && (
                    <CardDescription className="mb-3">
                      {dj.bio}
                    </CardDescription>
                  )}
                  
                  {dj.genre_specialties && dj.genre_specialties.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Specialties:</p>
                      <div className="flex flex-wrap gap-1">
                        {dj.genre_specialties.map((genre, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleRateDJ(dj)}
                    className="w-full luxury-button"
                  >
                    Rate This DJ
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {djs.length === 0 && (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No DJs Found</h3>
              <p className="text-muted-foreground">Check back soon for our DJ lineup!</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rate {selectedDJ?.name}</DialogTitle>
            <DialogDescription>
              Share your experience and help others discover great DJs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              {renderStars(userRating, true, setUserRating)}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Performance Date</label>
              <input
                type="date"
                value={performanceDate}
                onChange={(e) => setPerformanceDate(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {djRatings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Recent Reviews</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {djRatings.slice(0, 5).map((rating) => (
                    <div key={rating.id} className="border border-border rounded-lg p-3 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        {renderStars(rating.rating)}
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {rating.performance_date 
                              ? new Date(rating.performance_date).toLocaleDateString()
                              : new Date(rating.created_at).toLocaleDateString()
                            }
                          </span>
                        </div>
                      </div>
                      {rating.comment && (
                        <p className="text-sm text-foreground">{rating.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitRating}
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

export default DJs;