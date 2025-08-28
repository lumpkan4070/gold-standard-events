import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";

import { Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Order = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
              <Utensils className="h-10 w-10" />
              Order & Dine
            </div>
            <p className="text-muted-foreground text-lg">
              Browse our delicious menu and place your order
            </p>
          </div>

          <div className="text-center">
            <Card className="luxury-card max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="w-20 h-20 mx-auto victory-gradient rounded-full flex items-center justify-center">
                  <Utensils className="w-10 h-10 text-primary-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">
                  Our digital ordering system will be available soon! 
                </p>
                <p className="text-foreground">
                  For now, please place your order with our friendly staff at your table.
                </p>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Thank you for your patience as we enhance your dining experience!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;