/**
 * 確認の印（Cloudflare Turnstile の token）が入るフォームの欄の名前（Turnstile の既定）。
 * フォーム（client）と照合（server、lib/turnstile.ts）の両方が読むので、どちらの印も付けない
 * モジュールに置く（"use client" のファイルから定数を出すと、サーバーでは文字列にならない）。
 */
export const TURNSTILE_FIELD = "cf-turnstile-response";
