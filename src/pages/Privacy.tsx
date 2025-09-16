import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Mail, Phone, MapPin, Download, Trash2, AlertTriangle } from "lucide-react";

const Privacy = () => {
  const [user, setUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleDataExport = async () => {
    if (!user) return;

    try {
      // Fetch user's data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: bookings } = await supabase
        .from("event_bookings")
        .select("*")
        .eq("user_id", user.id);

      const { data: offers } = await supabase
        .from("user_offers")
        .select("*, offers(*)")
        .eq("user_id", user.id);

      const { data: photos } = await supabase
        .from("photo_wall")
        .select("*")
        .eq("user_id", user.id);

      const exportData = {
        profile,
        bookings,
        offers,
        photos,
        exported_at: new Date().toISOString()
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `victory-bistro-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded as a JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAccountDeletion = async () => {
    if (!user || !confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete user's data from all tables
      await supabase.from("photo_wall").delete().eq("user_id", user.id);
      await supabase.from("user_offers").delete().eq("user_id", user.id);
      await supabase.from("event_bookings").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      await supabase.from("user_roles").delete().eq("user_id", user.id);

      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "Failed to delete your account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-primary mr-4" />
              <h1 className="text-4xl font-bold victory-text-gradient">Privacy Policy</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-muted-foreground">
              <span>Effective Date: August 15, 2025</span>
              <span>•</span>
              <span>Last Updated: August 15, 2025</span>
            </div>
          </div>

          {/* Privacy Controls for Authenticated Users */}
          {user && (
            <Card className="luxury-card mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  Your Privacy Controls
                </CardTitle>
                <CardDescription>
                  Manage your personal data and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleDataExport}
                    variant="outline"
                    className="flex items-center border-primary/20 hover:bg-primary/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export My Data
                  </Button>
                  <Button
                    onClick={handleAccountDeletion}
                    disabled={isDeleting}
                    variant="destructive"
                    className="flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You can update your marketing preferences and opt out of communications in your Profile settings.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Privacy Policy Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <Card className="luxury-card">
              <CardContent className="pt-6">
                <p className="text-foreground/90 leading-relaxed">
                  Victory Bistro Ultra Lounge ("we," "our," or "us") values your privacy. This Privacy Policy explains how we collect, use, share, and protect your information when you use our mobile application (the "App") and related services. By using the App, you agree to the practices described in this policy.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">A. Information You Provide</h4>
                  <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                    <li><strong>Account Information:</strong> Name, email address, phone number, birthday, and anniversary.</li>
                    <li><strong>Event Booking Details:</strong> Event title, date/time, guest count, special requests, and any images you upload.</li>
                    <li><strong>Profile Preferences:</strong> Settings you choose within the App (e.g., VIP status preferences).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">B. Information Collected Automatically</h4>
                  <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                    <li>Device information (model, operating system, browser type)</li>
                    <li>IP address and approximate location</li>
                    <li>Usage data (pages visited, features used)</li>
                    <li>Date and time of access</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">C. Information from Third Parties</h4>
                  <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4">
                    <li><strong>FocusOnline:</strong> For QR-based ordering services.</li>
                    <li><strong>Resend API:</strong> For sending transactional and promotional emails.</li>
                    <li>Analytics services that track user behavior in the App.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">2. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Provide and improve our App services</li>
                  <li>Process event bookings and send confirmation/updates</li>
                  <li>Send push notifications, emails, and special offers</li>
                  <li>Personalize your experience</li>
                  <li>Respond to inquiries and support requests</li>
                  <li>Monitor and analyze usage to enhance performance</li>
                  <li>Enforce our Terms of Service and prevent fraud</li>
                </ul>
              </CardContent>
            </Card>

            {/* Sharing Your Information */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">3. Sharing Your Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 mb-4">
                  We do not sell your personal information. We may share your data with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li><strong>Service Providers:</strong> Such as FocusOnline, email providers, and analytics tools, to operate the App.</li>
                  <li><strong>Legal Authorities:</strong> If required by law or to protect our rights.</li>
                  <li><strong>Event Partners:</strong> If you book a third-party-hosted event at Victory Bistro Ultra Lounge.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">4. Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">
                  We retain your information only as long as necessary to provide our services, comply with legal obligations, and resolve disputes. You may request deletion of your account and personal data at any time using the controls above or by contacting us.
                </p>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">5. Data Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 mb-4">
                  We implement industry-standard security measures, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li>Role-Based Access Controls (admin/user)</li>
                  <li>Row Level Security (RLS) in our database</li>
                  <li>Encrypted communications via HTTPS</li>
                </ul>
                <p className="text-foreground/90 mt-4">
                  However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
                </p>
              </CardContent>
            </Card>

            {/* Your Choices */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">6. Your Choices</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-foreground/90">
                  <li><strong>Profile Updates:</strong> You can update your account information in the App.</li>
                  <li><strong>Marketing Communications:</strong> You can opt out of promotional emails or push notifications in your settings.</li>
                  <li><strong>Account Deletion:</strong> Use the controls above or contact us to request account deletion.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">7. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">
                  The App is not intended for children under 13. We do not knowingly collect personal information from children under 13.
                </p>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">8. Your Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 mb-4">
                  Depending on your location, you may have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground/90 mb-4">
                  <li>Access the personal information we hold about you</li>
                  <li>Request corrections or updates</li>
                  <li>Request deletion of your data</li>
                  <li>Object to certain uses of your information</li>
                </ul>
                <p className="text-foreground/90">
                  To exercise these rights, use the controls above or contact us using the information below.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">9. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90">
                  We may update this Privacy Policy from time to time. We will post the updated version in the App and update the "Last Updated" date above.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-primary">10. Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-foreground/90">
                    If you have questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground">Address</h4>
                        <p className="text-foreground/80 text-sm">
                          Victory Bistro Ultra Lounge<br />
                          19800 S Waterloo Rd<br />
                          Cleveland, OH 44119
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground">Phone</h4>
                        <p className="text-foreground/80 text-sm">(440) 730-1233</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground">Email</h4>
                        <p className="text-foreground/80 text-sm">support@victorybistro.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;