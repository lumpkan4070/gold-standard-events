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
  console.log("Index component rendering...");
  
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
    <div className="min-h-screen" style={{ backgroundColor: 'black', color: 'white' }}>
      <p style={{ padding: '20px', fontSize: '18px' }}>Index component loaded successfully!</p>
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

      {/* Quick Actions - Simplified for debugging */}
      <section className="px-4 pb-16" style={{ backgroundColor: 'black' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 victory-text-gradient">
            Experience Victory
          </h2>
          <p style={{ color: 'white', textAlign: 'center' }}>Content loading...</p>
        </div>
      </section>

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
