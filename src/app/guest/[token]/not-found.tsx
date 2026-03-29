import Link from "next/link";

export default function GuestNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-rose-600">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Link Invalid or Expired</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        This guest access link is no longer valid. It may have expired or been revoked.
        Please contact the front desk for a new link.
      </p>
      <p className="mt-1 max-w-sm text-sm text-slate-500" dir="rtl">
        رابط الوصول غير صالح أو منتهي الصلاحية. يرجى التواصل مع الاستقبال للحصول على رابط جديد.
      </p>
    </div>
  );
}
