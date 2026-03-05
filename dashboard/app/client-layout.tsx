"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { FilterProvider } from "@/lib/filters";
import { ThemeProvider } from "@/lib/theme";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <FilterProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[240px] p-6">{children}</main>
        </div>
      </FilterProvider>
    </ThemeProvider>
  );
}
