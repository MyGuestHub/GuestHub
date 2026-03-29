"use client";

import { useId, useState } from "react";
import { FiUpload } from "react-icons/fi";

type Props = {
  lang: "ar" | "en";
  userId: number;
  returnTo: string;
  chooseFileText: string;
  noFileText: string;
  uploadText: string;
};

export function AvatarUploadForm({
  lang,
  userId,
  returnTo,
  chooseFileText,
  noFileText,
  uploadText,
}: Props) {
  const [fileName, setFileName] = useState("");
  const inputId = useId();

  return (
    <form action="/api/profile/avatar" method="post" encType="multipart/form-data" className="mt-5 grid w-full min-w-0 gap-3">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="returnTo" value={returnTo} />

      <input
        id={inputId}
        name="avatar"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        required
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          setFileName(file?.name ?? "");
        }}
      />

      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-white p-2">
        <label
          htmlFor={inputId}
          className="shrink-0 cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
        >
          {chooseFileText}
        </label>
        <span className="min-w-0 truncate text-sm text-slate-600" title={fileName || noFileText}>
          {fileName || noFileText}
        </span>
      </div>

      <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
        <FiUpload className="h-4 w-4" />
        {uploadText}
      </button>
    </form>
  );
}
