import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Cloudflare Workers では、モジュールを読み込む時間がそのまま 1 アクセスの CPU 時間に乗る。
  // 重いものを外枠や全ページから読まないための柵（2026-10-08）。
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/stripe",
              message:
                "Stripe の SDK は読むだけで 80ms かかる。決済が使えるかや送料は @/lib/stripe-config から。SDK が要るなら関数の中で await import() する。",
            },
            {
              name: "stripe",
              message: "Stripe の SDK は @/lib/stripe だけが読む（読み込みに 80ms かかるので、読む場所を一つに絞る）。",
            },
            {
              name: "@supabase/supabase-js",
              message: "DB は @/lib/supabase の db()（postgrest-js）から。supabase-js は読み込みに 32ms かかる。",
            },
          ],
        },
      ],
    },
  },
  // SDK を呼ぶページとルートだけは上で読んでよい（そのページを開いたときしか読まれない）
  {
    files: ["lib/stripe.ts", "app/api/stripe/webhook/route.ts", "app/(site)/checkout/thank-you/page.tsx"],
    rules: { "no-restricted-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // OpenNext / wrangler の書き出し
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
