"use client";

import { useRouter } from "next/navigation";
import { FiHome } from "react-icons/fi";

type Props = {
  fallbackHref: string;
  label: string;
  dark?: boolean;
};

export function BackNavButton({ fallbackHref, label, dark = false }: Props) {
  const router = useRouter();

  const onHome = () => {
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={onHome}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
        dark
          ? "bg-white/15 text-white hover:bg-white/25"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
      aria-label={label}
    >
      <FiHome className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
