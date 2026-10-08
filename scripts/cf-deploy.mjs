#!/usr/bin/env node
/**
 * Cloudflare Workers（OpenNext）へのビルドとデプロイ。
 *
 *   npm run deploy              ビルドして Worker に上げる
 *   npm run deploy -- --dry     ビルドだけ（上げない）
 *
 * OpenNext は、プロジェクトにある `.env` / `.env.local` / `.env.production` … を
 * **値ごと Worker の束に焼き込む**（`.open-next/cloudflare/next-env.mjs`）。止める設定は無い。
 * 手元の .env には Stripe の本番の鍵まで入っているので、ここでは git が追っているファイル
 * （と、まだ追っていないが無視もしていないファイル）だけを一時ディレクトリに写してビルドする。
 * `.env*` は .gitignore で外れているので写らない。
 *
 * 秘密は Cloudflare の secrets に入れる（`npx wrangler secret put <NAME>`）。
 * `npx opennextjs-cloudflare deploy` をプロジェクトで直に叩かないこと —— 手元の .env が載る。
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dry = process.argv.includes("--dry");
const root = process.cwd();
const dir = mkdtempSync(join(tmpdir(), "honmyoji-ec-cf-"));
const run = (cmd, args) => execFileSync(cmd, args, { cwd: dir, stdio: "inherit" });

try {
  const files = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    // 消したがまだコミットしていないファイルは一覧に残るので、無いものは飛ばす
    .filter((file) => file && existsSync(join(root, file)));
  for (const file of files) {
    cpSync(join(root, file), join(dir, file), { recursive: true });
  }

  const leaked = readdirSync(dir).filter((name) => name.startsWith(".env") && name !== ".env.example");
  if (leaked.length > 0) {
    throw new Error(`写しに ${leaked.join(", ")} が入っています。.gitignore を確かめてください`);
  }

  run("npm", ["ci", "--no-audit", "--no-fund"]);
  run("npx", ["opennextjs-cloudflare", "build"]);
  if (!dry) run("npx", ["opennextjs-cloudflare", "deploy"]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
