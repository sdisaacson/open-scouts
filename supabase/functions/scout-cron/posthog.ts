// PostHog server-side analytics for edge functions — DISABLED
// All tracking functions are no-ops. To re-enable PostHog, restore the
// original implementation from git history.

interface PostHogEvent {
  event: string;
  distinctId: string;
  properties?: Record<string, any>;
}

/**
 * Capture an event to PostHog from the edge function.
 * Currently disabled — returns immediately without sending anything.
 */
export async function captureEvent(_event: PostHogEvent): Promise<void> {
  return;
}

/**
 * Track scout execution started — disabled
 */
export async function trackExecutionStarted(
  _userId: string,
  _scoutId: string,
  _executionId: string,
  _scoutTitle: string,
  _triggerSource: "automatic" | "manual"
): Promise<void> {
  return;
}

/**
 * Track scout execution completed successfully — disabled
 */
export async function trackExecutionCompleted(
  _userId: string,
  _scoutId: string,
  _executionId: string,
  _scoutTitle: string,
  _params: {
    duration_ms: number;
    steps_count: number;
    results_found: boolean;
    is_duplicate: boolean;
    api_calls_count: number;
  }
): Promise<void> {
  return;
}

/**
 * Track scout execution failed — disabled
 */
export async function trackExecutionFailed(
  _userId: string,
  _scoutId: string,
  _executionId: string,
  _scoutTitle: string,
  _errorMessage: string,
  _duration_ms: number
): Promise<void> {
  return;
}

/**
 * Track email notification sent — disabled
 */
export async function trackEmailNotificationSent(
  _userId: string,
  _scoutId: string,
  _executionId: string,
  _scoutTitle: string,
  _success: boolean,
  _errorMessage?: string
): Promise<void> {
  return;
}

/**
 * Track duplicate result detected — disabled
 */
export async function trackDuplicateDetected(
  _userId: string,
  _scoutId: string,
  _executionId: string,
  _scoutTitle: string,
  _similarityScore: number
): Promise<void> {
  return;
}
