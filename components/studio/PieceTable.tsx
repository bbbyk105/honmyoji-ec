"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";

import { setPiecesStatus } from "@/app/studio/actions";
import {
  PIECE_STATUS_COLOR,
  PIECE_STATUS_NAME,
  PIECE_STATUS_OPTIONS,
  PIECE_STATUS_TONE,
} from "@/app/studio/options";
import { BTN_QUIET, BTN_SOLID, STUDIO_CARD } from "@/components/studio/shell";
import type { ProductStatus } from "@/data/products";

/**
 * 作品一覧の本体（client）。チェックを入れた作品の状態をまとめて変える。
 *
 * **状態の選択欄は制御する**（`value` + `onChange`）。以前は `defaultValue` の select を
 * `<form action>` で送っていて、React 19 が送信後に form を初期値へ戻すため、保存は
 * 通っているのに選択欄が元の値（「完売」など）に戻って見えた（2026-09-29 に報告）。
 *
 * 表示する状態は `useOptimistic` で先に切り替え、Server Action が失敗したら自動で戻る。
 * 成功すると `revalidatePath` が新しい一覧を返し、props の状態が本物に揃う。
 *
 * 行のデータはサーバーで組んで渡す（`data/products.ts` を import するとカタログ本体が
 * client のバンドルに載る）。
 */

export type PieceRow = {
  slug: string;
  name: string;
  kanji: string;
  sku: string;
  /** 区分と大きさ（「ボトルバッグ・中」） */
  kind: string;
  thumb: string;
  /** 表示用の値札。未定なら null */
  price: string | null;
  priceOverridden: boolean;
  status: ProductStatus;
};

export type PieceGroup = { key: string; label: string; rows: PieceRow[] };

type Filter = ProductStatus | "all";
type Change = { slugs: string[]; status: ProductStatus };
type Message = { tone: "ok" | "error"; text: string };

export function PieceTable({ groups, disabled }: { groups: PieceGroup[]; disabled: boolean }) {
  const rows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);
  const base = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.slug, r.status])) as Record<string, ProductStatus>,
    [rows],
  );
  const [statuses, applyOptimistic] = useOptimistic(base, (state, change: Change) => {
    const next = { ...state };
    for (const slug of change.slugs) next[slug] = change.status;
    return next;
  });

  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [target, setTarget] = useState<ProductStatus>("available");
  const [message, setMessage] = useState<Message | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = (row: PieceRow) => filter === "all" || statuses[row.slug] === filter;
  const shown = rows.filter(visible);
  const chosen = shown.filter((r) => selected.has(r.slug));
  const unpriced = chosen.filter((r) => r.price == null).length;

  const counts = PIECE_STATUS_OPTIONS.map((o) => ({
    ...o,
    count: rows.filter((r) => statuses[r.slug] === o.value).length,
  })).filter((o) => o.count > 0 || o.value === filter);

  function pickFilter(next: Filter) {
    setFilter(next);
    // 見えなくなった行を選んだまま残すと、何点に効くのかが画面から読めなくなる。
    setSelected(new Set());
    setMessage(null);
  }

  function toggle(slugs: string[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const slug of slugs) {
        if (on) next.add(slug);
        else next.delete(slug);
      }
      return next;
    });
  }

  function change(slugs: string[], status: ProductStatus) {
    setMessage(null);
    startTransition(async () => {
      applyOptimistic({ slugs, status });
      const result = await setPiecesStatus(slugs, status);
      startTransition(() => {
        if (!result.ok) {
          setMessage({ tone: "error", text: result.error });
          return;
        }
        setMessage({
          tone: "ok",
          text:
            result.count === 1
              ? `${rows.find((r) => r.slug === slugs[0])?.name ?? "1 点"} を「${PIECE_STATUS_NAME[status]}」にしました`
              : `${result.count} 点を「${PIECE_STATUS_NAME[status]}」にしました`,
        });
        if (slugs.length > 1) setSelected(new Set());
      });
    });
  }

  function applyBulk() {
    if (chosen.length === 0) return;
    const ok = window.confirm(
      `${chosen.length} 点を「${PIECE_STATUS_NAME[target]}」にします。\n公開中のサイトにすぐ反映されます。よろしいですか？`,
    );
    if (ok) change(chosen.map((r) => r.slug), target);
  }

  const locked = disabled || pending;

  return (
    <div>
      {/* 絞り込み。状態ごとの数も兼ねる */}
      <div role="group" aria-label="状態で絞り込む" className="flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => pickFilter("all")} count={rows.length}>
          すべて
        </FilterChip>
        {counts.map((o) => (
          <FilterChip
            key={o.value}
            active={filter === o.value}
            onClick={() => pickFilter(o.value)}
            count={o.count}
            dot={PIECE_STATUS_COLOR[o.value]}
          >
            {PIECE_STATUS_NAME[o.value]}
          </FilterChip>
        ))}
      </div>

      {/* まとめて変える帯。スクロールしても上に残る */}
      <div className={`sticky top-0 z-20 mt-5 ${STUDIO_CARD} px-4 py-3.5 shadow-[0_1px_0_var(--color-line)] md:px-5`}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex cursor-pointer items-center gap-3 font-sans text-[14px] text-ivory">
            <Checkbox
              checked={shown.length > 0 && chosen.length === shown.length}
              indeterminate={chosen.length > 0 && chosen.length < shown.length}
              disabled={locked || shown.length === 0}
              onChange={(on) => toggle(shown.map((r) => r.slug), on)}
              label={filter === "all" ? "すべて選択" : "表示中をすべて選択"}
            />
            <span className="tabular-nums">
              {chosen.length > 0 ? (
                <>
                  <strong className="font-semibold">{chosen.length}</strong> 点を選択中
                </>
              ) : (
                <span className="text-mist">まとめて変える作品にチェック</span>
              )}
            </span>
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                aria-label="変更後のステータス"
                value={target}
                disabled={locked}
                onChange={(e) => setTarget(e.target.value as ProductStatus)}
                className="h-11 cursor-pointer appearance-none border border-line bg-field pl-3.5 pr-9 font-sans text-[14px] text-ivory outline-none transition-colors hover:border-bark focus:border-ivory disabled:cursor-not-allowed disabled:opacity-60"
              >
                {PIECE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Caret />
            </div>
            <button
              type="button"
              onClick={applyBulk}
              disabled={locked || chosen.length === 0}
              className={BTN_SOLID}
            >
              {pending ? "変更中…" : "に変更する"}
            </button>
            {chosen.length > 0 ? (
              <button type="button" onClick={() => setSelected(new Set())} className={BTN_QUIET}>
                選択を解除
              </button>
            ) : null}
          </div>
        </div>

        {target === "available" && unpriced > 0 ? (
          <p className="mt-3 font-sans text-[12.5px] leading-[1.7] text-clay">
            選んだうち {unpriced} 点は価格が未定です。購入可能にしても、価格を入れるまでカートには入りません。
          </p>
        ) : null}

        {message ? (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={`mt-3 flex items-center gap-2.5 font-sans text-[13px] leading-[1.7] ${
              message.tone === "error" ? "text-clay" : "text-moss"
            }`}
          >
            <span aria-hidden className={`h-1.5 w-1.5 shrink-0 ${message.tone === "error" ? "bg-clay" : "bg-moss"}`} />
            {message.text}
          </p>
        ) : null}
      </div>

      {/* 区分ごとの表 */}
      <div className="mt-8 space-y-10">
        {groups.map((group) => {
          const groupShown = group.rows.filter(visible);
          if (groupShown.length === 0) return null;
          const groupChosen = groupShown.filter((r) => selected.has(r.slug)).length;
          return (
            <section key={group.key} aria-label={group.label}>
              <div className="flex items-center gap-3 px-1 pb-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={groupChosen === groupShown.length}
                    indeterminate={groupChosen > 0 && groupChosen < groupShown.length}
                    disabled={locked}
                    onChange={(on) => toggle(groupShown.map((r) => r.slug), on)}
                    label={`${group.label}をすべて選択`}
                  />
                  <h2 className="font-sans text-[15px] font-semibold text-ivory">{group.label}</h2>
                </label>
                <span className="font-sans text-[13px] tabular-nums text-mist">{groupShown.length} 点</span>
              </div>

              <ul className={STUDIO_CARD}>
                {groupShown.map((row) => (
                  <PieceLine
                    key={row.slug}
                    row={row}
                    status={statuses[row.slug]}
                    checked={selected.has(row.slug)}
                    disabled={locked}
                    onCheck={(on) => toggle([row.slug], on)}
                    onStatus={(status) => change([row.slug], status)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {shown.length === 0 ? (
          <p className="font-sans text-[14px] text-mist">この状態の作品はありません。</p>
        ) : null}
      </div>
    </div>
  );
}

function PieceLine({
  row,
  status,
  checked,
  disabled,
  onCheck,
  onStatus,
}: {
  row: PieceRow;
  status: ProductStatus;
  checked: boolean;
  disabled: boolean;
  onCheck: (on: boolean) => void;
  onStatus: (status: ProductStatus) => void;
}) {
  return (
    <li
      className={`grid grid-cols-[24px_56px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-t border-line px-4 py-3.5 first:border-t-0 md:grid-cols-[24px_56px_minmax(0,1fr)_96px_236px_48px] md:px-5 ${
        checked ? "bg-ivory/5" : ""
      }`}
    >
      <Checkbox checked={checked} disabled={disabled} onChange={onCheck} label={`${row.name} を選択`} />

      <div className="relative h-14 w-14 overflow-hidden bg-field">
        <Image src={row.thumb} alt="" fill sizes="56px" className="object-cover" />
      </div>

      <div className="min-w-0">
        <Link
          href={`/studio/pieces/${row.slug}`}
          className="font-sans text-[16px] font-semibold text-ivory no-underline hover:underline hover:decoration-line hover:underline-offset-4"
        >
          {row.name}
          <span className="ml-2 font-jp text-[13px] font-normal text-mist">{row.kanji}</span>
        </Link>
        <p className="mt-1 truncate font-sans text-[12.5px] text-mist">
          {row.kind}
          <span className="mx-1.5 text-line" aria-hidden>
            ｜
          </span>
          <span className="font-mono text-[12px]">{row.sku}</span>
        </p>
      </div>

      <p className="col-start-3 font-sans text-[15px] tabular-nums text-ivory md:col-start-auto md:text-right">
        {row.price ?? <span className="text-[13px] text-mist">価格未定</span>}
        {row.priceOverridden ? (
          <span className="ml-1.5 font-sans text-[11px] text-clay" title="管理画面で上書きした価格">
            上書き
          </span>
        ) : null}
      </p>

      <div className="col-start-3 md:col-start-auto">
        <div className="relative">
          <span
            aria-hidden
            className={`pointer-events-none absolute left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 ${PIECE_STATUS_COLOR[status]}`}
          />
          <select
            aria-label={`${row.name} のステータス`}
            value={status}
            disabled={disabled}
            onChange={(e) => onStatus(e.target.value as ProductStatus)}
            className={`h-10 w-full cursor-pointer appearance-none border pl-7 pr-8 font-sans text-[13.5px] outline-none transition-colors focus:ring-2 focus:ring-ivory/10 disabled:cursor-not-allowed disabled:opacity-60 ${PIECE_STATUS_TONE[status]}`}
          >
            {PIECE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Caret />
        </div>
      </div>

      <Link
        href={`/studio/pieces/${row.slug}`}
        className="col-start-3 font-sans text-[13px] text-mist no-underline transition-colors hover:text-ivory md:col-start-auto md:text-right"
      >
        編集
      </Link>
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  dot,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 border px-3.5 font-sans text-[13.5px] transition-colors ${
        active
          ? "border-ivory bg-ivory text-sumi"
          : "border-line bg-card text-ivory hover:border-bark"
      }`}
    >
      {dot ? <span aria-hidden className={`h-1.5 w-1.5 ${dot}`} /> : null}
      {children}
      <span className={`tabular-nums ${active ? "text-sumi/70" : "text-mist"}`}>{count}</span>
    </button>
  );
}

/** 素の checkbox。一部だけ選んだ状態（indeterminate）は属性では書けないので ref で置く。 */
function Checkbox({
  checked,
  indeterminate = false,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={(e) => onChange(e.target.checked)}
      className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--color-ivory)] disabled:cursor-not-allowed"
    />
  );
}

function Caret() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[10px] text-mist"
    >
      ▾
    </span>
  );
}
