"use client";

import { useEffect } from "react";
import { fixSessionCookiePath } from "@/app/guest/[token]/actions";

export function GuestSessionFixer() {
  useEffect(() => {
    fixSessionCookiePath();
  }, []);
  return null;
}
