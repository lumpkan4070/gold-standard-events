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

    // In a real implementation, you would integrate with a push notification service
    // like Firebase Cloud Messaging, Apple Push Notification service, or OneSignal
    console.log("Push notification stored successfully:", notificationData);

    // For now, we'll just track analytics
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
      message: "Push notification queued successfully" 
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