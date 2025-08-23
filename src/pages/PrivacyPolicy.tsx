import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Camera, Bell, Users, Database, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const PrivacyPolicy = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

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
              <Shield className="h-10 w-10" />
              Privacy Policy
            </div>
            <p className="text-muted-foreground text-lg">
              Your privacy is important to us at Victory Bistro Ultra Lounge
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: January 2025
            </p>
          </div>

          <div className="space-y-8">
            {/* Information We Collect */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Account Information</h4>
                  <p className="text-muted-foreground">
                    When you create an account, we collect your name, email address, phone number, and other profile information you choose to provide.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Event and Booking Data</h4>
                  <p className="text-muted-foreground">
                    We collect information about your event bookings, preferences, special requests, and dining history to enhance your experience.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Usage Information</h4>
                  <p className="text-muted-foreground">
                    We collect data about how you use our app, including features accessed, games played, and engagement with our services.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Camera and Photos */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Camera and Photo Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Camera Usage</h4>
                  <p className="text-muted-foreground">
                    We request camera access for two purposes: (1) QR code scanning for table ordering and promotional offers, and (2) photo capture for our Victory Wall feature where guests can share their dining experiences.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Photo Storage</h4>
                  <p className="text-muted-foreground">
                    Photos you choose to share are stored securely and reviewed by our team before appearing on the Victory Wall. You can request removal of your photos at any time.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Permission Control</h4>
                  <p className="text-muted-foreground">
                    Camera access is optional and only requested when you use photo or QR scanning features. You can revoke camera permissions in your device settings at any time.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Notification Types</h4>
                  <p className="text-muted-foreground">
                    We send notifications about event updates, booking confirmations, special offers, and important announcements related to Victory Bistro Ultra Lounge.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Opt-Out Options</h4>
                  <p className="text-muted-foreground">
                    You can disable push notifications in your device settings or through the app settings. Some service-related notifications (like booking confirmations) may still be sent via email.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Use and Sharing */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  How We Use and Share Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Internal Use</h4>
                  <p className="text-muted-foreground">
                    We use your information to provide our services, process bookings, customize your experience, communicate with you, and improve our offerings.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Third-Party Sharing</h4>
                  <p className="text-muted-foreground">
                    We do not sell your personal information. We may share data with service providers (payment processing, cloud hosting, analytics) who help us operate our business under strict confidentiality agreements.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Legal Requirements</h4>
                  <p className="text-muted-foreground">
                    We may disclose information when required by law, to protect our rights, or in connection with a business transaction.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Data Security and Retention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Security Measures</h4>
                  <p className="text-muted-foreground">
                    We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal information.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Retention</h4>
                  <p className="text-muted-foreground">
                    We retain your information for as long as needed to provide our services and comply with legal obligations. You can request account deletion at any time.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Your Privacy Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Access and Correction</h4>
                  <p className="text-muted-foreground">
                    You can access, update, or correct your personal information through your account settings or by contacting us.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Portability</h4>
                  <p className="text-muted-foreground">
                    You can request a copy of your personal data in a machine-readable format.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Deletion</h4>
                  <p className="text-muted-foreground">
                    You can request deletion of your account and personal information, subject to legal retention requirements.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle>Contact Us About Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have questions about this Privacy Policy or your personal information, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Victory Bistro Ultra Lounge</strong></p>
                  <p>19800 S Waterloo Rd, Cleveland, OH 44119</p>
                  <p>Phone: (216) 938-7778</p>
                  <p>Email: privacy@victorybistro.com</p>
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> This Privacy Policy may be updated periodically. Continued use of our services after changes indicates acceptance of the updated policy.
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

export default PrivacyPolicy;