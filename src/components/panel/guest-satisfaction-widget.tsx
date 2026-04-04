"use client";

import { FiStar, FiMessageCircle } from "react-icons/fi";

type AppLang = "ar" | "en";

type RatingStats = {
  total: number;
  average: number;
  distribution: Record<number, number>;
  emojiCounts: Record<string, number>;
};

type RecentReview = {
  stars: number;
  emoji: string | null;
  comment: string | null;
  guest_name: string;
  room_number: string;
  item_name_en: string;
  item_name_ar: string;
  created_at: string;
};

const emojiMap: Record<string, string> = {
  love: "😍",
  happy: "😊",
  neutral: "😐",
  sad: "😞",
  angry: "😡",
};

const emojiLabels: Record<string, [string, string]> = {
  love: ["حب", "Love"],
  happy: ["سعيد", "Happy"],
  neutral: ["محايد", "Neutral"],
  sad: ["حزين", "Sad"],
  angry: ["غاضب", "Angry"],
};

export function GuestSatisfactionWidget({
  lang,
  stats,
  reviews,
}: {
  lang: AppLang;
  stats: RatingStats;
  reviews: RecentReview[];
}) {
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  if (stats.total === 0) return null;

  const maxDistCount = Math.max(...Object.values(stats.distribution), 1);

  return (
    <div className="gh-surface rounded-3xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <FiStar className="h-5 w-5 text-amber-400" />
        <h2 className="text-base font-bold">
          {t("رضا الضيوف", "Guest Satisfaction")}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Average rating card */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4">
          <div className="text-4xl font-bold text-amber-400">
            {stats.average.toFixed(1)}
          </div>
          <div className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <FiStar
                key={s}
                className={`h-4 w-4 ${
                  s <= Math.round(stats.average)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-500"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs opacity-70">
            {stats.total} {t("تقييم", "ratings")}
          </p>
        </div>

        {/* Star distribution bars */}
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] ?? 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-end opacity-70">{star}</span>
                <FiStar className="h-3 w-3 shrink-0 text-amber-400" />
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="absolute inset-y-0 start-0 rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${(count / maxDistCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-end tabular-nums opacity-60">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Emoji breakdown */}
        <div className="flex flex-wrap items-start gap-2">
          {Object.entries(emojiMap).map(([key, icon]) => {
            const count = stats.emojiCounts[key] ?? 0;
            if (count === 0) return null;
            return (
              <div
                key={key}
                className="flex flex-col items-center rounded-xl bg-white/5 px-3 py-2"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-bold">{count}</span>
                <span className="text-[10px] opacity-50">
                  {emojiLabels[key]
                    ? t(emojiLabels[key][0], emojiLabels[key][1])
                    : key}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5">
            <FiMessageCircle className="h-4 w-4 opacity-60" />
            <h3 className="text-sm font-semibold opacity-80">
              {t("آخر التقييمات", "Recent Reviews")}
            </h3>
          </div>
          <div className="space-y-2">
            {reviews.slice(0, 5).map((review, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 px-3 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FiStar
                          key={s}
                          className={`h-3 w-3 ${
                            s <= review.stars
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-500"
                          }`}
                        />
                      ))}
                    </div>
                    {review.emoji &&
                      emojiMap[review.emoji] && (
                        <span className="text-sm">
                          {emojiMap[review.emoji]}
                        </span>
                      )}
                  </div>
                  <span className="text-[10px] opacity-50">
                    {t("غرفة", "Room")} {review.room_number}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 text-xs opacity-70">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}
                <div className="mt-1 flex items-center justify-between text-[10px] opacity-50">
                  <span>{review.guest_name}</span>
                  <span>
                    {lang === "ar"
                      ? review.item_name_ar
                      : review.item_name_en}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
