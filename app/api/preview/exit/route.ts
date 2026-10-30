import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { PREVIEW_CONTENT_COOKIE, PREVIEW_DRAFT_COOKIE, safeInternalPath } from "@/lib/preview";

/* ------------------------------------------------------------------
   下書きプレビューの出口。Draft Mode を畳み、draftKey の cookie を捨てて
   記事一覧へ戻す（BlogArticle の「Leave preview」から叩く）。
   転送先はここでも内部パスだけに限る。
   ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const target = safeInternalPath(new URL(request.url).searchParams.get("path"), "/blog");

  (await draftMode()).disable();
  const jar = await cookies();
  jar.delete(PREVIEW_DRAFT_COOKIE);
  jar.delete(PREVIEW_CONTENT_COOKIE);

  redirect(target);
}
