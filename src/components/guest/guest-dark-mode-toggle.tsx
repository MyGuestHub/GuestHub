"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export function GuestDarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("guest-dark");
    if (stored === "1") {
      setDark(true);
      document.documentElement.classList.add("guest-dark");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("guest-dark");
      localStorage.setItem("guest-dark", "1");
    } else {
      document.documentElement.classList.remove("guest-dark");
      localStorage.setItem("guest-dark", "0");
    }
  };

  return (
    <button
      onClick={toggle}
      type="button"
      className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 active:scale-95"
      aria-label={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
    </button>
  );
}
