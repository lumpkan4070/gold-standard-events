import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Bot, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Chat = () => {
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

  return (
    <div className="min-h-screen victory-hero-bg">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="victory-text-gradient text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <MessageCircle className="h-10 w-10" />
              VictoryBot
            </div>
            <p className="text-muted-foreground text-lg">
              Your personal dining assistant - coming soon
            </p>
          </div>

          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                VictoryBot Chat Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto victory-gradient rounded-full flex items-center justify-center mb-6">
                  <Bot className="w-12 h-12 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  VictoryBot is Coming Soon!
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Our AI-powered chat assistant will help you with:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="text-left">
                    <h4 className="font-medium text-foreground mb-2">Menu Questions</h4>
                    <p className="text-muted-foreground text-sm">
                      Get detailed information about our dishes, ingredients, and recommendations
                    </p>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-foreground mb-2">Event Information</h4>
                    <p className="text-muted-foreground text-sm">
                      Learn about upcoming events, private party options, and special offers
                    </p>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-foreground mb-2">Reservations</h4>
                    <p className="text-muted-foreground text-sm">
                      Help with booking tables, private rooms, and special arrangements
                    </p>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-foreground mb-2">General Inquiries</h4>
                    <p className="text-muted-foreground text-sm">
                      Hours, location, parking, dress code, and other common questions
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h4 className="font-medium text-foreground">In the Meantime</h4>
                </div>
                <p className="text-muted-foreground">
                  For immediate assistance, please call us at{' '}
                  <a href="tel:+12169387778" className="text-primary hover:underline font-medium">
                    (216) 938-7778
                  </a>{' '}
                  or email us at{' '}
                  <a href="mailto:events@victorybistro.com" className="text-primary hover:underline font-medium">
                    events@victorybistro.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;