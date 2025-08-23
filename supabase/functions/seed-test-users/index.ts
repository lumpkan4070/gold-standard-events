import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SeedBody = {
  userEmail?: string;
  adminEmail?: string;
  password?: string;
};

async function findUserByEmail(adminClient: any, email: string) {
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase());
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json().catch(() => ({}))) as SeedBody;

    const userEmail = body.userEmail || "test@victorybistro.com";
    const adminEmail = body.adminEmail || "test2@victorybistro.com";
    const password = body.password || "Test2268";

    // Ensure regular user
    let user = await findUserByEmail(supabase, userEmail);
    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userEmail,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
    } else {
      await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    }

    // Ensure admin user
    let admin = await findUserByEmail(supabase, adminEmail);
    if (!admin) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      admin = data.user;
    } else {
      await supabase.auth.admin.updateUserById(admin.id, { password, email_confirm: true });
    }

    // Ensure profiles exist (idempotent)
    await supabase.from("profiles").upsert(
      { user_id: user.id, email: user.email },
      { onConflict: "user_id" }
    );
    await supabase.from("profiles").upsert(
      { user_id: admin.id, email: admin.email },
      { onConflict: "user_id" }
    );

    // Grant admin role to admin user (idempotent)
    await supabase.from("user_roles").upsert(
      { user_id: admin.id, role: "admin" },
      { onConflict: "user_id,role" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        users: {
          user: { id: user.id, email: user.email },
          admin: { id: admin.id, email: admin.email },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Seed users error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
