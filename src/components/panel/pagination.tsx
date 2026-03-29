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
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <p className="text-slate-600">
        {t("الصفحة", "Page")} {safePage} / {totalPages} - {t("الإجمالي", "Total")} {total}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(basePath, Math.max(1, safePage - 1), pageSize)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-slate-700"
        >
          {t("السابق", "Prev")}
        </Link>
        <Link
          href={hrefFor(basePath, Math.min(totalPages, safePage + 1), pageSize)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-slate-700"
        >
          {t("التالي", "Next")}
        </Link>
      </div>
    </div>
  );
}
