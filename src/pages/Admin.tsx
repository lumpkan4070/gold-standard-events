import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
import { Loader2, Users, Shield, UserPlus } from "lucide-react";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);

        // Check if user has admin role
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single();

        if (error || !roleData) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingAdmin(true);

    try {
      // First, find the user by email in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", newAdminEmail)
        .single();

      if (profileError || !profileData) {
        toast({
          title: "User not found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already an admin
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profileData.user_id)
        .eq("role", "admin")
        .single();

      if (existingRole) {
        toast({
          title: "Already an admin",
          description: "This user is already an admin.",
          variant: "destructive",
        });
        return;
      }

      // Add admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profileData.user_id,
          role: "admin"
        });

      if (roleError) {
        throw roleError;
      }

      toast({
        title: "Admin added successfully",
        description: `${newAdminEmail} is now an admin.`,
      });

      setNewAdminEmail("");
    } catch (error: any) {
      toast({
        title: "Error adding admin",
        description: error.message || "An error occurred while adding admin.",
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen victory-hero-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen victory-hero-bg">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="victory-text-gradient text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Shield className="h-10 w-10" />
              Admin Dashboard
            </div>
            <p className="text-muted-foreground text-lg">
              Manage Victory Bistro Ultra Lounge operations
            </p>
          </div>

          <Tabs defaultValue="admins" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 mb-8">
              <TabsTrigger value="admins" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserPlus className="h-4 w-4 mr-2" />
                Manage Admins
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Events
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admins">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Add New Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">User Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="user@example.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        required
                        className="bg-input border-primary/20 focus:border-primary"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the email of an existing user to make them an admin
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={isAddingAdmin}
                      className="luxury-button"
                    >
                      {isAddingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Admin
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Event Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Event management features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Booking Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Booking management features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;