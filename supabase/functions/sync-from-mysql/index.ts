import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncConfig {
  tables: string[];
  schoolId?: number;
}

const SYNCED_TABLES = [
  "schools",
  "school_years",
  "cycles",
  "levels",
  "classrooms",
  "families",
  "students",
  "student_school_year_loggings",
  "personels",
  "type_paiements",
  "type_students",
  "type_families",
  "classroom_school_fees",
  "classroom_school_fees_by_parts",
  "paiements",
  "student_paiement_by_parts",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mysqlApiUrl = Deno.env.get("MYSQL_API_URL");
    const mysqlApiKey = Deno.env.get("MYSQL_API_KEY");

    if (!mysqlApiUrl || !mysqlApiKey) {
      return new Response(
        JSON.stringify({ error: "MySQL API configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: SyncConfig = await req.json().catch(() => ({ tables: SYNCED_TABLES }));
    const tablesToSync = body.tables?.length ? body.tables : SYNCED_TABLES;

    const results: Record<string, { synced: number; errors: string[] }> = {};

    for (const table of tablesToSync) {
      if (!SYNCED_TABLES.includes(table)) {
        results[table] = { synced: 0, errors: [`Table "${table}" is not in the sync list`] };
        continue;
      }

      try {
        // Fetch data from Edukea v2 MySQL API
        const params = new URLSearchParams();
        if (body.schoolId) params.set("school_id", body.schoolId.toString());

        const response = await fetch(`${mysqlApiUrl}/api/sync/${table}?${params}`, {
          headers: {
            Authorization: `Bearer ${mysqlApiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          results[table] = { synced: 0, errors: [`API returned ${response.status}`] };
          continue;
        }

        const { data: rows } = await response.json();

        if (!rows || rows.length === 0) {
          results[table] = { synced: 0, errors: [] };
          continue;
        }

        // Upsert data into Supabase
        const { error } = await supabase
          .from(table)
          .upsert(rows, { onConflict: "id" });

        if (error) {
          results[table] = { synced: 0, errors: [error.message] };
        } else {
          results[table] = { synced: rows.length, errors: [] };
        }
      } catch (err) {
        results[table] = { synced: 0, errors: [(err as Error).message] };
      }
    }

    const totalSynced = Object.values(results).reduce((sum, r) => sum + r.synced, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0);

    return new Response(
      JSON.stringify({
        success: totalErrors === 0,
        totalSynced,
        totalErrors,
        details: results,
        syncedAt: new Date().toISOString(),
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
