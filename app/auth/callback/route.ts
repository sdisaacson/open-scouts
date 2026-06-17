import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/";
  const next = searchParams.get("next") || redirectTo;
  const pendingQuery = searchParams.get("pendingQuery") || "";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id && user?.email) {
        try {
          // PostHog: Identify user and track Google OAuth login on server side
          const posthog = getPostHogClient();

          if (posthog) {
            posthog.identify({
              distinctId: user.id,
              properties: {
                email: user.email,
              },
            });

            posthog.capture({
              distinctId: user.id,
              event: "user_logged_in",
              properties: {
                method: "google",
                email: user.email,
              },
            });

            await posthog.shutdown();
          }
        } catch (err) {
          console.error(
            "[Auth Callback] Error in side effects (PostHog):",
            err,
          );
          // Continue with redirect even if side effects fail
        }
      }

      // If there's a pending query, redirect to home to process it
      if (pendingQuery) {
        return NextResponse.redirect(
          `${origin}/?pendingQuery=${encodeURIComponent(pendingQuery)}`,
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
