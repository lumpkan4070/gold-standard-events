import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { Calendar, Clock, Users, MapPin, Phone, Mail, MessageCircle, Upload, Image as ImageIcon } from "lucide-react";
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

  // Send test booking email when query param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const run = params.get('sendTestEmail');
    if (run && !localStorage.getItem('vb_test_email_sent')) {
      (async () => {
        const { error } = await supabase.functions.invoke('send-booking-notification', {
          body: {
            bookingId: `test-${Date.now()}`,
            status: 'approved',
            customerEmail: 'anthony@aclpublishing.com',
            customerName: 'Anthony',
            eventTitle: 'Test Booking Confirmation',
            eventDate: new Date().toISOString(),
            adminNotes: 'This is a test email from Victory Bistro setup.',
            replyTo: 'support@victorybistro.com'
          }
        });
        if (error) {
          toast({ title: 'Test Email Failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Test Email Sent', description: 'Check your inbox (and spam) for the test booking email.' });
          localStorage.setItem('vb_test_email_sent', String(Date.now()));
        }
        navigate('/events', { replace: true });
      })();
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
    <div className="min-h-screen victory-hero-bg">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="victory-text-gradient text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Calendar className="h-10 w-10" />
              Special Events
            </div>
            <p className="text-muted-foreground text-lg">
              Discover and book exclusive events at Victory Bistro Ultra Lounge
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : events.length === 0 ? (
            <Card className="luxury-card text-center py-12">
              <CardContent>
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No Events Available</h3>
                <p className="text-muted-foreground">
                  Check back soon for upcoming special events and experiences.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <Card key={event.id} className="luxury-card group hover:scale-105 victory-transition overflow-hidden">
                  {event.featured_image_url && (
                    <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${event.featured_image_url})` }} />
                  )}
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {event.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    
                    {event.description && (
                      <p className="text-muted-foreground text-sm">
                        {event.description}
                      </p>
                    )}

                    <Button 
                      onClick={() => handleBookEvent(event.id)}
                      className="luxury-button w-full"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Book Event
                    </Button>
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

          {/* Info Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location & Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Victory Bistro Ultra Lounge</p>
                  <p className="text-muted-foreground">19800 S Waterloo Rd</p>
                  <p className="text-muted-foreground">Cleveland, OH 44119</p>
                </div>
                <div>
                  <p className="font-medium">Hours</p>
                  <p className="text-muted-foreground">Open Daily 5PM - 2AM</p>
                </div>
              </CardContent>
            </Card>

            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>(216) 938-7778</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>events@victorybistro.com</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Call us for private party bookings and custom event planning.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;