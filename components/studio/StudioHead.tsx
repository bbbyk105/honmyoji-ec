import Link from "next/link";
import type { ReactNode } from "react";

import { LINK_QUIET, STUDIO_HEAD } from "@/components/studio/shell";

/**
 * 画面の見出し。数字（kpis）は見出しの下に大きく出す —— いちばん見たい数を、
 * 小さな字で帯に詰めない（fujisan の管理画面と同じ組み）。
 */
export function StudioHead({
  title,
  sub,
  lead,
  back,
  action,
  kpis,
}: {
  title: ReactNode;
  /** 見出しのすぐ下の一行（SKU・状態など） */
  sub?: ReactNode;
  /** この画面で何ができるかの短い説明 */
  lead?: ReactNode;
  back?: { href: string; label: string };
  /** 見出しの右肩（公開ページへのリンクなど） */
  action?: ReactNode;
  kpis?: ReactNode;
}) {
  return (
    <div className={STUDIO_HEAD}>
      {back ? (
        <Link href={back.href} className={LINK_QUIET}>
          ← {back.label}
        </Link>
      ) : null}
      <div className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-3 ${back ? "mt-4" : ""}`}>
        <div className="min-w-0">
          <h1 className="font-sans text-[26px] font-semibold leading-[1.3] text-ivory md:text-[30px]">
            {title}
          </h1>
          {sub ? <div className="mt-2 font-sans text-[13.5px] text-mist">{sub}</div> : null}
        </div>
        {action}
      </div>
      {lead ? (
        <p className="mt-4 max-w-[46em] font-sans text-[14px] leading-[1.85] text-bone">{lead}</p>
      ) : null}
      {kpis ? (
        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4 md:gap-x-12">{kpis}</dl>
      ) : null}
    </div>
  );
}

/** 見出しの下の数字一つ。対応が要る数字だけ色を付ける（0 件なら付けない）。 */
export function Kpi({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: "alert";
}) {
  return (
    <div className="border-t border-line pt-3">
      <dt className="font-sans text-[13px] text-mist">{label}</dt>
      <dd
        className={`mt-1.5 font-display text-[30px] font-light leading-none tabular-nums md:text-[34px] ${
          tone === "alert" ? "text-clay" : "text-ivory"
        }`}
      >
        {value}
        {suffix ? <span className="ml-1.5 font-sans text-[13px] text-mist">{suffix}</span> : null}
      </dd>
    </div>
  );
}
