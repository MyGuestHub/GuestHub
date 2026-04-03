"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

export function CopyUrlButton({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked in insecure contexts */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-lg bg-white/12 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/20"
      title={label}
    >
      {copied ? (
        <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <FiCopy className="h-3.5 w-3.5" />
      )}
      {copied ? copiedLabel : label}
    </button>
  );
}
