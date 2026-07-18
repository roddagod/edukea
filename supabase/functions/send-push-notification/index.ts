import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushRequest {
  user_ids?: string[];
  family_ids?: number[];
  title: string;
  body: string;
  data?: Record<string, string>;
  type?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PushRequest = await req.json();

    if (!body.title || !body.body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userIds: string[] = body.user_ids || [];

    // If family_ids provided, resolve to user_ids
    if (body.family_ids && body.family_ids.length > 0) {
      const { data: profiles } = await supabase
        .from("parent_profiles")
        .select("user_id")
        .in("family_id", body.family_ids);

      if (profiles) {
        userIds = [...userIds, ...profiles.map((p) => p.user_id)];
      }
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No target users found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate
    userIds = [...new Set(userIds)];

    // Create in-app notifications
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      type: body.type || "general",
      title: body.title,
      body: body.body,
      is_read: false,
      data: body.data || null,
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      return new Response(
        JSON.stringify({ error: `Failed to create notifications: ${notifError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get push tokens for Expo Push
    const { data: profiles } = await supabase
      .from("parent_profiles")
      .select("user_id, push_token")
      .in("user_id", userIds)
      .not("push_token", "is", null);

    let pushSent = 0;

    if (profiles && profiles.length > 0) {
      const pushTokens = profiles
        .map((p) => p.push_token)
        .filter((token): token is string => !!token && token.startsWith("ExponentPushToken"));

      if (pushTokens.length > 0) {
        // Send via Expo Push API
        const messages = pushTokens.map((token) => ({
          to: token,
          sound: "default",
          title: body.title,
          body: body.body,
          data: body.data || {},
        }));

        const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messages),
        });

        if (pushResponse.ok) {
          pushSent = pushTokens.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: userIds.length,
        pushNotificationsSent: pushSent,
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
