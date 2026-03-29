import { NextResponse } from "next/server";
import { authenticateUser, createSession, SESSION_COOKIE } from "@/lib/auth";
import { cleanText } from "@/lib/http";
import { env } from "@/lib/env";
import { resolveLang, tr } from "@/lib/i18n";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = resolveLang(cleanText(form.get("lang")));
  const username = cleanText(form.get("username"));
  const password = cleanText(form.get("password"));

  const loginUrl = new URL(`/${lang}/login`, request.url);

  if (!username || !password) {
    loginUrl.searchParams.set(
      "error",
      tr(lang, "اسم المستخدم وكلمة المرور مطلوبان", "Username and password are required"),
    );
    return NextResponse.redirect(loginUrl);
  }

  const user = await authenticateUser(username, password);
  if (!user) {
    loginUrl.searchParams.set(
      "error",
      tr(lang, "بيانات الدخول غير صحيحة", "Invalid login credentials"),
    );
    return NextResponse.redirect(loginUrl);
  }

  const userAgent = request.headers.get("user-agent");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? null;
  const token = await createSession(user.id, userAgent, ipAddress);

  const response = NextResponse.redirect(
    new URL(
      `/${lang}/dashboard?ok=${encodeURIComponent(
        tr(lang, "تم تسجيل الدخول بنجاح", "Signed in successfully"),
      )}`,
      request.url,
    ),
  );
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: env.SESSION_TTL_HOURS * 60 * 60,
  });

  return response;
}
