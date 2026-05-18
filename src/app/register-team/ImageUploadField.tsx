"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";

type ImageUploadFieldProps = {
  label: ReactNode;
  inputId: string;
  previewUrl: string;
  emptyLabel?: string;
  uploadLabel: string;
  uploadingLabel: string;
  changeLabel: string;
  hint?: string;
  previewClassName?: string;
  onFileSelect: (file: File | null) => void;
  isUploading?: boolean;
  error?: string;
};

export function ImageUploadField({
  label,
  inputId,
  previewUrl,
  emptyLabel = "გადახედვა",
  uploadLabel,
  uploadingLabel,
  changeLabel,
  hint = "png, jpg, webp · მაქს. 4MB",
  previewClassName = "h-24 w-32",
  onFileSelect,
  isUploading = false,
  error,
}: ImageUploadFieldProps) {
  return (
    <div>
      <span className="dejavu-sans text-sm text-zinc-700">{label}</span>
      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(e) => {
          onFileSelect(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
        className="sr-only"
      />
      <div className="mt-2 flex gap-3">
        <div
          className={`relative shrink-0 overflow-hidden rounded-xl border border-[#e8e2da] bg-[#eef4fc] ${previewClassName}`}
        >
          {previewUrl ? (
            <Image src={previewUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-zinc-400 dejavu-sans">
              {emptyLabel}
            </span>
          )}
        </div>

        <label
          htmlFor={inputId}
          className="flex min-h-[88px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e8e2da] bg-[#faf9f7] px-4 py-3 text-zinc-600 transition hover:border-[#fd7209]/50 hover:bg-[#fff8f2]"
        >
          <ImagePlus className="h-6 w-6 text-[#fd7209]" />
          <span className="dejavu-sans text-sm font-medium text-zinc-700">
            {isUploading ? uploadingLabel : previewUrl ? changeLabel : uploadLabel}
          </span>
        </label>
      </div>
      {hint && <p className="mt-2 text-xs text-zinc-500 dejavu-sans">{hint}</p>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}
