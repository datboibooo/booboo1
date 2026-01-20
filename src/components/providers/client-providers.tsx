"use client";

import * as React from "react";
import { ToastProvider, useToast, setGlobalToast } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/supabase/auth-context";

function ToastInitializer() {
  const { addToast } = useToast();

  React.useEffect(() => {
    setGlobalToast(addToast);
  }, [addToast]);

  return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ToastInitializer />
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
