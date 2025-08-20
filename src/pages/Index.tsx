import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { QrCode, Calendar, MessageCircle, Star, Clock, Phone, Camera, Scan, Dice1 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-home.jpg";
import CameraScanner from "@/components/CameraScanner";
import UserEngagement from "@/components/UserEngagement";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'scan'>('photo');

  useEffect(() => {
    // Set dynamic greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // Check for user session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Load upcoming events (top 3)
    const loadUpcomingEvents = async () => {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("is_approved", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(3);
      
      setUpcomingEvents(eventsData || []);
    };
    loadUpcomingEvents();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation user={user} />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          {/* Logo */}
          <div className="victory-text-gradient text-6xl md:text-8xl font-bold tracking-wide mb-4">
            Victory
          </div>
          <div className="text-white/80 text-xl md:text-2xl font-light mb-8">
            Bistro Ultra Lounge
          </div>
          
          {/* Dynamic Greeting */}
          <div className="text-white text-2xl md:text-3xl font-medium mb-12">
            {greeting} at Victory Bistro Ultra Lounge
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            <Link to="/order">
              <Button className="luxury-button w-full h-16 text-lg">
                <QrCode className="w-6 h-6 mr-3" />
                Order Now
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" className="w-full h-16 text-lg bg-white/10 border-white/30 hover:bg-white/20 text-white backdrop-blur-sm">
                <Calendar className="w-6 h-6 mr-3" />
                View Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 pb-16 victory-hero-bg">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 victory-text-gradient">
            Experience Victory
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Order */}
            <Card className="luxury-card p-6 text-center group hover:scale-105 victory-transition">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto victory-gradient rounded-full flex items-center justify-center group-hover:victory-glow victory-transition">
                  <QrCode className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Order & Dine</h3>
                <p className="text-muted-foreground">
                  Scan table QR codes for instant ordering through FocusOnline
                </p>
                <Link to="/order">
                  <Button className="luxury-button w-full mt-4">
                    Start Ordering
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Events */}
            <Card className="luxury-card p-6 text-center group hover:scale-105 victory-transition">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto victory-gradient rounded-full flex items-center justify-center group-hover:victory-glow victory-transition">
                  <Calendar className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Special Events</h3>
                <p className="text-muted-foreground">
                  Discover upcoming events and book private parties
                </p>
                <Link to="/events">
                  <Button variant="outline" className="w-full mt-4 border-primary/20 text-primary hover:bg-primary/10">
                    View Events
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* VictoryBot */}
            <Card className="luxury-card p-6 text-center group hover:scale-105 victory-transition">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto victory-gradient rounded-full flex items-center justify-center group-hover:victory-glow victory-transition">
                  <MessageCircle className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">VictoryBot</h3>
                <p className="text-muted-foreground">
                  Get instant answers about menu, events, and reservations
                </p>
                <Link to="/chat">
                  <Button variant="outline" className="w-full mt-4 border-primary/20 text-primary hover:bg-primary/10">
                    Chat Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Truth or Dare Game - NEW! */}
            {user && (
              <Card className="luxury-card p-6 text-center group hover:scale-105 victory-transition border-2 border-primary/30 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <Badge className="bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground animate-pulse">
                    NEW!
                  </Badge>
                </div>
                <CardContent className="space-y-4">
                  <div className="w-16 h-16 mx-auto victory-gradient rounded-full flex items-center justify-center group-hover:victory-glow victory-transition">
                    <Dice1 className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Truth or Dare: Adult Edition</h3>
                  <p className="text-muted-foreground">
                    Break the ice with fun prompts and earn Victory Points!
                  </p>
                  <Link to="/games">
                    <Button className="w-full mt-4 bg-gradient-to-r from-primary to-primary-foreground hover:opacity-90 victory-glow">
                      Play Now 🎲
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Camera Section */}
      <section className="px-4 pb-16 victory-hero-bg">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 victory-text-gradient">
            Victory Camera
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Photo Capture */}
            <Card className="luxury-card p-6 text-center group hover:scale-105 victory-transition">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto victory-gradient rounded-full flex items-center justify-center group-hover:victory-glow victory-transition">
                  <Camera className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Capture Victory Moments</h3>
                <p className="text-muted-foreground">
                  Share your dining experience and get featured on our Victory Wall
                </p>
                <Button 
                  onClick={() => {
                    setCameraMode('photo');
                    setShowCamera(true);
                  }}
                  className="luxury-button w-full mt-4"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </CardContent>
            </Card>

            {/* QR Scanner */}
            <Card className="luxury-card p-6 text-center group hover:scale-105 victory-transition">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto victory-gradient rounded-full flex items-center justify-center group-hover:victory-glow victory-transition">
                  <Scan className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">QR Code Scanner</h3>
                <p className="text-muted-foreground">
                  Scan table codes, promotional offers, and special menu items
                </p>
                <Button 
                  onClick={() => {
                    setCameraMode('scan');
                    setShowCamera(true);
                  }}
                  variant="outline" 
                  className="w-full mt-4 border-primary/20 text-primary hover:bg-primary/10"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Start Scanner
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              No app download required • Works directly in your browser
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      {upcomingEvents.length > 0 && (
        <section className="px-4 pb-16 victory-hero-bg">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 victory-text-gradient">
              Upcoming Events
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="luxury-card group hover:scale-105 victory-transition overflow-hidden">
                  {event.featured_image_url && (
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${event.featured_image_url})` }} />
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2">{event.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {new Date(event.event_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric"
                      })}
                    </p>
                    {event.description && (
                      <p className="text-muted-foreground text-xs line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Link to="/events">
                <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                  View All Events
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* User Engagement Section */}
      {user && (
        <section className="px-4 pb-16 victory-hero-bg">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 victory-text-gradient">
              Your Victory Experience
            </h2>
            <UserEngagement user={user} />
          </div>
        </section>
      )}

      {/* Special Announcement Bar */}
      <section className="px-4 pb-16 victory-hero-bg">
        <div className="max-w-4xl mx-auto">
          <Card className="luxury-card p-8 text-center">
            <CardContent className="space-y-4">
              <Star className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-2xl font-bold victory-text-gradient">
                Special Promotions
              </h3>
              <p className="text-lg text-foreground/80">
                Join our exclusive events and enjoy premium dining experiences
              </p>
              <p className="text-muted-foreground">
                Download our app for exclusive offers and VIP access
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="px-4 pb-8 victory-hero-bg">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Open Daily 5PM - 2AM</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>(216) 938-7778</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            19800 S Waterloo Rd, Cleveland, OH 44119
          </p>
          <div className="victory-text-gradient text-sm font-medium">
            © 2024 Victory Bistro Ultra Lounge. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Camera Scanner Modal */}
      {showCamera && (
        <CameraScanner 
          mode={cameraMode}
          user={user}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default Index;
