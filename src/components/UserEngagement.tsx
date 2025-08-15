import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Gift, Star, Zap, Calendar, Image as ImageIcon, Heart, Camera, Trophy } from "lucide-react";

interface UserEngagementProps {
  user: any;
}

const UserEngagement = ({ user }: UserEngagementProps) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [redeemedOffers, setRedeemedOffers] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [photoWall, setPhotoWall] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserEngagementData();
    }
  }, [user]);

  const loadUserEngagementData = async () => {
    try {
      // Load active offers
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .gte("valid_until", new Date().toISOString());
      setOffers(offersData || []);

      // Load user's redeemed offers
      const { data: redeemedData } = await supabase
        .from("user_offers")
        .select("offer_id")
        .eq("user_id", user.id);
      setRedeemedOffers(redeemedData?.map(r => r.offer_id) || []);

      // Load user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setUserProfile(profileData);

      // Load approved photos from photo wall
      const { data: photoData } = await supabase
        .from("photo_wall")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      setPhotoWall(photoData || []);
    } catch (error) {
      console.error("Error loading user engagement data:", error);
    }
  };

  const handleRedeemOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from("user_offers")
        .insert({
          user_id: user.id,
          offer_id: offerId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Redeemed",
            description: "You have already redeemed this offer.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Update offer usage count
      await (supabase.rpc as any)('increment_offer_usage', { offer_id: offerId });

      // Track analytics
      await supabase.from('analytics').insert({
        user_id: user.id,
        event_type: 'offer_redeemed',
        event_data: { offer_id: offerId }
      });

      toast({
        title: "Offer Redeemed!",
        description: "Show this to your server to claim your discount."
      });

      setRedeemedOffers(prev => [...prev, offerId]);
    } catch (error: any) {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem offer",
        variant: "destructive"
      });
    }
  };

  const getOfferIcon = (offerType: string) => {
    switch (offerType) {
      case 'exclusive': return <Zap className="h-5 w-5" />;
      case 'vip': return <Star className="h-5 w-5" />;
      case 'birthday': return <Gift className="h-5 w-5" />;
      case 'surprise': return <Trophy className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  const getOfferTypeColor = (offerType: string) => {
    switch (offerType) {
      case 'exclusive': return 'bg-purple-100 text-purple-800';
      case 'vip': return 'bg-primary/20 text-primary';
      case 'birthday': return 'bg-pink-100 text-pink-800';
      case 'surprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBirthdayOffers = () => {
    if (!userProfile?.birthday) return [];
    
    const today = new Date();
    const birthday = new Date(userProfile.birthday);
    const isBirthdayWeek = Math.abs(today.getTime() - birthday.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    
    return offers.filter(offer => offer.offer_type === 'birthday' && isBirthdayWeek);
  };

  const getVipOffers = () => {
    if (!userProfile?.vip_status) return [];
    return offers.filter(offer => offer.offer_type === 'vip');
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      // Upload to photo-wall bucket (create if doesn't exist)
      const { error: uploadError } = await supabase.storage
        .from('photo-wall')
        .upload(fileName, file);

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes('Bucket not found')) {
          await supabase.storage.createBucket('photo-wall', { public: true });
          // Retry upload
          const { error: retryError } = await supabase.storage
            .from('photo-wall')
            .upload(fileName, file);
          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      const { data } = supabase.storage
        .from('photo-wall')
        .getPublicUrl(fileName);

      // Insert into photo_wall table
      const { error: insertError } = await supabase
        .from('photo_wall')
        .insert({
          user_id: user.id,
          image_url: data.publicUrl,
          caption: 'Victory moment!'
        });

      if (insertError) throw insertError;

      // Track analytics
      await supabase.from('analytics').insert({
        user_id: user.id,
        event_type: 'photo_uploaded',
        event_data: { fileName }
      });

      toast({
        title: "Photo Uploaded!",
        description: "Your photo has been submitted for approval and will appear on the Victory Wall once reviewed."
      });

      // Refresh photo wall data
      loadUserEngagementData();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* VIP Status Card */}
      {userProfile?.vip_status && (
        <Card className="luxury-card border-primary/50 bg-gradient-to-r from-primary/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-xl font-bold text-primary">VIP Member</h3>
                <p className="text-muted-foreground">Enjoy exclusive benefits and early access to events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Birthday Special */}
      {getBirthdayOffers().length > 0 && (
        <Card className="luxury-card border-pink-500/50 bg-gradient-to-r from-pink-500/10 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-600">
              <Gift className="h-6 w-6" />
              🎉 Happy Birthday Week!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Celebrate your special week with exclusive birthday offers!
            </p>
            <div className="grid gap-3">
              {getBirthdayOffers().map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div>
                    <p className="font-medium">{offer.title}</p>
                    <p className="text-sm text-muted-foreground">{offer.description}</p>
                    <Badge className="mt-1 bg-pink-100 text-pink-800">
                      {offer.discount_percentage}% OFF
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleRedeemOffer(offer.id)}
                    disabled={redeemedOffers.includes(offer.id)}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    {redeemedOffers.includes(offer.id) ? 'Redeemed' : 'Claim'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exclusive App Offers */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Exclusive App Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {offers
              .filter(offer => ['exclusive', 'surprise'].includes(offer.offer_type))
              .map((offer) => (
                <div key={offer.id} className="p-4 border border-primary/20 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getOfferIcon(offer.offer_type)}
                      <div>
                        <h4 className="font-semibold">{offer.title}</h4>
                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            {offer.discount_percentage}% OFF
                          </Badge>
                          <Badge className={getOfferTypeColor(offer.offer_type)}>
                            {offer.offer_type === 'surprise' ? 'Surprise Drop!' : 'App Exclusive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRedeemOffer(offer.id)}
                      disabled={redeemedOffers.includes(offer.id)}
                      className="luxury-button"
                    >
                      {redeemedOffers.includes(offer.id) ? 'Redeemed ✓' : 'Redeem'}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* VIP Early Access */}
      {getVipOffers().length > 0 && (
        <Card className="luxury-card border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Star className="h-6 w-6" />
              VIP Early Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getVipOffers().map((offer) => (
                <div key={offer.id} className="p-3 bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{offer.title}</p>
                      <p className="text-sm text-muted-foreground">{offer.description}</p>
                      <Badge className="mt-1 bg-primary/20 text-primary">
                        VIP Only - {offer.discount_percentage}% OFF
                      </Badge>
                    </div>
                    <Button
                      onClick={() => handleRedeemOffer(offer.id)}
                      disabled={redeemedOffers.includes(offer.id)}
                      className="luxury-button"
                    >
                      {redeemedOffers.includes(offer.id) ? 'Redeemed' : 'Claim'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Victory Moments Photo Wall */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Victory Moments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Check out amazing moments from fellow Victory Bistro guests!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photoWall.map((photo) => (
              <div key={photo.id} className="relative group overflow-hidden rounded-lg">
                <img
                  src={photo.image_url}
                  alt={photo.caption || "Victory moment"}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-2 text-white text-xs">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {photo.likes_count || 0}
                    </div>
                  </div>
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Share Your Victory Moment</p>
            <p className="text-xs text-muted-foreground mb-3">
              Upload your photos and they might be featured here!
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    await handlePhotoUpload(file);
                  }
                };
                input.click();
              }}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Experience Showcase */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Your Victory Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{userProfile?.total_bookings || 0}</p>
              <p className="text-sm text-muted-foreground">Events Booked</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Gift className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{redeemedOffers.length}</p>
              <p className="text-sm text-muted-foreground">Offers Redeemed</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{userProfile?.vip_status ? 'VIP' : 'Member'}</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">
                {userProfile?.created_at ? 
                  Math.floor((new Date().getTime() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24)) 
                  : 0}
              </p>
              <p className="text-sm text-muted-foreground">Days Member</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserEngagement;