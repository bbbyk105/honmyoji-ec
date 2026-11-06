/**
 * @jest-environment node
 */

// 外のサービスに登録する API の URL は末尾スラッシュなしが正規形。OpenNext 1.20.16
// （@opennextjs/aws 4.1.15）からは /api も末尾スラッシュ付きを 308 で返し、ハンドラに届かない。
// 送り手が転送に従う保証は無いので、手順書の URL がこの形のままで、その先にハンドラがあることを見張る。

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import nextConfig from "@/next.config";

const DOCS = ["docs/studio.md", "docs/microcms.md"];

const fromRoot = (...path: string[]) => join(process.cwd(), ...path);
const read = (file: string) => readFileSync(fromRoot(file), "utf8");

/** 文中の API のパス（クエリの手前まで）。末尾の `/` も含めて拾う。 */
const apiPaths = (file: string) => [...read(file).matchAll(/\/api(?:\/[\w-]+)+\/?/g)].map(([path]) => path);

it("末尾スラッシュなしが正規形のまま（設定を変えると登録済みの URL の扱いが変わる）", () => {
  expect(nextConfig.trailingSlash).toBeFalsy();
  expect(nextConfig.skipTrailingSlashRedirect).toBeFalsy();
});

describe.each(DOCS)("%s", (file) => {
  it("登録する URL の決まりが書いてある", () => {
    expect(read(file)).toContain("末尾スラッシュなし");
  });

  it("API の URL はどれも末尾スラッシュなしで、その先にハンドラがある", () => {
    const paths = apiPaths(file);
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path).not.toMatch(/\/$/);
      expect(existsSync(fromRoot("app", path, "route.ts"))).toBe(true);
    }
  });
});
