import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Count active scouts (is_active = true)
    const { count: activeScouts, error: activeError } = await supabaseServer
      .from("scouts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (activeError) {
      console.error("[live-activity] Error counting active scouts:", activeError);
    }

    // Count running executions
    const { count: runningExecutions, error: runningError } = await supabaseServer
      .from("scout_executions")
      .select("*", { count: "exact", head: true })
      .eq("status", "running");

    if (runningError) {
      console.error("[live-activity] Error counting running executions:", runningError);
    }

    // Count recent discoveries (executions with summaries in last 24h)
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const { count: recentDiscoveries, error: recentError } = await supabaseServer
      .from("scout_executions")
      .select("*", { count: "exact", head: true })
      .not("summary_text", "is", null)
      .gte("created_at", twentyFourHoursAgo);

    if (recentError) {
      console.error("[live-activity] Error counting recent discoveries:", recentError);
    }

    return NextResponse.json({
      activeScouts: activeScouts || 0,
      runningExecutions: runningExecutions || 0,
      recentDiscoveries: recentDiscoveries || 0,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[live-activity] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
