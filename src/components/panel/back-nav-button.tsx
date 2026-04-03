"use client";

import { useRouter } from "next/navigation";
import { FiHome, FiArrowLeft, FiArrowRight } from "react-icons/fi";

type Props = {
  fallbackHref: string;
  label: string;
  dark?: boolean;
  rtl?: boolean;
};

export function BackNavButton({ fallbackHref, label, dark = false, rtl = false }: Props) {
  const router = useRouter();
  const ArrowIcon = rtl ? FiArrowRight : FiArrowLeft;

  const onHome = () => {
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={onHome}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
        dark
          ? "bg-gradient-to-r from-slate-900/80 to-slate-800/80 text-white shadow-lg shadow-black/20 hover:brightness-110"
          : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:brightness-95"
      }`}
      aria-label={label}
    >
      <ArrowIcon className="h-3.5 w-3.5" />
      <FiHome className="h-3.5 w-3.5 opacity-70" />
      <span>{label}</span>
    </button>
  );
}
