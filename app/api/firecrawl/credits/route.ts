import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the shared Firecrawl API key from environment variables
    const apiKey = process.env.FIRECRAWL_API_KEY?.trim() || null;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {
          remainingCredits: null,
          planCredits: null,
          status: "error",
          error: "FIRECRAWL_API_KEY is not configured",
        },
      });
    }

    // Fetch credit usage from Firecrawl API
    const response = await fetch(`${FIRECRAWL_API_URL}/team/credit-usage`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Firecrawl Credits] API error: ${response.status} - ${errorText}`,
      );

      // If 401/403, the shared key might be invalid
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          success: true,
          data: {
            remainingCredits: null,
            planCredits: null,
            status: "error",
            error: "Shared Firecrawl API key is invalid",
          },
        });
      }

      return NextResponse.json(
        { error: `Failed to fetch credits: ${response.status}` },
        { status: 500 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        remainingCredits: data.data?.remaining_credits ?? null,
        planCredits: data.data?.plan_credits ?? null,
        billingPeriodStart: data.data?.billing_period_start ?? null,
        billingPeriodEnd: data.data?.billing_period_end ?? null,
        status: "active",
      },
    });
  } catch (error) {
    console.error("[Firecrawl Credits] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
