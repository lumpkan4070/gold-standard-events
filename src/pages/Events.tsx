import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Phone, Mail, MessageCircle, Upload, Image as ImageIcon, Star, Sparkles, PartyPopper, Crown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Events = () => {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState({
    name: "",
    email: "",
    phone: "",
    event_title: "",
    number_of_guests: 1,
    special_requests: "",
    event_image: null as File | null
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for user session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        // Load user profile data to prefill form
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile) {
          setBookingData(prev => ({
            ...prev,
            name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
            email: profile.email || session.user.email || "",
            phone: profile.phone || ""
          }));
        }
      }
    };
    checkUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    // Load approved events
    const loadEvents = async () => {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("is_approved", true)
        .order("event_date", { ascending: true });
      
      setEvents(eventsData || []);
      setIsLoading(false);
    };
    
    loadEvents();

    return () => subscription.unsubscribe();
  }, []);

  // Remove test email trigger - no longer needed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const run = params.get('sendTestEmail');
    if (run && !localStorage.getItem('vb_test_email_sent')) {
      localStorage.removeItem('vb_test_email_sent'); // Reset for potential future use
      navigate('/events', { replace: true });
    }
  }, []);

  const handleBookEvent = (eventId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to book events.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    setShowBookingForm(eventId);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBookingData(prev => ({ ...prev, event_image: file }));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !showBookingForm) return;

    try {
      const event = events.find(e => e.id === showBookingForm);
      if (!event) return;

      // Upload image if provided
      let imageUrl = null;
      if (bookingData.event_image) {
        imageUrl = await uploadImage(bookingData.event_image);
      }

      const { error } = await supabase
        .from("event_bookings")
        .insert({
          user_id: user.id,
          event_date: event.event_date,
          event_title: bookingData.event_title || event.title,
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          number_of_guests: parseInt(bookingData.number_of_guests.toString()),
          special_requests: bookingData.special_requests,
          event_image_url: imageUrl
        });

      if (error) throw error;

      // Track analytics
      await supabase.from('analytics').insert({
        user_id: user.id,
        event_type: 'booking_created',
        event_data: {
          event_id: event.id,
          event_title: bookingData.event_title || event.title,
          guests: bookingData.number_of_guests
        }
      });

      toast({
        title: "Booking Submitted",
        description: "Your event booking has been submitted for approval."
      });

      setShowBookingForm(null);
      setBookingData({
        name: "",
        email: "",
        phone: "",
        event_title: "",
        number_of_guests: 1,
        special_requests: "",
        event_image: null
      });
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to submit booking",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Navigation user={user} />
      
      {/* Epic Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary-foreground/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary))_0%,transparent_50%)] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--primary-foreground))_0%,transparent_50%)] opacity-15" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float">
          <Sparkles className="h-8 w-8 text-primary/30" />
        </div>
        <div className="absolute top-32 right-20 animate-float" style={{ animationDelay: '1s' }}>
          <Crown className="h-6 w-6 text-primary-foreground/40" />
        </div>
        <div className="absolute bottom-32 left-20 animate-float" style={{ animationDelay: '2s' }}>
          <Star className="h-10 w-10 text-primary/25" />
        </div>
        <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: '0.5s' }}>
          <Zap className="h-7 w-7 text-primary-foreground/35" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4">
          <div className="space-y-6">
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2 text-sm font-medium animate-pulse">
              🎉 EXCLUSIVE EXPERIENCES
            </Badge>
            
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-bold victory-text-gradient animate-fade-in">
                Epic Events
              </h1>
              <div className="text-2xl md:text-4xl font-light text-foreground/80 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Where Luxury Meets <span className="victory-text-gradient font-semibold">Celebration</span>
              </div>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Immerse yourself in Cleveland's most exclusive ultra lounge experience. Private parties, VIP celebrations, and unforgettable moments await.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Button size="lg" className="luxury-button text-lg px-8 py-4 victory-glow">
                <PartyPopper className="h-5 w-5 mr-2" />
                Explore Events
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-white/5 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                <Phone className="h-5 w-5 mr-2" />
                Call (216) 938-7778
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 victory-hero-bg">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 pt-16">
            <Badge className="bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground mb-6">
              ✨ UPCOMING EXPERIENCES
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold victory-text-gradient mb-4">
              Exclusive Events Calendar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From intimate gatherings to grand celebrations - discover events that redefine luxury entertainment
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto"></div>
                <Sparkles className="absolute inset-0 h-8 w-8 m-auto text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground mt-4 text-lg">Loading epic events...</p>
            </div>
          ) : events.length === 0 ? (
            <Card className="luxury-card text-center py-20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-foreground/5" />
              <CardContent className="relative z-10">
                <div className="mb-6">
                  <Calendar className="h-20 w-20 mx-auto mb-4 text-primary/50" />
                  <Sparkles className="h-8 w-8 mx-auto text-primary-foreground/40" />
                </div>
                <h3 className="text-2xl font-bold victory-text-gradient mb-4">Amazing Events Coming Soon</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  We're crafting extraordinary experiences that will redefine your expectations. Stay tuned for our upcoming luxury events.
                </p>
                <Button className="luxury-button mt-6" onClick={() => window.location.href = 'tel:(216)938-7778'}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call for Private Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => (
                <Card 
                  key={event.id} 
                  className="luxury-card group hover:scale-105 victory-transition overflow-hidden relative border-2 border-transparent hover:border-primary/20 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Premium Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground shadow-lg">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  </div>
                  
                  {/* Event Image */}
                  <div className="relative h-56 overflow-hidden">
                    {event.featured_image_url ? (
                      <div 
                        className="h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700" 
                        style={{ backgroundImage: `url(${event.featured_image_url})` }} 
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-primary/20 to-primary-foreground/20 flex items-center justify-center">
                        <PartyPopper className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Floating Event Type */}
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-black/60 text-white border-white/20 backdrop-blur-sm">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Exclusive Event
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-foreground flex items-center gap-2 text-xl group-hover:text-primary victory-transition">
                      <Calendar className="h-5 w-5 text-primary victory-glow" />
                      {event.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground bg-primary/5 rounded-lg p-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{formatDate(event.event_date)}</span>
                    </div>
                    
                    {event.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                        {event.description}
                      </p>
                    )}

                    <div className="pt-2">
                      <Button 
                        onClick={() => handleBookEvent(event.id)}
                        className="luxury-button w-full text-base py-3 victory-glow group-hover:shadow-xl"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Reserve Your Spot
                        <Zap className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 victory-transition" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Booking Form Modal */}
          {showBookingForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="luxury-card w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Book Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_title">Event Title</Label>
                      <Input
                        id="event_title"
                        value={bookingData.event_title}
                        onChange={(e) => setBookingData(prev => ({ ...prev, event_title: e.target.value }))}
                        placeholder="Custom event title or leave blank for default"
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={bookingData.name}
                        onChange={(e) => setBookingData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={bookingData.email}
                        onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={bookingData.phone}
                        onChange={(e) => setBookingData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="guests">Number of Guests</Label>
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        max="20"
                        value={bookingData.number_of_guests}
                        onChange={(e) => setBookingData(prev => ({ ...prev, number_of_guests: parseInt(e.target.value) || 1 }))}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="special_requests">Special Requests / Description</Label>
                      <Textarea
                        id="special_requests"
                        value={bookingData.special_requests}
                        onChange={(e) => setBookingData(prev => ({ ...prev, special_requests: e.target.value }))}
                        placeholder="Any special requests, dietary requirements, or event details..."
                        className="bg-input border-primary/20 focus:border-primary"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_image">Event Image (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="event_image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="bg-input border-primary/20 focus:border-primary"
                        />
                        {bookingData.event_image && (
                          <div className="flex items-center gap-1 text-primary text-sm">
                            <ImageIcon className="h-4 w-4" />
                            <span>{bookingData.event_image.name}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload an image to help us understand your event vision
                      </p>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="luxury-button flex-1">
                        Submit Booking
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowBookingForm(null)}
                        className="border-primary/20 text-primary hover:bg-primary/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Premium Info Section */}
          <div className="mt-24 space-y-12">
            {/* VIP Services Banner */}
            <Card className="luxury-card relative overflow-hidden border-2 border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary-foreground/10" />
              <CardContent className="relative z-10 p-8 text-center">
                <Crown className="h-12 w-12 mx-auto text-primary mb-4 victory-glow" />
                <h3 className="text-2xl font-bold victory-text-gradient mb-3">VIP Event Planning Services</h3>
                <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
                  Let our expert team create a personalized luxury experience tailored to your vision. From intimate gatherings to grand celebrations.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Badge className="bg-primary/20 text-primary px-4 py-2">Private Dining</Badge>
                  <Badge className="bg-primary/20 text-primary px-4 py-2">Custom Cocktails</Badge>
                  <Badge className="bg-primary/20 text-primary px-4 py-2">Live Entertainment</Badge>
                  <Badge className="bg-primary/20 text-primary px-4 py-2">Photography</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="luxury-card group hover:scale-105 victory-transition border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-3 text-xl">
                    <div className="p-2 bg-primary/20 rounded-full">
                      <MapPin className="h-6 w-6 text-primary victory-glow" />
                    </div>
                    Location & Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <p className="font-semibold text-lg victory-text-gradient">Victory Bistro Ultra Lounge</p>
                    <div className="text-muted-foreground space-y-1">
                      <p>19800 S Waterloo Rd</p>
                      <p>Cleveland, OH 44119</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Operating Hours
                    </p>
                    <p className="text-muted-foreground">Open Daily 5PM - 2AM</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-primary/20 to-primary-foreground/20 text-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Cleveland's Premier Ultra Lounge
                  </Badge>
                </CardContent>
              </Card>

              <Card className="luxury-card group hover:scale-105 victory-transition border-l-4 border-l-primary-foreground">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-3 text-xl">
                    <div className="p-2 bg-primary-foreground/20 rounded-full">
                      <Phone className="h-6 w-6 text-primary-foreground victory-glow" />
                    </div>
                    Event Concierge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg hover:bg-primary/10 victory-transition cursor-pointer" onClick={() => window.location.href = 'tel:(216)938-7778'}>
                      <Phone className="h-5 w-5 text-primary" />
                      <span className="font-medium">(216) 938-7778</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg hover:bg-primary/10 victory-transition cursor-pointer">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="font-medium">events@victorybistro.com</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      Our dedicated event specialists are standing by to create your perfect luxury experience.
                    </p>
                    <Badge className="bg-gradient-to-r from-primary-foreground/20 to-primary/20 text-primary-foreground">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      24/7 Event Support
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;