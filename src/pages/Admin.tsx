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
import { Loader2, Users, Shield, UserPlus, Calendar, MessageSquare, CheckCircle, XCircle, Send } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
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
        await loadAdminData();
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  const loadAdminData = async () => {
    try {
      // Load users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(usersData || []);

      // Load bookings
      const { data: bookingsData } = await supabase
        .from("event_bookings")
        .select("*")
        .order("created_at", { ascending: false });
      setBookings(bookingsData || []);

      // Load events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("event_bookings")
        .update({ status: "approved" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking Approved",
        description: "The booking has been approved successfully."
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve booking",
        variant: "destructive"
      });
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("event_bookings")
        .update({ status: "rejected" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking Rejected",
        description: "The booking has been rejected."
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject booking",
        variant: "destructive"
      });
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_approved: true })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Event Approved",
        description: "The event has been approved and is now visible to users."
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve event",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || selectedUsers.length === 0) {
      toast({
        title: "Invalid Message",
        description: "Please enter a message and select at least one user.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the notification first
      const { data: notificationData, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          title: "Message from Victory Bistro",
          message: message,
          sent_by: user.id,
          recipient_count: selectedUsers.length
        })
        .select()
        .single();

      if (notificationError) throw notificationError;

      // Create recipient records for each selected user
      const recipientRecords = selectedUsers.map(userId => ({
        notification_id: notificationData.id,
        user_id: userId
      }));

      const { error: recipientError } = await supabase
        .from("notification_recipients")
        .insert(recipientRecords);

      if (recipientError) throw recipientError;

      toast({
        title: "Message Sent",
        description: `Message sent to ${selectedUsers.length} user(s).`
      });

      setMessage("");
      setSelectedUsers([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  };

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

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-secondary/50 mb-8">
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CheckCircle className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="admins" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserPlus className="h-4 w-4 mr-2" />
                Admins
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Registered Users ({users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No users found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Select</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.user_id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers(prev => [...prev, user.user_id]);
                                    } else {
                                      setSelectedUsers(prev => prev.filter(id => id !== user.user_id));
                                    }
                                  }}
                                  className="rounded border-primary/20"
                                />
                              </TableCell>
                              <TableCell>
                                {user.first_name} {user.last_name}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone || "N/A"}</TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Bookings ({bookings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No bookings found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Guests</TableHead>
                            <TableHead>Event Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>{booking.name}</TableCell>
                              <TableCell>{booking.email}</TableCell>
                              <TableCell>{booking.phone}</TableCell>
                              <TableCell>{booking.number_of_guests}</TableCell>
                              <TableCell>
                                {new Date(booking.event_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {booking.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveBooking(booking.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectBooking(booking.id)}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Event Approval ({events.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No events found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">{event.title}</TableCell>
                              <TableCell>
                                {new Date(event.event_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  event.is_approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {event.is_approved ? 'Approved' : 'Pending'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {new Date(event.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {!event.is_approved && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveEvent(event.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Send Message to Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedUsers.length > 0 && (
                    <div className="bg-primary/10 p-3 rounded">
                      <p className="text-sm text-foreground">
                        Selected {selectedUsers.length} user(s)
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message to send to selected users..."
                      className="bg-input border-primary/20 focus:border-primary min-h-[100px]"
                    />
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || selectedUsers.length === 0}
                    className="luxury-button"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message ({selectedUsers.length} recipients)
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Select users from the Users tab to send them messages.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admins">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;