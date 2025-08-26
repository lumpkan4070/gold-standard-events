import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import CameraScanner from "@/components/CameraScanner";
import { QrCode, ExternalLink, Camera, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Order = () => {
  const [user, setUser] = useState<any>(null);
  const [orderLink, setOrderLink] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
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

  const startQRScanner = () => {
    setShowQRScanner(true);
  };

  const handleQRScannerClose = () => {
    setShowQRScanner(false);
  };

  const handleOrderLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderLink.trim()) {
      // Open the FocusOnline order link
      window.open(orderLink, '_blank');
      toast({
        title: "Order Link Opened",
        description: "Your order link has been opened in a new tab."
      });
    }
  };

  return (
    <div className="min-h-screen victory-hero-bg">
      <Navigation user={user} />
      
      {showQRScanner && (
        <CameraScanner 
          mode="scan" 
          user={user} 
          onClose={handleQRScannerClose}
        />
      )}
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="victory-text-gradient text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <QrCode className="h-10 w-10" />
              Order & Dine
            </div>
            <p className="text-muted-foreground text-lg">
              Scan your table's QR code or enter the order link manually
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* QR Scanner */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  QR Code Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Use your device's camera to scan the QR code at your table for instant ordering.
                </p>
                <Button 
                  onClick={startQRScanner}
                  className="luxury-button w-full"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Start QR Scanner
                </Button>
              </CardContent>
            </Card>

            {/* Manual Link Entry */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Type className="h-5 w-5 text-primary" />
                  Manual Order Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Enter the order link manually if QR scanning is not available.
                </p>
                <Button 
                  onClick={() => setShowManualInput(!showManualInput)}
                  variant="outline"
                  className="w-full border-primary/20 text-primary hover:bg-primary/10"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Enter Link Manually
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Manual Input Form */}
          {showManualInput && (
            <Card className="luxury-card mb-8">
              <CardHeader>
                <CardTitle className="text-foreground">Enter Order Link</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOrderLinkSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderLink">FocusOnline Order Link</Label>
                    <Input
                      id="orderLink"
                      type="url"
                      value={orderLink}
                      onChange={(e) => setOrderLink(e.target.value)}
                      placeholder="https://..."
                      required
                      className="bg-input border-primary/20 focus:border-primary"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="luxury-button w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Order Link
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-foreground">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto victory-gradient rounded-full flex items-center justify-center mb-3">
                    <span className="text-primary-foreground font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Scan or Enter</h3>
                  <p className="text-muted-foreground text-sm">
                    Scan the QR code at your table or enter the order link manually
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto victory-gradient rounded-full flex items-center justify-center mb-3">
                    <span className="text-primary-foreground font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Browse Menu</h3>
                  <p className="text-muted-foreground text-sm">
                    View our full menu with detailed descriptions and prices
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto victory-gradient rounded-full flex items-center justify-center mb-3">
                    <span className="text-primary-foreground font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Order & Enjoy</h3>
                  <p className="text-muted-foreground text-sm">
                    Place your order and enjoy our premium dining experience
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Order;