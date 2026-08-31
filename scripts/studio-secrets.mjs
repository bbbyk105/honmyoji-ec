#!/usr/bin/env node
/**
 * /studio のアカウントを作る。
 *
 *   npm run studio:secrets        1 人目（STUDIO_EMAIL / STUDIO_PASSWORD_HASH）
 *   npm run studio:secrets 2      2 人目（STUDIO_EMAIL_2 / STUDIO_PASSWORD_HASH_2）
 *   npm run studio:secrets 3      3 人目 … 5 まで
 *
 * パスワードは画面に出ないよう伏せて受け取り、scrypt のハッシュだけを出す。
 * 出てきた行を .env と Vercel の Environment Variables に入れる。
 * 平文のパスワードはどこにも保存されない（人が憶えるだけ）。
 *
 * `STUDIO_SESSION_SECRET` は全員で共有する一本の署名鍵なので、1 人目のときだけ
 * 出す。作り直すと、開いていたセッションが全部切れる。
 */

import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const slot = Number(process.argv[2] ?? 1);
if (!Number.isInteger(slot) || slot < 1 || slot > 5) {
  console.error("何人目かを 1〜5 で指定してください（例: npm run studio:secrets 2）");
  process.exit(1);
}
const suffix = slot === 1 ? "" : `_${slot}`;

function ask(query, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // 打った文字を端末に返さない。返すのは問いかけの一行だけ
      rl._writeToOutput = (chunk) => {
        if (chunk.includes(query)) rl.output.write(query);
      };
    }
    rl.question(query, (answer) => {
      if (hidden) rl.output.write("\n");
      rl.close();
      resolve(answer.trim());
    });
  });
}

const email = await ask(`${slot} 人目のメールアドレス: `);
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("\nメールアドレスの形になっていません。");
  process.exit(1);
}

const password = await ask("パスワード（表示されません）: ", { hidden: true });
if (password.length < 10) {
  console.error("\n短すぎます。10 文字以上にしてください。");
  process.exit(1);
}

const confirm = await ask("もう一度: ", { hidden: true });
if (password !== confirm) {
  console.error("\n一致しませんでした。");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);

console.log(`
# ------------------------------------------------------------------
# .env と Vercel の Environment Variables に入れる（${slot} 人目）
# ------------------------------------------------------------------
STUDIO_EMAIL${suffix}=${email.toLowerCase()}
STUDIO_PASSWORD_HASH${suffix}=scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}
`);

if (slot === 1) {
  console.log(`# 署名鍵は全員で共有する一本。まだ無ければこれも入れる。
# 作り直すと、開いていたセッションは全部切れます（乗っ取りが疑わしいときの非常口）。
STUDIO_SESSION_SECRET=${randomBytes(32).toString("base64url")}
`);
}

console.log("# 古い STUDIO_PASSWORD（平文）が残っていたら消してください。\n");
