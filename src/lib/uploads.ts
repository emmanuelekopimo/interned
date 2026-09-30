import "server-only";
import path from "node:path";
import { env } from "@/env";
import { db } from "@/db";
import { files } from "@/db/schema";

export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ env.UPLOAD_DIR);

export const UPLOAD_KINDS = {
  document: {
    maxBytes: 5 * 1024 * 1024,
    types: {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    } as Record<string, string>,
  },
  image: {
    maxBytes: 4 * 1024 * 1024,
    types: {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/svg+xml": "svg",
    } as Record<string, string>,
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

export class UploadError extends Error {}

/** Persist an uploaded File as a blob in the database and return its public URL. Returns null when no file was provided. */
export async function saveUpload(file: FormDataEntryValue | null, kind: UploadKind): Promise<{ url: string; name: string; id: string } | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const rules = UPLOAD_KINDS[kind];
  const ext = rules.types[file.type];
  if (!ext) {
    throw new UploadError(
      kind === "document" ? "Please upload a PDF or Word document." : "Please upload a PNG, JPG, WEBP, GIF or SVG image.",
    );
  }
  if (file.size > rules.maxBytes) {
    throw new UploadError(`File is too large. Maximum size is ${Math.round(rules.maxBytes / 1024 / 1024)}MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitizedName = file.name.slice(0, 120);

  const [record] = await db
    .insert(files)
    .values({
      name: sanitizedName,
      mimeType: file.type || (kind === "document" ? "application/pdf" : "image/png"),
      size: file.size,
      data: buffer,
    })
    .returning({ id: files.id });

  return {
    url: `/api/files/${record.id}/${encodeURIComponent(sanitizedName)}`,
    name: sanitizedName,
    id: record.id,
  };
}

