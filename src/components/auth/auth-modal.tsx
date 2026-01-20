"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Mail, ArrowRight, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "email" | "sent" | "error";

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [email, setEmail] = React.useState("");
  const [step, setStep] = React.useState<Step>("email");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const { signInWithEmail } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      // Reset state when closed
      setStep("email");
      setEmail("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    const { error } = await signInWithEmail(email);

    if (error) {
      setError(error.message);
      setStep("error");
    } else {
      setStep("sent");
    }

    setIsLoading(false);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-[--background]/95 backdrop-blur-xl border border-[--border] rounded-2xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[--background-secondary] transition-colors"
              >
                <X className="h-4 w-4 text-[--foreground-subtle]" />
              </button>

              <div className="p-8">
                {/* Logo */}
                <div className="flex items-center justify-center mb-6">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[--accent]/20 to-purple-600/20">
                    <Sparkles className="h-8 w-8 text-[--accent]" />
                  </div>
                </div>

                {/* Email step */}
                <AnimatePresence mode="wait">
                  {step === "email" && (
                    <motion.div
                      key="email"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <h2 className="text-xl font-semibold text-center mb-2">
                        Welcome to LeadDrip
                      </h2>
                      <p className="text-sm text-[--foreground-muted] text-center mb-6">
                        Enter your email to sign in or create an account
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[--foreground-subtle]" />
                          <input
                            ref={inputRef}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className={cn(
                              "w-full pl-11 pr-4 py-3 rounded-xl",
                              "bg-[--background-secondary] border border-[--border]",
                              "text-sm outline-none transition-all",
                              "focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20",
                              "placeholder:text-[--foreground-subtle]"
                            )}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!isValidEmail(email) || isLoading}
                          className={cn(
                            "w-full py-3 rounded-xl font-medium text-sm",
                            "flex items-center justify-center gap-2",
                            "bg-[--accent] text-white",
                            "hover:bg-[--accent]/90 transition-all",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Continue with Email
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </form>

                      <p className="mt-6 text-xs text-[--foreground-subtle] text-center">
                        We'll send you a magic link to sign in.
                        <br />
                        No password needed.
                      </p>
                    </motion.div>
                  )}

                  {/* Sent step */}
                  {step === "sent" && (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-center"
                    >
                      <div className="mb-4 inline-flex p-3 rounded-full bg-[--score-excellent]/20">
                        <Check className="h-6 w-6 text-[--score-excellent]" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">Check your email</h2>
                      <p className="text-sm text-[--foreground-muted] mb-6">
                        We sent a magic link to
                        <br />
                        <span className="font-medium text-[--foreground]">{email}</span>
                      </p>
                      <p className="text-xs text-[--foreground-subtle]">
                        Click the link in the email to sign in.
                        <br />
                        You can close this window.
                      </p>

                      <button
                        onClick={() => setStep("email")}
                        className="mt-6 text-sm text-[--accent] hover:underline"
                      >
                        Use a different email
                      </button>
                    </motion.div>
                  )}

                  {/* Error step */}
                  {step === "error" && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-center"
                    >
                      <div className="mb-4 inline-flex p-3 rounded-full bg-[--priority-high]/20">
                        <X className="h-6 w-6 text-[--priority-high]" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                      <p className="text-sm text-[--foreground-muted] mb-6">{error}</p>

                      <button
                        onClick={() => setStep("email")}
                        className="px-6 py-2 rounded-xl bg-[--background-secondary] text-sm font-medium hover:bg-[--background-tertiary] transition-colors"
                      >
                        Try again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-[--background-secondary] border-t border-[--border]">
                <p className="text-xs text-[--foreground-subtle] text-center">
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-[--accent] hover:underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[--accent] hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
