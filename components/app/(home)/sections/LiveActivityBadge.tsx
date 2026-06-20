"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface LiveActivityData {
  activeScouts: number;
  runningExecutions: number;
  recentDiscoveries: number;
  fetchedAt: string;
}

export default function LiveActivityBadge() {
  const [data, setData] = useState<LiveActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [flashText, setFlashText] = useState<string | null>(null);
  const prevData = useRef<LiveActivityData | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/live-activity");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();

      // Detect changes for visual feedback
      if (prevData.current && data) {
        const prev = prevData.current;
        const newFlashMessages: string[] = [];

        if (json.runningExecutions > prev.runningExecutions) {
          newFlashMessages.push("Scout started searching!");
          setPulseKey((k) => k + 1);
        }
        if (json.recentDiscoveries > prev.recentDiscoveries) {
          newFlashMessages.push("New discovery!");
          setPulseKey((k) => k + 1);
        }

        if (newFlashMessages.length > 0) {
          setFlashText(newFlashMessages.join(" "));
          setTimeout(() => setFlashText(null), 3000);
        }
      }

      prevData.current = data;
      setData(json);
      setError(false);
    } catch (err) {
      console.error("[LiveActivityBadge] Failed to fetch:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchActivity();

    // Poll every 10 seconds
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  // Don't show anything while loading or if there's an error
  if (loading || error || !data) {
    return null;
  }

  // Don't show if there's no activity at all
  if (
    data.activeScouts === 0 &&
    data.runningExecutions === 0 &&
    data.recentDiscoveries === 0
  ) {
    return null;
  }

  const parts: string[] = [];

  if (data.runningExecutions > 0) {
    parts.push(
      `${data.runningExecutions} scout${data.runningExecutions === 1 ? "" : "s"} searching`,
    );
  } else if (data.activeScouts > 0) {
    parts.push(
      `${data.activeScouts} active scout${data.activeScouts === 1 ? "" : "s"}`,
    );
  }

  if (data.recentDiscoveries > 0) {
    parts.push(
      `${data.recentDiscoveries} ${data.recentDiscoveries === 1 ? "discovery" : "discoveries"} today`,
    );
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center mb-8 gap-8">
      <AnimatePresence>
        {flashText && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="px-12 py-4 rounded-full bg-accent-forest/10 border border-accent-forest/20 text-label-small text-accent-forest"
          >
            {flashText}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={pulseKey}
        className="inline-flex items-center gap-8 px-16 py-8 rounded-full bg-black-alpha-4 border border-border-faint"
        animate={pulseKey > 0 ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        <span className="relative flex h-8 w-8">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-accent-forest opacity-75"
            animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative inline-flex rounded-full h-8 w-8 bg-accent-forest" />
        </span>
        <span className="text-label-small text-black-alpha-72">
          {parts.join(" \u00B7 ")}
        </span>
      </motion.div>
    </div>
  );
}
