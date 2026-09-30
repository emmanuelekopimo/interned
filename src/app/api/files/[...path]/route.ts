import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { files } from "@/db/schema";
import { UPLOAD_DIR } from "@/lib/uploads";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  if (!parts || parts.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const [firstPart] = parts;

  // 1. Look up file blob in the database if the first segment is a UUID
  if (UUID_REGEX.test(firstPart)) {
    try {
      const [fileRecord] = await db
        .select()
        .from(files)
        .where(eq(files.id, firstPart))
        .limit(1);

      if (fileRecord) {
        const isSvg = fileRecord.mimeType === "image/svg+xml";
        const filename = encodeURIComponent(fileRecord.name).replace(/['()]/g, escape);
        return new Response(new Uint8Array(fileRecord.data), {
          headers: {
            "Content-Type": fileRecord.mimeType || "application/octet-stream",
            "Content-Length": String(fileRecord.size),
            "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${filename}`,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
            ...(isSvg ? { "Content-Security-Policy": "script-src 'none'" } : {}),
          },
        });
      }
    } catch (err) {
      console.error("Database file retrieval error:", err);
    }
  }

  // 2. Fallback to filesystem for legacy uploads
  const target = path.resolve(/*turbopackIgnore: true*/ UPLOAD_DIR, ...parts);
  if (target.startsWith(UPLOAD_DIR + path.sep)) {
    try {
      const info = await stat(target);
      if (info.isFile()) {
        const ext = path.extname(target).slice(1).toLowerCase();
        const body = await readFile(target);
        return new Response(new Uint8Array(body), {
          headers: {
            "Content-Type": MIME[ext] ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
            ...(ext === "svg" ? { "Content-Security-Policy": "script-src 'none'" } : {}),
          },
        });
      }
    } catch {
      // Ignore filesystem error and 404 below
    }
  }

  return new Response("Not found", { status: 404 });
}

