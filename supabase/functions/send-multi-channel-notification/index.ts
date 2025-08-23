import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MultiChannelNotificationRequest {
  title: string;
  message: string;
  channels: ('push' | 'email' | 'sms')[];
  targetUsers?: string[]; // User IDs for specific users, empty for all
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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const data: MultiChannelNotificationRequest = await req.json();
    
    console.log("Sending multi-channel notification:", data);

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

    let pushSent = false;
    let emailsSent = 0;
    let smsSent = 0;

    // 1. PUSH NOTIFICATIONS
    if (data.channels.includes('push')) {
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
            console.log("Push notifications sent successfully:", oneSignalResult);
            pushSent = true;
          } else {
            console.error("OneSignal error:", oneSignalResult);
          }
        } catch (oneSignalError) {
          console.error("Error sending push notifications:", oneSignalError);
        }
      }
    }

    // 2. EMAIL NOTIFICATIONS
    if (data.channels.includes('email')) {
      try {
        // Get user emails
        let userQuery = supabaseClient.from('profiles').select('email, first_name, last_name');
        
        if (data.targetUsers && data.targetUsers.length > 0) {
          userQuery = userQuery.in('user_id', data.targetUsers);
        }
        
        const { data: users, error: usersError } = await userQuery;
        
        if (usersError) {
          console.error("Error fetching users for email:", usersError);
        } else if (users && users.length > 0) {
          const validUsers = users.filter(user => user.email);
          
          for (const user of validUsers) {
            try {
              const emailTemplate = getEmailTemplate(data, user);
              
              await resend.emails.send({
                from: "Victory Bistro Ultra Lounge <notifications@victorybistro.com>",
                to: [user.email],
                subject: emailTemplate.subject,
                html: emailTemplate.html,
              });
              
              emailsSent++;
            } catch (emailError) {
              console.error(`Failed to send email to ${user.email}:`, emailError);
            }
          }
          
          console.log(`Sent ${emailsSent} emails successfully`);
        }
      } catch (emailError) {
        console.error("Error with email notifications:", emailError);
      }
    }

    // 3. SMS NOTIFICATIONS (using Twilio - requires TWILIO credentials)
    if (data.channels.includes('sms')) {
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          // Get user phone numbers
          let userQuery = supabaseClient.from('profiles').select('phone, first_name');
          
          if (data.targetUsers && data.targetUsers.length > 0) {
            userQuery = userQuery.in('user_id', data.targetUsers);
          }
          
          const { data: users, error: usersError } = await userQuery;
          
          if (usersError) {
            console.error("Error fetching users for SMS:", usersError);
          } else if (users && users.length > 0) {
            const validUsers = users.filter(user => user.phone);
            
            for (const user of validUsers) {
              try {
                const smsMessage = `${data.title}\n\n${data.message}\n\n- Victory Bistro Ultra Lounge`;
                
                const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    From: twilioPhoneNumber,
                    To: user.phone,
                    Body: smsMessage,
                  }),
                });
                
                if (twilioResponse.ok) {
                  smsSent++;
                } else {
                  const error = await twilioResponse.text();
                  console.error(`Failed to send SMS to ${user.phone}:`, error);
                }
              } catch (smsError) {
                console.error(`SMS error for ${user.phone}:`, smsError);
              }
            }
            
            console.log(`Sent ${smsSent} SMS messages successfully`);
          }
        } catch (smsError) {
          console.error("Error with SMS notifications:", smsError);
        }
      } else {
        console.warn("Twilio credentials not configured - SMS notifications skipped");
      }
    }

    // Track analytics
    await supabaseClient
      .from('analytics')
      .insert({
        event_type: 'multi_channel_notification_sent',
        event_data: {
          notification_id: notificationData.id,
          title: data.title,
          type: data.notificationType,
          channels: data.channels,
          push_sent: pushSent,
          emails_sent: emailsSent,
          sms_sent: smsSent,
          target_users: data.targetUsers?.length || 'all'
        }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      notificationId: notificationData.id,
      results: {
        push: pushSent,
        emails: emailsSent,
        sms: smsSent
      },
      message: `Notification sent successfully via ${data.channels.join(', ')}` 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending multi-channel notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

const getEmailTemplate = (data: MultiChannelNotificationRequest, user: any) => {
  const userName = user.first_name ? `${user.first_name}` : 'Valued Customer';
  
  return {
    subject: `🎉 ${data.title} - Victory Bistro Ultra Lounge`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #9d8343, #a98d49); color: white; border-radius: 16px; overflow: hidden;">
        <div style="padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">Victory Bistro Ultra Lounge</h1>
          <div style="background: rgba(0,0,0,0.8); padding: 30px; border-radius: 12px; margin: 20px 0;">
            <h2 style="margin: 0 0 20px 0; color: #9d8343; font-size: 24px;">${data.title}</h2>
            <p style="margin: 0 0 15px 0; font-size: 18px;">Dear ${userName},</p>
            <div style="background: rgba(157,131,67,0.2); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">${data.message}</p>
            </div>
            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.5;">
              Thank you for being part of the Victory Bistro Ultra Lounge family!
            </p>
          </div>
          <div style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
            <p>Victory Bistro Ultra Lounge</p>
            <p>19800 S Waterloo Rd, Cleveland, OH 44119</p>
            <p>(216) 938-7778</p>
          </div>
        </div>
      </div>
    `
  };
};

serve(handler);