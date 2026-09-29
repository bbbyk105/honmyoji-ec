"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PIECE_STATUS_OPTIONS } from "@/app/studio/options";
import { getProduct } from "@/data/products";
import { db, dbEnabled } from "@/lib/supabase";
import { LOGIN_LIMITS, checkGate, clientIp, recordAttempt } from "@/lib/studio-guard";
import { notifyStudio } from "@/lib/studio-notify";
import {
  createSession,
  destroySession,
  matchAccount,
  requireSession,
  studioConfigured,
} from "@/lib/studio-session";

/* ------------------------------------------------------------------
   管理画面の書き込み。

   このファイルから定数を export しないこと —— "use server" のモジュールが
   非 async の値を export すると 500 になる。ステータスの選択肢のような固定値は
   app/studio/options.ts に置いてある。
   ------------------------------------------------------------------ */

export type FormState = { error?: string; saved?: string };

/** 空欄は「コード側の値を使う」= null。空文字を入れると note が消える。 */
function optional(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

/** 保存後に作り直す公開ページ。商品が出るのはこの四つ。 */
function revalidateCatalog(): void {
  revalidatePath("/");
  revalidatePath("/collection");
  revalidatePath("/collection/[slug]", "page");
  revalidatePath("/contact");
}

// ---------------------------------------------------------------- 入退室

/** 戻り先は /studio 配下だけ許す。外部 URL を渡されてそこへ送らないため。 */
function safeNext(value: string): string {
  return value.startsWith("/studio") && !value.startsWith("/studio//") ? value : "/studio";
}

/**
 * ログイン。
 *
 * メールアドレスと合言葉のどちらが違ったかは画面に出さない。「このアドレスは
 * 登録されている」と分かると、あとは合言葉だけを攻めればよくなる。理由は
 * サーバー側にだけ残す。
 */
export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!studioConfigured) {
    return { error: "STUDIO_EMAIL / STUDIO_PASSWORD_HASH / STUDIO_SESSION_SECRET が未設定です。" };
  }

  const ip = await clientIp();

  const gate = await checkGate(ip);
  if (!gate.allowed) {
    return {
      error: `試行が多すぎます。${gate.retryAfterMinutes} 分ほど置いてからもう一度お試しください。`,
    };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "メールアドレスとパスワードを入力してください。" };

  const who = matchAccount(email, password);
  if (!who) {
    await recordAttempt(ip, false);

    const failures = await checkGate(ip);
    if (!failures.allowed) {
      await notifyStudio(
        `MIROKU Studio — ログインを ${LOGIN_LIMITS.maxFailures} 回続けて失敗したため、${ip} を ${LOGIN_LIMITS.windowMinutes} 分締め出しました。`,
      );
      return {
        error: `試行が多すぎます。${failures.retryAfterMinutes} 分ほど置いてからもう一度お試しください。`,
      };
    }
    return { error: "メールアドレスかパスワードが違います。" };
  }

  await recordAttempt(ip, true);
  await createSession();
  await notifyStudio(`MIROKU Studio — ${who} が ${ip} からログインしました。`);

  redirect(safeNext(String(formData.get("next") ?? "/studio")));
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/studio/login");
}

// ---------------------------------------------------------------- 商品

export async function savePiece(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "作品が指定されていません。" };

  const client = db();
  if (!client) {
    return { error: "データベースに繋がっていません（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）。" };
  }

  const rawPrice = String(formData.get("price_aud") ?? "").trim();
  let price: number | null = null;
  if (rawPrice !== "") {
    const parsed = Number(rawPrice);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { error: "価格は 1 以上の整数（オーストラリアドル）で入れてください。" };
    }
    price = parsed;
  }

  const { error } = await client.from("piece_overrides").upsert(
    {
      slug,
      price_aud: price,
      status: optional(formData, "status"),
      note: optional(formData, "note"),
      note_ja: optional(formData, "note_ja"),
      story: optional(formData, "story"),
      story_ja: optional(formData, "story_ja"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" },
  );

  if (error) {
    console.error("[studio] piece の保存に失敗", error);
    return { error: saveError(error) };
  }

  revalidateCatalog();
  revalidatePath("/studio/pieces");
  revalidatePath(`/studio/pieces/${slug}`);
  return { saved: new Date().toISOString() };
}

export type StatusResult = { ok: true; count: number } | { ok: false; error: string };

/**
 * 一覧からステータスだけ直す。一点でも、チェックを入れた複数でも同じ道を通る。
 *
 * 以前は失敗しても何も返さず（void）、画面は選んだ値のまま黙っていた。受注生産は DB の
 * check に弾かれて一度も保存されていなかったのに、誰も気づけなかった。失敗は必ず画面へ返す。
 */
export async function setPiecesStatus(slugs: string[], status: string): Promise<StatusResult> {
  await requireSession();

  const option = PIECE_STATUS_OPTIONS.find((o) => o.value === status);
  if (!option) return { ok: false, error: "ステータスが読めませんでした。選び直してください。" };

  // 画面から来た slug は信用しない —— カタログにあるものだけ書く。
  const known = [...new Set(slugs)].filter((slug) => getProduct(slug)?.slug === slug);
  if (known.length === 0) return { ok: false, error: "作品が選ばれていません。" };

  const client = db();
  if (!client) {
    return { ok: false, error: "データベースに繋がっていません（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）。" };
  }

  // 列を status と updated_at だけにして upsert する。既にある行の価格や文言には触れない。
  const now = new Date().toISOString();
  const { error } = await client
    .from("piece_overrides")
    .upsert(
      known.map((slug) => ({ slug, status: option.value, updated_at: now })),
      { onConflict: "slug" },
    );

  if (error) {
    console.error("[studio] ステータスの更新に失敗", error);
    return { ok: false, error: saveError(error) };
  }

  revalidateCatalog();
  revalidatePath("/studio", "layout");
  return { ok: true, count: known.length };
}

/**
 * 保存の失敗を人の言葉に。23514 は check 違反で、ここに来るのは「DB がまだ知らない
 * ステータス」のときだけ（受注生産を足したあと 0003 を流していない）。
 */
function saveError(error: { code?: string; message: string }): string {
  if (error.code === "23514") {
    return "データベースがこのステータスをまだ受け付けません。supabase/migrations/0003_made_to_order.sql を Supabase の SQL Editor で一度流してください。";
  }
  return `保存できませんでした: ${error.message}`;
}

/** 上書きを消してコード側（data/products.ts）の値に戻す。 */
export async function resetPiece(formData: FormData): Promise<void> {
  await requireSession();

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;

  const client = db();
  if (!client) return;

  const { error } = await client.from("piece_overrides").delete().eq("slug", slug);
  if (error) {
    console.error("[studio] 上書きの取り消しに失敗", error);
    return;
  }

  revalidateCatalog();
  revalidatePath("/studio/pieces");
  revalidatePath(`/studio/pieces/${slug}`);
}

// ---------------------------------------------------------------- 注文

export async function updateOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { error: "注文が指定されていません。" };

  const client = db();
  if (!client) return { error: "データベースに繋がっていません。" };

  const status = String(formData.get("status") ?? "").trim();
  const tracking = optional(formData, "tracking");
  const memo = optional(formData, "memo");

  const patch: Record<string, unknown> = { status, tracking, memo };
  // 「発送済み」を選んだ瞬間を発送日にする。すでに日付があるなら触らない。
  if (status === "shipped") patch.shipped_at = new Date().toISOString();
  if (status !== "shipped") patch.shipped_at = null;

  const { error } = await client.from("orders").update(patch).eq("id", id);
  if (error) {
    console.error("[studio] 注文の更新に失敗", error);
    return { error: `保存できませんでした: ${error.message}` };
  }

  revalidatePath("/studio");
  revalidatePath("/studio/orders");
  revalidatePath(`/studio/orders/${id}`);
  return { saved: new Date().toISOString() };
}

/** 接続状態。ダッシュボードが「まだ繋がっていない」と言うのに使う。 */
export async function isDbConnected(): Promise<boolean> {
  return dbEnabled;
}
