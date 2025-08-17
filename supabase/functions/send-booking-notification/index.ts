import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  bookingId: string;
  status: 'approved' | 'rejected';
  customerEmail: string;
  customerName: string;
  eventTitle: string;
  eventDate: string;
  adminNotes?: string;
  replyTo?: string;
  bcc?: string | string[];
}

const getEmailTemplate = (data: BookingNotificationRequest) => {
  const { status, customerName, eventTitle, eventDate, adminNotes } = data;
  
  if (status === 'approved') {
    return {
      subject: `✅ Event Booking Approved - ${eventTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #9d8343, #a98d49); color: white; border-radius: 16px; overflow: hidden;">
          <div style="padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">Victory Bistro Ultra Lounge</h1>
            <div style="background: rgba(0,0,0,0.8); padding: 30px; border-radius: 12px; margin: 20px 0;">
              <h2 style="margin: 0 0 20px 0; color: #9d8343; font-size: 24px;">🎉 Booking Approved!</h2>
              <p style="margin: 0 0 15px 0; font-size: 18px;">Dear ${customerName},</p>
              <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">
                Great news! Your booking for <strong>${eventTitle}</strong> has been approved.
              </p>
              <div style="background: rgba(157,131,67,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Event:</strong> ${eventTitle}</p>
                <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              ${adminNotes ? `
                <div style="background: rgba(157,131,67,0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; font-style: italic;">Note from our team: ${adminNotes}</p>
                </div>
              ` : ''}
              <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.5;">
                We look forward to seeing you at Victory Bistro Ultra Lounge!
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
  } else {
    return {
      subject: `❌ Event Booking Update - ${eventTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #333, #000); color: white; border-radius: 16px; overflow: hidden;">
          <div style="padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">Victory Bistro Ultra Lounge</h1>
            <div style="background: rgba(0,0,0,0.8); padding: 30px; border-radius: 12px; margin: 20px 0;">
              <h2 style="margin: 0 0 20px 0; color: #ff6b6b; font-size: 24px;">Booking Update</h2>
              <p style="margin: 0 0 15px 0; font-size: 18px;">Dear ${customerName},</p>
              <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">
                Thank you for your interest in <strong>${eventTitle}</strong>. Unfortunately, we are unable to accommodate your booking at this time.
              </p>
              <div style="background: rgba(255,107,107,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Event:</strong> ${eventTitle}</p>
                <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              ${adminNotes ? `
                <div style="background: rgba(255,107,107,0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; font-style: italic;">${adminNotes}</p>
                </div>
              ` : ''}
              <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.5;">
                Please feel free to contact us directly at (216) 938-7778 to discuss alternative options or future events.
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
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingNotificationRequest = await req.json();
    
    console.log("Sending booking notification:", data);

    const emailTemplate = getEmailTemplate(data);

    const emailResponse = await resend.emails.send({
      from: "Victory Bistro Ultra Lounge <support@victorybistro.com>",
      to: [data.customerEmail],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      reply_to: data.replyTo ?? "support@victorybistro.com",
      ...(data.bcc ? { bcc: Array.isArray(data.bcc) ? data.bcc : [data.bcc] } : {}),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending booking notification:", error);
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