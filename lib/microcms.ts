import { createClient, type MicroCMSImage, type MicroCMSListContent } from "microcms-js-sdk";
import {
  byNewest,
  journalSeed,
  type JournalEntry,
  type JournalImageRatio,
  type JournalImageRole,
} from "@/data/journal";

/* ------------------------------------------------------------------
   microCMS — Journal（ブログ）の記事はここから来る。
   **サーバ専用**。API キーは NEXT_PUBLIC_ を付けない — このモジュールを
   "use client" から import しないこと。

   環境変数（.env.example 参照）が無いときは data/journal.ts の seed に
   落ちる。鍵の無い環境でもビルドと表示が通るようにするため — 「CMS が
   未設定だからサイトが 500」は EC では一番やってはいけない壊れ方。
   API が落ちたときも同じ経路で seed に落ち、理由は server log に出す。
   ------------------------------------------------------------------ */

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

/** microCMS の API（エンドポイント）名。管理画面で別名にしたときだけ env で上書き。 */
export const JOURNAL_ENDPOINT = process.env.MICROCMS_JOURNAL_ENDPOINT ?? "journals";

/** Webhook から revalidate するときのタグ。`app/api/revalidate/route.ts` が叩く。 */
export const JOURNAL_TAG = "journal";

/** 定期再検証（秒）。Webhook が通れば実質こちらは保険。 */
const REVALIDATE_SECONDS = 600;

/** 一覧で引く上限。記事がこれを超えたらページングを入れる。 */
const LIST_LIMIT = 100;

type Client = ReturnType<typeof createClient>;
let cached: Client | null = null;

export function microcmsClient(): Client | null {
  if (!serviceDomain || !apiKey) return null;
  cached ??= createClient({ serviceDomain, apiKey, retry: true });
  return cached;
}

export const microcmsEnabled = Boolean(serviceDomain && apiKey);

/**
 * microCMS 側のスキーマ（docs/microcms.md と合わせること）。
 * select フィールドは string[] で返る。
 */
export type JournalContent = {
  title?: string;
  titleJa?: string;
  dek?: string;
  date?: string;
  season?: string;
  topic?: string | string[];
  image?: MicroCMSImage;
  imageAlt?: string;
  imageRole?: string | string[];
  imageRatio?: string | string[];
  pull?: string;
  content?: string;
};

const ROLES: JournalImageRole[] = ["journal", "material-macro", "lifestyle", "process"];
const RATIOS: JournalImageRatio[] = ["4/5", "16/10", "3/4", "1/1"];

function one(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").trim();
}

function pick<T extends string>(value: string | string[] | undefined, allowed: T[], fallback: T): T {
  const v = one(value);
  return (allowed as string[]).includes(v) ? (v as T) : fallback;
}

function toEntry(content: JournalContent & MicroCMSListContent): JournalEntry {
  const title = content.title?.trim() || "Untitled";
  const html = content.content?.trim();

  return {
    slug: content.id,
    title,
    titleJa: content.titleJa?.trim() ?? "",
    dek: content.dek?.trim() ?? "",
    date: content.date || content.publishedAt || content.createdAt,
    season: content.season?.trim() ?? "",
    topic: one(content.topic) || "Journal",
    image: content.image?.url,
    imageAlt: content.imageAlt?.trim() || title,
    imageRole: pick(content.imageRole, ROLES, "journal"),
    imageRatio: pick(content.imageRatio, RATIOS, "16/10"),
    pull: content.pull?.trim() || undefined,
    body: html ? [{ type: "html", html }] : [],
  };
}

const seed = [...journalSeed].sort(byNewest);

/**
 * 記事一覧（新しい順）。詳細ページもここから引く — 一覧を一度だけ取って
 * キャッシュを共有したほうが、記事ごとに叩くより速く、次の記事への導線も作れる。
 */
export async function getJournalEntries(): Promise<JournalEntry[]> {
  const client = microcmsClient();
  if (!client) return seed;

  try {
    const res = await client.getList<JournalContent>({
      endpoint: JOURNAL_ENDPOINT,
      queries: { limit: LIST_LIMIT, richEditorFormat: "html" },
      customRequestInit: { next: { revalidate: REVALIDATE_SECONDS, tags: [JOURNAL_TAG] } },
    });
    const entries = res.contents.map(toEntry).sort(byNewest);
    return entries.length > 0 ? entries : seed;
  } catch (error) {
    console.error(`[microcms] failed to load "${JOURNAL_ENDPOINT}" — falling back to seed entries`, error);
    return seed;
  }
}

export async function getJournalEntry(slug: string): Promise<JournalEntry | undefined> {
  const entries = await getJournalEntries();
  return entries.find((e) => e.slug === slug);
}

/** 記事の次の一本（末尾なら先頭へ戻る）。記事が一本しか無いときは undefined。 */
export function nextEntry(entries: JournalEntry[], slug: string): JournalEntry | undefined {
  if (entries.length < 2) return undefined;
  const i = entries.findIndex((e) => e.slug === slug);
  if (i < 0) return entries[0];
  return entries[(i + 1) % entries.length];
}

/**
 * 下書きプレビュー。microCMS の「画面プレビュー」から
 * /journal/preview?slug={CONTENT_ID}&draftKey={DRAFT_KEY} で来る。
 * 下書きはキャッシュしない。
 */
export async function getJournalDraft(slug: string, draftKey: string): Promise<JournalEntry | undefined> {
  const client = microcmsClient();
  if (!client) return undefined;

  try {
    const content = await client.getListDetail<JournalContent>({
      endpoint: JOURNAL_ENDPOINT,
      contentId: slug,
      queries: { draftKey, richEditorFormat: "html" },
      customRequestInit: { cache: "no-store" },
    });
    return toEntry(content);
  } catch (error) {
    console.error(`[microcms] draft preview failed for "${slug}"`, error);
    return undefined;
  }
}
