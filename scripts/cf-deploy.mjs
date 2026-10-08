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
 *
 * ただし DB と microCMS の値だけは、ビルドの子プロセスに**環境変数として**渡す（`BUILD_ENV_KEYS`）。
 * 作り置きのページ（一覧・商品・Blog）はビルドで作られ、デプロイのたびに R2 のキャッシュを
 * 上書きする。DB に届かないまま作ると、次の再検証まで（10 分）コード側の値と Blog の予備記事が
 * 出る（2026-10-08 に、管理画面で販売中にした作品が「Sold out」と出た）。OpenNext が Worker に
 * 焼き込むのは .env* ファイルの中身だけなので、環境変数は載らない。念のため、上げる前に
 * ビルドの出力に秘密の値が入っていないかを確かめる。
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnv } from "node:util";

const dry = process.argv.includes("--dry");
const root = process.cwd();
const dir = mkdtempSync(join(tmpdir(), "honmyoji-ec-cf-"));
const run = (cmd, args, env = {}) =>
  execFileSync(cmd, args, { cwd: dir, stdio: "inherit", env: { ...process.env, ...env } });

/** ビルドの時点で読ませる値。作り置きのページが DB と microCMS の中身で作られるように。 */
const BUILD_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "MICROCMS_SERVICE_DOMAIN",
  "MICROCMS_API_KEY",
  "MICROCMS_BLOG_ENDPOINT",
];
/** ビルドの出力に入っていてはいけない値（URL とドメインは公開の情報なので見ない）。 */
const SECRET_KEYS = ["SUPABASE_SERVICE_ROLE_KEY", "MICROCMS_API_KEY"];

/** 手元の .env* から BUILD_ENV_KEYS だけを拾う。優先順は Next と同じ（後ろほど強い）。 */
function buildEnv() {
  const merged = {};
  for (const name of [".env", ".env.production", ".env.local", ".env.production.local"]) {
    const file = join(root, name);
    if (existsSync(file)) Object.assign(merged, parseEnv(readFileSync(file, "utf8")));
  }
  return Object.fromEntries(BUILD_ENV_KEYS.filter((key) => merged[key]).map((key) => [key, merged[key]]));
}

/** ビルドの出力（Worker に上がるもの全部）に秘密の値がそのまま入っていたら止める。 */
function assertNoSecrets(outDir, env) {
  const values = SECRET_KEYS.map((key) => env[key]).filter(Boolean).map((value) => Buffer.from(value));
  if (values.length === 0) return;
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.isFile()) continue;
      const content = readFileSync(path);
      if (values.some((value) => content.includes(value))) {
        throw new Error(`ビルドの出力に秘密の値が入っています: ${path.slice(dir.length + 1)}`);
      }
    }
  };
  walk(outDir);
}

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
  const env = buildEnv();
  console.log(`ビルドに渡す値: ${Object.keys(env).join(", ") || "なし（作り置きのページはコード側の値になる）"}`);
  run("npx", ["opennextjs-cloudflare", "build"], env);
  assertNoSecrets(join(dir, ".open-next"), env);
  if (!dry) run("npx", ["opennextjs-cloudflare", "deploy"]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
