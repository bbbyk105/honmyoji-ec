import { NextResponse, type NextRequest } from "next/server";

import { STUDIO_COOKIE } from "@/lib/studio-cookie";

/**
 * Next 16 では middleware.ts が proxy.ts に改名された（機能は同じ）。
 *
 * ここでやるのは三つだけ。
 *  1. /studio に検索エンジンを近づけない（X-Robots-Tag）
 *  2. cookie を持たない訪問者をログインへ返す（速く弾くためのざっくり判定）
 *  3. 管理画面を他所のページに埋め込ませない（frame-ancestors / X-Frame-Options）
 *
 * 署名の検証はここではしない。Edge には node:crypto が無いのと、Next のドキュメント
 * が proxy を認可の本体にするなと明記しているため。本当の検証は lib/studio-session.ts
 * の requireSession() で、ページと Server Action が毎回そこを通る。
 */

function harden(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  // クリックジャッキング対策。管理画面が iframe に載る理由はひとつも無い
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/studio/login";

  if (!isLogin && !request.cookies.has(STUDIO_COOKIE)) {
    const login = new URL("/studio/login", request.url);
    // ログイン後に元の画面へ戻すため、行こうとしていた場所を憶えておく
    if (pathname !== "/studio") login.searchParams.set("next", pathname);
    return harden(NextResponse.redirect(login));
  }

  return harden(NextResponse.next());
}

export const config = {
  matcher: "/studio/:path*",
};
