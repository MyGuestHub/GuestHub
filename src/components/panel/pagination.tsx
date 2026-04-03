import Link from "next/link";
import { tr, type AppLang } from "@/lib/i18n";

type Props = {
  lang: AppLang;
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
};

function hrefFor(basePath: string, page: number, pageSize: number) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  return `${basePath}?${qs.toString()}`;
}

export function Pagination({ lang, basePath, page, pageSize, total }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const t = (ar: string, en: string) => tr(lang, ar, en);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900/50 px-4 py-3 text-sm shadow-lg">
      <p className="text-white/70">
        {t("الصفحة", "Page")} <span className="font-semibold text-white">{safePage}</span> / {totalPages} 
        <span className="mx-2 text-white/30">•</span>
        {t("الإجمالي", "Total")} <span className="font-semibold text-white">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(basePath, Math.max(1, safePage - 1), pageSize)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            safePage <= 1
              ? "pointer-events-none bg-white/5 text-white/30"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {t("السابق", "Prev")}
        </Link>
        <Link
          href={hrefFor(basePath, Math.min(totalPages, safePage + 1), pageSize)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            safePage >= totalPages
              ? "pointer-events-none bg-white/5 text-white/30"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {t("التالي", "Next")}
        </Link>
      </div>
    </div>
  );
}
