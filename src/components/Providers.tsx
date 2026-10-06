"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useCartStore } from "@/lib/cartStore";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
