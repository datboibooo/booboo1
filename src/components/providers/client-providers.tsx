"use client";

import * as React from "react";
import { ToastProvider, useToast, setGlobalToast } from "@/components/ui/toast";

function ToastInitializer() {
  const { addToast } = useToast();

  React.useEffect(() => {
    setGlobalToast(addToast);
  }, [addToast]);

  return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ToastInitializer />
      {children}
    </ToastProvider>
  );
}
