import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { JOURNAL_TAG } from "@/lib/microcms";

/* ------------------------------------------------------------------
   microCMS の Webhook 受け口。記事を公開／更新／削除すると叩かれ、
   Journal のキャッシュを捨てる（次に誰かが開いたときに取り直す）。

   microCMS 管理画面 → API 設定 → Webhook → カスタム通知
     URL    : https://<本番ドメイン>/api/revalidate
     シークレット : MICROCMS_WEBHOOK_SECRET と同じ文字列
   ------------------------------------------------------------------ */

const secret = process.env.MICROCMS_WEBHOOK_SECRET;

function signatureMatches(body: string, received: string): boolean {
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  // 長さが違うと timingSafeEqual が投げる。先に落とす。
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!secret) {
    console.error("[microcms] MICROCMS_WEBHOOK_SECRET is not set — revalidate webhook refused");
    return Response.json({ revalidated: false, reason: "not configured" }, { status: 503 });
  }

  // 署名は生のボディに対して計算されるので、JSON にする前に文字列で取る。
  const body = await request.text();
  const received = request.headers.get("x-microcms-signature") ?? "";

  if (!signatureMatches(body, received)) {
    return Response.json({ revalidated: false, reason: "invalid signature" }, { status: 401 });
  }

  revalidateTag(JOURNAL_TAG, "max");
  return Response.json({ revalidated: true, tag: JOURNAL_TAG, now: Date.now() });
}
