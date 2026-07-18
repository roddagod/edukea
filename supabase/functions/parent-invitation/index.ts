import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  family_id: number;
  school_id: number;
  password?: string;
}

function generatePassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    password += chars[byte % chars.length];
  }
  return password;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: InvitationRequest = await req.json();

    if (!body.email || !body.family_id || !body.school_id) {
      return new Response(
        JSON.stringify({ error: "email, family_id, and school_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the family exists and belongs to the school
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id, name, parent_name, parent_email")
      .eq("id", body.family_id)
      .eq("school_id", body.school_id)
      .single();

    if (familyError || !family) {
      return new Response(
        JSON.stringify({ error: "Family not found in this school" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if a parent profile already exists for this family
    const { data: existingProfile } = await supabase
      .from("parent_profiles")
      .select("id, user_id")
      .eq("family_id", body.family_id)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          error: "A parent account already exists for this family",
          profile_id: existingProfile.id,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a password if not provided
    const password = body.password || generatePassword();

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        family_id: body.family_id,
        school_id: body.school_id,
        family_name: family.parent_name || family.name,
      },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the parent profile
    const { data: profile, error: profileError } = await supabase
      .from("parent_profiles")
      .insert({
        user_id: authData.user.id,
        family_id: body.family_id,
        school_id: body.school_id,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the family's parent_email if not set
    if (!family.parent_email) {
      await supabase
        .from("families")
        .update({ parent_email: body.email })
        .eq("id", body.family_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        profile_id: profile.id,
        email: body.email,
        temporary_password: password,
        family_name: family.parent_name || family.name,
        message: "Parent account created. Share the credentials securely.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
