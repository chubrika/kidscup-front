"use client";

import React from "react";
import { LiveProvider } from "@/components/live/LiveProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <LiveProvider>{children}</LiveProvider>;
}

