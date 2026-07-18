import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ComputeRequest {
  classroom_id: number;
  periode_id: string;
  publish?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ComputeRequest = await req.json();

    if (!body.classroom_id || !body.periode_id) {
      return new Response(
        JSON.stringify({ error: "classroom_id and periode_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the database function to compute bulletins
    const { error: computeError } = await supabase.rpc("compute_bulletin", {
      p_classroom_id: body.classroom_id,
      p_periode_id: body.periode_id,
    });

    if (computeError) {
      return new Response(
        JSON.stringify({ error: computeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optionally publish bulletins
    if (body.publish) {
      const { error: publishError } = await supabase
        .from("bulletins")
        .update({ is_published: true })
        .eq("classroom_id", body.classroom_id)
        .eq("periode_id", body.periode_id);

      if (publishError) {
        return new Response(
          JSON.stringify({ error: `Computed but failed to publish: ${publishError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get summary of computed bulletins
    const { data: bulletins, error: fetchError } = await supabase
      .from("bulletins")
      .select("id, student_id, average, rank, total_students, is_published")
      .eq("classroom_id", body.classroom_id)
      .eq("periode_id", body.periode_id)
      .order("rank");

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: true, message: "Bulletins computed but could not fetch summary" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Notify parents if bulletins were published
    if (body.publish && bulletins && bulletins.length > 0) {
      const studentIds = bulletins.map((b) => b.student_id);

      // Get parent profiles for these students
      const { data: families } = await supabase
        .from("students")
        .select("family_id")
        .in("id", studentIds);

      if (families) {
        const familyIds = [...new Set(families.map((f) => f.family_id))];
        const { data: parentProfiles } = await supabase
          .from("parent_profiles")
          .select("user_id")
          .in("family_id", familyIds);

        if (parentProfiles) {
          // Create notifications for each parent
          const notifications = parentProfiles.map((p) => ({
            user_id: p.user_id,
            type: "bulletin_published",
            title: "Bulletin disponible",
            body: "Le bulletin de votre enfant est maintenant disponible.",
            is_read: false,
            data: {
              classroom_id: body.classroom_id,
              periode_id: body.periode_id,
            },
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        published: body.publish || false,
        bulletinCount: bulletins?.length || 0,
        bulletins,
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
