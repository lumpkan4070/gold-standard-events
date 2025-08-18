import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  title: string;
  message: string;
  targetUsers?: string[]; // If empty, send to all users
  notificationType: 'general' | 'offer' | 'event' | 'fomo';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const data: PushNotificationRequest = await req.json();
    
    console.log("Creating push notification:", data);

    // Store the notification in the database
    const { data: notificationData, error: insertError } = await supabaseClient
      .from('notifications')
      .insert({
        title: data.title,
        message: data.message,
        recipient_count: data.targetUsers?.length || 0
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log("Push notification stored successfully:", notificationData);
    
    // Send notification via OneSignal
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    const oneSignalRestApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (oneSignalAppId && oneSignalRestApiKey) {
      try {
        const oneSignalPayload = {
          app_id: oneSignalAppId,
          included_segments: data.targetUsers ? [] : ["All"],
          include_external_user_ids: data.targetUsers || undefined,
          headings: { "en": data.title },
          contents: { "en": data.message },
          data: { 
            notification_type: data.notificationType,
            timestamp: new Date().toISOString()
          }
        };

        console.log("Sending OneSignal notification:", oneSignalPayload);

        const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${oneSignalRestApiKey}`
          },
          body: JSON.stringify(oneSignalPayload)
        });

        const oneSignalResult = await oneSignalResponse.json();
        
        if (oneSignalResponse.ok) {
          console.log("OneSignal notification sent successfully:", oneSignalResult);
        } else {
          console.error("OneSignal error:", oneSignalResult);
        }
      } catch (oneSignalError) {
        console.error("Error sending OneSignal notification:", oneSignalError);
      }
    } else {
      console.warn("OneSignal credentials not found - notification not sent to devices");
    }

    // Track analytics
    await supabaseClient
      .from('analytics')
      .insert({
        event_type: 'push_notification_sent',
        event_data: {
          notification_id: notificationData.id,
          title: data.title,
          type: data.notificationType,
          target_users: data.targetUsers?.length || 'all'
        }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      notificationId: notificationData.id,
      message: "Push notification sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);