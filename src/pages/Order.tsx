import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";

import { Utensils, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import victoryMenu from "@/assets/victory-menu.jpg";

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

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Menu Display */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl flex items-center gap-2">
                  <Utensils className="h-6 w-6" />
                  Our Menu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={victoryMenu} 
                  alt="Victory Bistro Menu" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <p className="text-muted-foreground mt-4 text-center">
                  Exquisite dishes crafted with the finest ingredients
                </p>
              </CardContent>
            </Card>

            {/* Payment & Order Info */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-foreground text-2xl flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Order & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-foreground text-lg">
                    Ready to order? Our staff is here to help!
                  </p>
                  <p className="text-muted-foreground">
                    Please place your order with our friendly staff at your table or at the bar.
                  </p>
                </div>
                
                <div className="border-t border-border pt-6">
                  <h3 className="text-foreground text-lg font-semibold mb-4">We Accept</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                      <span className="text-sm">Visa</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-5 bg-gradient-to-r from-red-600 to-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                      <span className="text-sm">Mastercard</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-5 bg-gradient-to-r from-blue-500 to-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">AMEX</div>
                      <span className="text-sm">American Express</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-5 bg-gradient-to-r from-green-600 to-green-800 rounded text-white text-xs flex items-center justify-center font-bold">💵</div>
                      <span className="text-sm">Cash</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-border">
                  <Button className="luxury-button w-full">
                    Call Server for Assistance
                  </Button>
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