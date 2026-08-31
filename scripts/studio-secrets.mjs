#!/usr/bin/env node
/**
 * /studio のアカウントを作る。
 *
 *   npm run studio:secrets
 *
 * パスワードは画面に出ないよう伏せて受け取り、scrypt のハッシュだけを出す。
 * 出てきた三行を .env.local と Vercel の Environment Variables に入れる。
 * 平文のパスワードはどこにも保存されない（人が憶えるだけ）。
 */

import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

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

const email = await ask("メールアドレス: ");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("\nメールアドレスの形になっていません。");
  process.exit(1);
}

const password = await ask("パスワード（表示されません）: ", { hidden: true });
if (password.length < 12) {
  console.error("\n短すぎます。12 文字以上にしてください。");
  process.exit(1);
}

const confirm = await ask("もう一度: ", { hidden: true });
if (password !== confirm) {
  console.error("\n一致しませんでした。");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
const sessionSecret = randomBytes(32).toString("base64url");

console.log(`
# ------------------------------------------------------------------
# .env.local と Vercel の Environment Variables に入れる
# ------------------------------------------------------------------
STUDIO_EMAIL=${email.toLowerCase()}
STUDIO_PASSWORD_HASH=scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}
STUDIO_SESSION_SECRET=${sessionSecret}

# 古い STUDIO_PASSWORD（平文）が残っていたら消してください。
# STUDIO_SESSION_SECRET を変えると、開いていたセッションは全部切れます。
`);
