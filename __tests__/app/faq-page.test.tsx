/**
 * @jest-environment node
 */

import { renderToStaticMarkup } from "react-dom/server";

import FaqPage from "@/app/(site)/faq/page";
import { faq } from "@/data/site";

// FAQ の問いは見出し（h2）。<summary> の中の文字だけだと、ページの構造が h1 一つになる。

it("問いを一つずつ h2 にする（<summary> の中に置き、見た目は変えない）", () => {
  const html = renderToStaticMarkup(<FaqPage />);
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, ""));

  expect(h2).toHaveLength(faq.length);
  expect(h2[0]).toContain(faq[0].q);
  expect(html).toMatch(/<summary[^>]*>(?:(?!<\/summary>)[\s\S])*<h2/);
});
