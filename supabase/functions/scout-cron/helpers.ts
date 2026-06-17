// Database helper functions

import type { Scout } from "./types.ts";

// Helper to check if a scout should run based on frequency and last_run_at
export function shouldRunScout(scout: Scout): boolean {
  // Check if scout is complete by verifying required fields
  const isComplete =
    scout.title &&
    scout.goal &&
    scout.description &&
    scout.location &&
    scout.search_queries?.length > 0 &&
    scout.frequency;

  if (!scout.is_active || !isComplete || !scout.frequency) {
    return false;
  }

  if (!scout.last_run_at) {
    return true; // Never run before
  }

  const lastRun = new Date(scout.last_run_at);
  const now = new Date();
  const hoursSinceLastRun =
    (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

  switch (scout.frequency) {
    case "daily":
      return hoursSinceLastRun >= 24;
    case "every_3_days":
      return hoursSinceLastRun >= 72;
    case "weekly":
      return hoursSinceLastRun >= 168;
    default:
      return false;
  }
}

// Helper to retry database operations
async function retryDbOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 2,
): Promise<T | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 0) {
        console.log(`${operationName} succeeded on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error: any) {
      console.error(
        `${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
        error.message,
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1)),
        );
      }
    }
  }
  console.error(
    `${operationName} failed after ${maxRetries + 1} attempts - continuing execution`,
  );
  return null;
}

// Create a new execution step
export async function createStep(
  supabase: any,
  executionId: string,
  stepNumber: number,
  stepData: any,
) {
  await retryDbOperation(async () => {
    const { error } = await supabase.from("scout_execution_steps").insert({
      execution_id: executionId,
      step_number: stepNumber,
      ...stepData,
    });
    if (error) throw error;
    return true;
  }, `createStep (execution: ${executionId}, step: ${stepNumber})`);
}

// Update an existing execution step
export async function updateStep(
  supabase: any,
  executionId: string,
  stepNumber: number,
  updates: any,
) {
  await retryDbOperation(
    async () => {
      const { error } = await supabase
        .from("scout_execution_steps")
        .update({
          ...updates,
          completed_at: new Date().toISOString(),
        })
        .eq("execution_id", executionId)
        .eq("step_number", stepNumber);
      if (error) throw error;
      return true;
    },
    `updateStep (execution: ${executionId}, step: ${stepNumber}, status: ${updates.status || "unknown"})`,
  );
}

/**
 * Logs Firecrawl usage for monitoring purposes.
 */
export async function logFirecrawlUsage(
  supabase: any,
  params: {
    userId: string;
    scoutId: string;
    executionId: string;
    apiCallsCount?: number;
  },
): Promise<void> {
  try {
    await supabase.from("firecrawl_usage_logs").insert({
      user_id: params.userId,
      scout_id: params.scoutId,
      execution_id: params.executionId,
      used_fallback: false,
      fallback_reason: null,
      api_calls_count: params.apiCallsCount || 1,
    });
  } catch (error: any) {
    // Don't fail the main operation if logging fails
    console.error("[Firecrawl] Failed to log usage:", error.message);
  }
}
