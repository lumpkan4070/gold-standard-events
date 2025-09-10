import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Calendar, MessageCircle, Star, Clock, Phone, Dice1, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-chef.jpg";

import UserEngagement from "@/components/UserEngagement";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

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
      <section className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center sm:bg-top md:bg-center bg-no-repeat transition-all duration-300"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/50 sm:bg-black/40 md:bg-black/60" />
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <img 
              src="/lovable-uploads/2930c757-25ee-4b41-9028-6fae31095547.png" 
              alt="Victory Bistro Ultra Lounge" 
              className="w-48 sm:w-64 md:w-80 lg:w-96 h-auto mb-4 drop-shadow-2xl animate-fade-in"
            />
          </div>
          
          {/* Dynamic Greeting */}
          <div className="text-white text-xl sm:text-2xl md:text-3xl font-medium mb-8 sm:mb-12">
            {greeting} at Victory Bistro Ultra Lounge
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto mb-8 sm:mb-16">
            <Button 
              onClick={() => {
                const overlay = document.createElement('div');
                overlay.className = 'fixed inset-0 bg-black/80 z-[99999] flex flex-col items-center justify-center animate-fade-in';
                overlay.innerHTML = `
                  <div class="flex flex-col items-center space-y-6 animate-scale-in">
                    <img src="/lovable-uploads/361a8a1f-b2f4-41fc-8c31-26771715440b.png" alt="Victory Logo" class="w-32 h-32 object-contain animate-pulse" />
                    <div class="text-white text-xl font-semibold">Ordering Victory Bistro</div>
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                `;
                document.body.appendChild(overlay);
                setTimeout(() => {
                  window.open('https://victorybistro.gimmegrub.com', '_blank');
                  document.body.removeChild(overlay);
                }, 1200);
              }}
              className="luxury-button w-full h-14 sm:h-16 text-base sm:text-lg"
            >
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Order Now
            </Button>
            <Link to="/events">
              <Button variant="outline" className="w-full h-14 sm:h-16 text-base sm:text-lg bg-white/10 border-white/30 hover:bg-white/20 text-white backdrop-blur-sm">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

            {/* Games - NEW! */}
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
                  <h3 className="text-xl font-semibold text-foreground">Victory Games</h3>
                  <p className="text-muted-foreground">
                    Break the ice with fun interactive games and earn Victory Points!
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

    </div>
  );
};

export default Index;
