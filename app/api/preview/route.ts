import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { isDraftParam } from "@/lib/microcms";
import { PREVIEW_DRAFT_COOKIE, previewSecretOk, safeInternalPath } from "@/lib/preview";

/* ------------------------------------------------------------------
   下書きプレビューの入口。microCMS 管理画面 → API 設定 → 画面プレビューに
     https://honmyoujifuji.com/api/preview?secret={SECRET}&contentId={CONTENT_ID}&draftKey={DRAFT_KEY}
   を入れる（{SECRET} は MICROCMS_PREVIEW_SECRET の値）。

   秘密鍵を確かめ、Next の Draft Mode を立て、draftKey を cookie に預けて
   記事ページへ転送する。記事ページ（/blog/[slug]）は Draft Mode の間だけ
   その draftKey で下書きを取り、キャッシュに載せない。

   転送先は内部パスだけ（safeInternalPath）—— ここを素通しにすると、秘密鍵を
   知らなくても本物のドメインから外部サイトへ飛ばせる（オープンリダイレクト）。
   ------------------------------------------------------------------ */

// 下書きごとに結果が変わるので静的化しない（draftMode を立てる Route）。
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;

  // 1. 秘密鍵。合わなければ何もしない（Draft Mode も立てない）。
  if (!previewSecretOk(params.get("secret"))) {
    return new Response("Invalid preview token", { status: 401 });
  }

  // 2. contentId と draftKey。SDK は URL にそのままつなぐので英数字と - _ だけ。
  const contentId = params.get("contentId") ?? params.get("slug") ?? "";
  const draftKey = params.get("draftKey") ?? "";
  if (!isDraftParam(contentId) || !isDraftParam(draftKey)) {
    return new Response("Missing or invalid contentId / draftKey", { status: 400 });
  }

  // 3. 転送先。明示が無ければ記事ページ。内部パスだけ通す。
  const target = safeInternalPath(params.get("path"), `/blog/${contentId}`);

  // 4. Draft Mode を立て、draftKey を cookie に預ける（記事ページが読む）。
  (await draftMode()).enable();
  (await cookies()).set(PREVIEW_DRAFT_COOKIE, draftKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect(target);
}
