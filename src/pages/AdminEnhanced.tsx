import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
import { Loader2, Users, Shield, UserPlus, Calendar, MessageSquare, CheckCircle, XCircle, Send, Eye, BarChart3, Gift, Star, Zap, Image as ImageIcon, Bell } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminEnhanced = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [photoWall, setPhotoWall] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [pushNotification, setPushNotification] = useState({
    title: "",
    message: "",
    type: "general" as "general" | "offer" | "event" | "fomo"
  });
  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    offer_type: "exclusive",
    discount_percentage: 0,
    valid_until: ""
  });
  
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
      // Load users with profiles
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

      // Load offers
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false });
      setOffers(offersData || []);

      // Load photo wall
      const { data: photoData } = await supabase
        .from("photo_wall")
        .select("*")
        .order("created_at", { ascending: false });
      setPhotoWall(photoData || []);

      // Load analytics
      const { data: analyticsData } = await supabase
        .from("analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setAnalytics(analyticsData || []);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
  };

  const handleApproveBooking = async (booking: any) => {
    try {
      const { error } = await supabase
        .from("event_bookings")
        .update({ 
          status: "approved",
          admin_notes: adminNotes,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Send email notification
      await supabase.functions.invoke('send-booking-notification', {
        body: {
          bookingId: booking.id,
          status: 'approved',
          customerEmail: booking.email,
          customerName: booking.name,
          eventTitle: booking.event_title || 'Special Event',
          eventDate: booking.event_date,
          adminNotes: adminNotes
        }
      });

      toast({
        title: "Booking Approved",
        description: "Booking approved and customer notified via email."
      });

      setSelectedBooking(null);
      setAdminNotes("");
      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve booking",
        variant: "destructive"
      });
    }
  };

  const handleRejectBooking = async (booking: any) => {
    try {
      const { error } = await supabase
        .from("event_bookings")
        .update({ 
          status: "rejected",
          admin_notes: adminNotes,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Send email notification
      await supabase.functions.invoke('send-booking-notification', {
        body: {
          bookingId: booking.id,
          status: 'rejected',
          customerEmail: booking.email,
          customerName: booking.name,
          eventTitle: booking.event_title || 'Special Event',
          eventDate: booking.event_date,
          adminNotes: adminNotes
        }
      });

      toast({
        title: "Booking Rejected",
        description: "Booking rejected and customer notified via email."
      });

      setSelectedBooking(null);
      setAdminNotes("");
      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject booking",
        variant: "destructive"
      });
    }
  };

  const handleSendPushNotification = async () => {
    if (!pushNotification.title.trim() || !pushNotification.message.trim()) {
      toast({
        title: "Invalid Notification",
        description: "Please fill in both title and message.",
        variant: "destructive"
      });
      return;
    }

    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          title: pushNotification.title,
          message: pushNotification.message,
          targetUsers: selectedUsers.length > 0 ? selectedUsers : undefined,
          notificationType: pushNotification.type
        }
      });

      toast({
        title: "Notification Sent",
        description: `Push notification sent successfully.`
      });

      setPushNotification({ title: "", message: "", type: "general" });
      setSelectedUsers([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive"
      });
    }
  };

  const handleCreateOffer = async () => {
    if (!newOffer.title.trim() || !newOffer.description.trim()) {
      toast({
        title: "Invalid Offer",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("offers")
        .insert({
          title: newOffer.title,
          description: newOffer.description,
          offer_type: newOffer.offer_type,
          discount_percentage: newOffer.discount_percentage,
          valid_until: newOffer.valid_until ? new Date(newOffer.valid_until).toISOString() : null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Offer Created",
        description: "New offer created successfully."
      });

      setNewOffer({
        title: "",
        description: "",
        offer_type: "exclusive",
        discount_percentage: 0,
        valid_until: ""
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create offer",
        variant: "destructive"
      });
    }
  };

  const handleApprovePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from("photo_wall")
        .update({ is_approved: true, approved_by: user.id, approved_at: new Date().toISOString() })
        .eq("id", photoId);

      if (error) throw error;

      toast({
        title: "Photo Approved",
        description: "Photo approved and is now visible to users."
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve photo",
        variant: "destructive"
      });
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="victory-text-gradient text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Shield className="h-10 w-10" />
              Victory Bistro Admin Dashboard
            </div>
            <p className="text-muted-foreground text-lg">
              Complete management system for Victory Bistro Ultra Lounge
            </p>
          </div>

          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-secondary/50 mb-8">
              <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="offers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Gift className="h-4 w-4 mr-2" />
                Offers
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ImageIcon className="h-4 w-4 mr-2" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Bell className="h-4 w-4 mr-2" />
                Notify
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Bookings Tab */}
            <TabsContent value="bookings">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Bookings Management ({bookings.length})
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
                            <TableHead>Customer</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Guests</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{booking.name}</p>
                                  <p className="text-sm text-muted-foreground">{booking.email}</p>
                                  <p className="text-sm text-muted-foreground">{booking.phone}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{booking.event_title || 'Special Event'}</p>
                                  {booking.special_requests && (
                                    <p className="text-sm text-muted-foreground">
                                      Requests: {booking.special_requests.substring(0, 50)}...
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(booking.event_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{booking.number_of_guests}</TableCell>
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
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedBooking(booking)}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl luxury-card">
                                      <DialogHeader>
                                        <DialogTitle>Booking Details</DialogTitle>
                                      </DialogHeader>
                                      {selectedBooking && (
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label>Customer Name</Label>
                                              <p className="font-medium">{selectedBooking.name}</p>
                                            </div>
                                            <div>
                                              <Label>Email</Label>
                                              <p className="font-medium">{selectedBooking.email}</p>
                                            </div>
                                            <div>
                                              <Label>Phone</Label>
                                              <p className="font-medium">{selectedBooking.phone}</p>
                                            </div>
                                            <div>
                                              <Label>Number of Guests</Label>
                                              <p className="font-medium">{selectedBooking.number_of_guests}</p>
                                            </div>
                                          </div>
                                          
                                          {selectedBooking.event_image_url && (
                                            <div>
                                              <Label>Event Image</Label>
                                              <img 
                                                src={selectedBooking.event_image_url} 
                                                alt="Event" 
                                                className="w-full h-48 object-cover rounded-lg mt-2"
                                              />
                                            </div>
                                          )}
                                          
                                          {selectedBooking.special_requests && (
                                            <div>
                                              <Label>Special Requests</Label>
                                              <p className="mt-1 p-3 bg-muted rounded-lg">{selectedBooking.special_requests}</p>
                                            </div>
                                          )}
                                          
                                          <div>
                                            <Label>Admin Notes</Label>
                                            <Textarea
                                              value={adminNotes}
                                              onChange={(e) => setAdminNotes(e.target.value)}
                                              placeholder="Add notes for the customer..."
                                              className="mt-1"
                                            />
                                          </div>
                                          
                                          {selectedBooking.status === 'pending' && (
                                            <div className="flex gap-2 pt-4">
                                              <Button
                                                onClick={() => handleApproveBooking(selectedBooking)}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                              >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve & Notify
                                              </Button>
                                              <Button
                                                onClick={() => handleRejectBooking(selectedBooking)}
                                                variant="destructive"
                                              >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject & Notify
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                </div>
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

            {/* Users Tab */}
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
                            <TableHead>VIP Status</TableHead>
                            <TableHead>Total Bookings</TableHead>
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
                                <div className="flex items-center gap-2">
                                  {user.first_name} {user.last_name}
                                  {user.vip_status && <Star className="h-4 w-4 text-primary" />}
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.vip_status ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {user.vip_status ? 'VIP' : 'Regular'}
                                </span>
                              </TableCell>
                              <TableCell>{user.total_bookings || 0}</TableCell>
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

            {/* Offers Tab */}
            <TabsContent value="offers">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="luxury-card">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Create New Offer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Offer Title</Label>
                      <Input
                        value={newOffer.title}
                        onChange={(e) => setNewOffer(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., VIP Happy Hour Special"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newOffer.description}
                        onChange={(e) => setNewOffer(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the offer..."
                      />
                    </div>
                    <div>
                      <Label>Offer Type</Label>
                      <Select
                        value={newOffer.offer_type}
                        onValueChange={(value) => setNewOffer(prev => ({ ...prev, offer_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exclusive">Exclusive App Offer</SelectItem>
                          <SelectItem value="vip">VIP Only</SelectItem>
                          <SelectItem value="birthday">Birthday Special</SelectItem>
                          <SelectItem value="surprise">Surprise Drop</SelectItem>
                          <SelectItem value="general">General Offer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Discount Percentage</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={newOffer.discount_percentage}
                        onChange={(e) => setNewOffer(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Valid Until (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={newOffer.valid_until}
                        onChange={(e) => setNewOffer(prev => ({ ...prev, valid_until: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleCreateOffer} className="luxury-button w-full">
                      <Gift className="h-4 w-4 mr-2" />
                      Create Offer
                    </Button>
                  </CardContent>
                </Card>

                <Card className="luxury-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Active Offers ({offers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {offers.map((offer) => (
                        <div key={offer.id} className="p-4 border border-primary/20 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{offer.title}</h4>
                              <p className="text-sm text-muted-foreground">{offer.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-primary font-medium">{offer.discount_percentage}% OFF</span>
                                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                  {offer.offer_type}
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              {offer.current_uses || 0} uses
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Photo Wall Tab */}
            <TabsContent value="photos">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Photo Wall Management ({photoWall.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photoWall.map((photo) => (
                      <div key={photo.id} className="border border-primary/20 rounded-lg overflow-hidden">
                        <img
                          src={photo.image_url}
                          alt={photo.caption || "User photo"}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-3">
                          <p className="text-sm font-medium">{photo.caption}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              photo.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {photo.is_approved ? 'Approved' : 'Pending'}
                            </span>
                            {!photo.is_approved && (
                              <Button
                                size="sm"
                                onClick={() => handleApprovePhoto(photo.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Approve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Push Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Send Push Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Notification Title</Label>
                    <Input
                      value={pushNotification.title}
                      onChange={(e) => setPushNotification(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Special Event Tonight!"
                    />
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={pushNotification.message}
                      onChange={(e) => setPushNotification(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Your notification message..."
                    />
                  </div>
                  <div>
                    <Label>Notification Type</Label>
                    <Select
                      value={pushNotification.type}
                      onValueChange={(value: any) => setPushNotification(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Announcement</SelectItem>
                        <SelectItem value="offer">Special Offer</SelectItem>
                        <SelectItem value="event">Event Alert</SelectItem>
                        <SelectItem value="fomo">FOMO Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Target Audience:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUsers.length === 0 
                        ? "All users will receive this notification" 
                        : `${selectedUsers.length} selected users will receive this notification`}
                    </p>
                  </div>
                  <Button onClick={handleSendPushNotification} className="luxury-button w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="luxury-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{users.length}</p>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="luxury-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{bookings.length}</p>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="luxury-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Gift className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{offers.length}</p>
                        <p className="text-sm text-muted-foreground">Active Offers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="luxury-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{users.filter(u => u.vip_status).length}</p>
                        <p className="text-sm text-muted-foreground">VIP Members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analytics.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-2 border-b border-primary/10">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">{activity.event_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminEnhanced;