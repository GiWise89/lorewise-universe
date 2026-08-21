import { env } from "@/lib/netlifyRuntime";

type RuntimeEnv = { DB?: D1Database };

export async function GET() {
  const runtime = env as unknown as RuntimeEnv;
  const total = 10;
  let reserved = 0;

  if (runtime.DB) {
    try {
      const row = await runtime.DB.prepare("SELECT COUNT(*) AS count FROM commission_requests WHERE launch_slot_reserved = 1").first<{ count: number }>();
      reserved = Math.max(0, Number(row?.count ?? 0));
    } catch {
      reserved = 0;
    }
  }

  return Response.json({ total, reserved, remaining: Math.max(0, total - reserved) }, { headers: { "Cache-Control": "no-store" } });
}
