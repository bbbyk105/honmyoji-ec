/**
 * @jest-environment node
 */

import { renderToString } from "react-dom/server";

import { ContactForm } from "@/app/(site)/contact/ContactForm";

// JS を読み終える前（hydration の前）に送られたとき、素の GET にならないこと。
// action も method も無い form は、名前・メール・本文を `/contact?name=…&message=…` に載せて送る ——
// URL・ブラウザの履歴・Cloudflare のログに残る。

jest.mock("@/app/(site)/contact/actions", () => ({ sendInquiry: jest.fn() }));
jest.mock("@/components/site/Turnstile", () => ({ Turnstile: () => null }));

it("サーバーで描いた form に action が付いている（素の GET で送らない）", () => {
  const html = renderToString(
    <ContactForm email="info@honmyoujifuji.com" product={null} subject="question" subjects={[{ value: "question", label: "Question" }]} />,
  );
  const form = /<form[^>]*>/.exec(html)?.[0] ?? "";

  expect(form).toMatch(/\saction="/);
  expect(form).not.toMatch(/method="get"/i);
});
