"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PIECE_STATUS_OPTIONS } from "@/app/studio/options";
import { getProduct } from "@/data/products";
import { db, dbEnabled } from "@/lib/supabase";
import { LOGIN_LIMITS, clientIp, limitKey, recordSuccess, takeAttempt } from "@/lib/studio-guard";
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

/** 開いたあとでステータスが変わっていたとき（作品の編集）。 */
const MOVED_ONE =
  "画面を開いたあとで、この作品のステータスが変わっています（注文が入ったなど）。再読み込みしてから保存してください。";

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

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // 空欄は試行に数えない（照合まで行かない）
  if (!email || !password) return { error: "メールアドレスとパスワードを入力してください。" };

  const ip = await clientIp();
  // 数える鍵は IPv6 を /64 に丸めたもの。通知には実際の IP を出す
  const key = limitKey(ip);

  // 照合の前に一回ぶんを取る。失敗はここで先に記録される（lib/studio-guard.ts）
  const gate = await takeAttempt(key);
  if (!gate.allowed) {
    return {
      error: `試行が多すぎます。${gate.retryAfterMinutes} 分ほど置いてからもう一度お試しください。`,
    };
  }

  const who = matchAccount(email, password);
  if (!who) {
    if (gate.lockoutMinutes !== null) {
      await notifyStudio(
        `MIROKU Studio — ログインを ${LOGIN_LIMITS.maxFailures} 回続けて失敗したため、${ip} を ${LOGIN_LIMITS.windowMinutes} 分締め出しました。`,
      );
      return {
        error: `試行が多すぎます。${gate.lockoutMinutes} 分ほど置いてからもう一度お試しください。`,
      };
    }
    return { error: "メールアドレスかパスワードが違います。" };
  }

  await recordSuccess(key);
  await createSession(who);
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

  const row: Record<string, unknown> = {
    slug,
    price_aud: price,
    note: optional(formData, "note"),
    note_ja: optional(formData, "note_ja"),
    story: optional(formData, "story"),
    story_ja: optional(formData, "story_ja"),
    updated_at: new Date().toISOString(),
  };

  // ステータスは**選び直したときだけ**書く。画面を開いたまま置いている間に注文が入ると、
  // Webhook が完売にする。そのあと価格だけ直して保存すると、開いたときの「販売中」で
  // 上書きして、売れた一点物がまた買える。列を送らなければ upsert は今の値に触れない。
  const status = optional(formData, "status");
  const statusWas = optional(formData, "status_was");
  if (status !== statusWas) {
    // 選び直していても、開いたあとで DB の方が変わっていたら書かない（取り違えに気づかせる）
    const { data: current, error: readError } = await client
      .from("piece_overrides")
      .select("status")
      .eq("slug", slug)
      .maybeSingle();
    if (readError) {
      console.error("[studio] piece の状態を読めませんでした", readError);
      return { error: saveError(readError) };
    }
    if ((current?.status ?? null) !== statusWas) return { error: MOVED_ONE };
    row.status = status;

    // 書き込みにも条件を付ける —— 読んでから書くまでの間に Webhook が完売にしても上書きしない。
    // 行があれば「開いたときの状態のままなら」の update、無ければ「無いままなら」の insert
    const write = current
      ? statusWas === null
        ? client.from("piece_overrides").update(row).eq("slug", slug).is("status", null)
        : client.from("piece_overrides").update(row).eq("slug", slug).eq("status", statusWas)
      : client.from("piece_overrides").upsert(row, { onConflict: "slug", ignoreDuplicates: true });
    const { data: written, error } = await write.select("slug");
    if (error) {
      console.error("[studio] piece の保存に失敗", error);
      return { error: saveError(error) };
    }
    if ((written ?? []).length === 0) return { error: MOVED_ONE };
  } else {
    const { error } = await client.from("piece_overrides").upsert(row, { onConflict: "slug" });
    if (error) {
      console.error("[studio] piece の保存に失敗", error);
      return { error: saveError(error) };
    }
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
export async function setPiecesStatus(
  slugs: string[],
  status: string,
  /** 画面を開いたときの各作品のステータス（必須）。今の DB と違う・無いものがあれば書かない */
  was: Record<string, string>,
): Promise<StatusResult> {
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

  // 開いたあとで DB の方が変わっていたら書かない。画面を開いたままの間に注文が入ると Webhook が
  // 完売にするので、開いたときの「販売中」でまとめて上書きすると、売れた一点物がまた買える
  // （作品の編集の savePiece と同じ考え）。行が無い・status が空ならコード側の状態と比べる。
  const { data: current, error: readError } = await client
    .from("piece_overrides")
    .select("slug,status")
    .in("slug", known);
  if (readError) {
    console.error("[studio] ステータスを読めませんでした", readError);
    return { ok: false, error: saveError(readError) };
  }
  const stored = new Map((current ?? []).map((row) => [row.slug as string, row.status as string | null]));
  const moved = known.filter((slug) => {
    // 開いたときの状態が無い作品は確かめようがないので、書かない側に倒す
    const expected = was[slug];
    if (expected === undefined) return true;
    const effective = stored.get(slug) ?? getProduct(slug)?.status;
    return effective !== expected;
  });
  if (moved.length > 0) {
    const names = moved.map((slug) => getProduct(slug)?.name ?? slug).join("・");
    return {
      ok: false,
      error: `画面を開いたあとで、${names} のステータスが変わっています（注文が入ったなど）。再読み込みしてから変えてください。`,
    };
  }

  // 書き込みにも条件を付ける —— 読んでから書くまでの間に Webhook が完売にしても上書きしない。
  // 列は status と updated_at だけ（既にある行の価格や文言には触れない）。
  const patch = { status: option.value, updated_at: new Date().toISOString() };
  const written = new Set<string>();
  const take = (rows: { slug: unknown }[] | null) => (rows ?? []).forEach((r) => written.add(r.slug as string));

  // 行があって status が入っている作品: 開いたときの状態ごとに、その状態のままのものだけ書く
  const byWas = new Map<string, string[]>();
  for (const slug of known) {
    const value = stored.get(slug);
    if (value === undefined || value === null) continue;
    byWas.set(was[slug], [...(byWas.get(was[slug]) ?? []), slug]);
  }
  // 行はあるが status が空（= コード側の状態）の作品と、行が無い作品
  const empty = known.filter((slug) => stored.has(slug) && stored.get(slug) === null);
  const missing = known.filter((slug) => !stored.has(slug));

  try {
    for (const [value, group] of byWas) {
      const { data, error } = await client
        .from("piece_overrides")
        .update(patch)
        .in("slug", group)
        .eq("status", value)
        .select("slug");
      if (error) throw error;
      take(data);
    }
    if (empty.length > 0) {
      const { data, error } = await client
        .from("piece_overrides")
        .update(patch)
        .in("slug", empty)
        .is("status", null)
        .select("slug");
      if (error) throw error;
      take(data);
    }
    if (missing.length > 0) {
      // 同時に行が作られていたら（Webhook の完売）作らない
      const { data, error } = await client
        .from("piece_overrides")
        .upsert(missing.map((slug) => ({ slug, ...patch })), { onConflict: "slug", ignoreDuplicates: true })
        .select("slug");
      if (error) throw error;
      take(data);
    }
  } catch (error) {
    console.error("[studio] ステータスの更新に失敗", error);
    if (written.size > 0) {
      revalidateCatalog();
      revalidatePath("/studio", "layout");
    }
    return { ok: false, error: saveError(error as { code?: string; message: string }) };
  }

  if (written.size > 0) {
    revalidateCatalog();
    revalidatePath("/studio", "layout");
  }
  const missed = known.filter((slug) => !written.has(slug));
  if (missed.length > 0) {
    const names = missed.map((slug) => getProduct(slug)?.name ?? slug).join("・");
    const done = written.size > 0 ? `ほかの ${written.size} 点は変えました。` : "";
    return {
      ok: false,
      error: `${names} は、保存の直前にステータスが変わったので変えていません（注文が入ったなど）。${done}再読み込みしてください。`,
    };
  }
  return { ok: true, count: written.size };
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
