import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for user session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const openMap = () => {
    const address = "19800 S Waterloo Rd, Cleveland, OH 44119";
    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    window.open(mapUrl, '_blank');
  };

  return (
    <div className="min-h-screen victory-hero-bg">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="victory-text-gradient text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <MapPin className="h-10 w-10" />
              Contact Us
            </div>
            <p className="text-muted-foreground text-lg">
              Visit us or get in touch - we're here to make your experience unforgettable
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-foreground">Victory Bistro Ultra Lounge</p>
                    <p className="text-muted-foreground">19800 S Waterloo Rd</p>
                    <p className="text-muted-foreground">Cleveland, OH 44119</p>
                  </div>
                  <Button 
                    onClick={openMap}
                    className="luxury-button w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Maps
                  </Button>
                </CardContent>
              </Card>

              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Phone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <a 
                      href="tel:+14407301233" 
                      className="text-foreground hover:text-primary victory-transition"
                    >
                      (440) 730-1233
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary" />
                      <a 
                        href="mailto:events@victorybistro.com" 
                        className="text-foreground hover:text-primary victory-transition"
                      >
                        events@victorybistro.com
                      </a>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      For private events and special bookings
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday - Sunday</span>
                      <span className="text-foreground font-medium">11:00 AM - 1:00 AM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map Placeholder */}
            <div className="space-y-6">
              <Card className="luxury-card h-96">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <MapPin className="h-16 w-16 mx-auto text-primary/50" />
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Find Us</h3>
                      <p className="text-muted-foreground mb-4">
                        Located in the heart of Cleveland
                      </p>
                      <Button 
                        onClick={openMap}
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary/10"
                      >
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Private Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Planning a special celebration? Our ultra lounge provides the perfect 
                    setting for private parties, corporate events, and intimate gatherings.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Services Available:</h4>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      <li>• Private dining rooms</li>
                      <li>• Custom menu planning</li>
                      <li>• Full bar service</li>
                      <li>• Audio/visual equipment</li>
                      <li>• Dedicated event coordinator</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => window.location.href = 'mailto:events@victorybistro.com'}
                    className="luxury-button w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Inquire About Events
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;