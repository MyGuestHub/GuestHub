"use client";

import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

export function GuestScrollArea({ children }: { children: React.ReactNode }) {
  return (
    <OverlayScrollbarsComponent
      className="relative z-10 flex-1"
      defer
      options={{
        scrollbars: { theme: "os-theme-light", autoHide: "move", autoHideDelay: 800 },
        overflow: { x: "hidden" },
      }}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}
