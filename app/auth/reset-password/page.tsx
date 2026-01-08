"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/shared/button/Button";
import { Lock, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage("Password updated successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-16 py-48">
      <div
        className="w-full max-w-400 bg-accent-white rounded-16 p-32"
        style={{
          boxShadow:
            "0px 0px 44px 0px rgba(0, 0, 0, 0.02), 0px 88px 56px -20px rgba(0, 0, 0, 0.03), 0px 56px 56px -20px rgba(0, 0, 0, 0.02), 0px 32px 32px -20px rgba(0, 0, 0, 0.03), 0px 16px 24px -12px rgba(0, 0, 0, 0.03), 0px 0px 0px 1px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="text-center mb-32">
          <h1 className="text-title-h4 text-accent-black mb-8">
            Set new password
          </h1>
          <p className="text-body-medium text-black-alpha-56">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-16">
          <div>
            <label className="block text-label-small text-black-alpha-56 mb-8">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-12 top-1/2 -translate-y-1/2 w-18 h-18 text-black-alpha-48" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-40 pr-12 py-12 rounded-8 border border-border-muted bg-accent-white text-body-input text-accent-black placeholder:text-black-alpha-48 focus:outline-none focus:ring-2 focus:ring-heat-100/20 focus:border-heat-100"
              />
            </div>
          </div>

          {error && (
            <div className="p-12 rounded-8 bg-accent-crimson/10 border border-accent-crimson/20">
              <p className="text-body-small text-accent-crimson">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-12 rounded-8 bg-accent-forest/10 border border-accent-forest/20">
              <p className="text-body-small text-accent-forest">{message}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-8 px-16 py-8">
                <Loader2 className="w-18 h-18 animate-spin" />
                Updating...
              </div>
            ) : (
              <div className="px-16 py-8">Update Password</div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
