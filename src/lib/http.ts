import { NextResponse } from "next/server";

export function redirectWithMessage(url: URL, key: "ok" | "error", message: string) {
  url.searchParams.set(key, message);
  return NextResponse.redirect(url);
}

export function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
