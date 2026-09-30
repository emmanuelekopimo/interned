import { sendAlertDigests } from "@/lib/alerts";
import { env } from "@/env";

/** Trigger from a scheduler (e.g. hourly): `curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/alerts` */
export async function GET(req: Request) {
  const secret = env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {

    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sent = await sendAlertDigests();
  return Response.json({ ok: true, sent });
}
