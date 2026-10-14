import { act, fireEvent, render, screen } from "@testing-library/react";

import { ContactForm } from "@/app/(site)/contact/ContactForm";

// お問い合わせフォーム。断られて戻ってきたときに、お客さまが書いた本文と選んだ件名を消さないこと。
// React 19 は <form action={…}> の action が終わると、制御していない欄を初期値に戻す ——
// 入力漏れや確認（Turnstile）で断られるたびに、長い本文が空になっていた。

const sendInquiry = jest.fn();
jest.mock("@/app/(site)/contact/actions", () => ({
  sendInquiry: (...args: unknown[]) => sendInquiry(...args),
}));

// 確認の枠は Cloudflare のスクリプトを読むので、ここでは印の入った欄だけを置き、渡された resetKey を記録する
const resetKeys: unknown[] = [];
jest.mock("@/components/site/Turnstile", () => ({
  Turnstile: ({ resetKey }: { resetKey?: unknown }) => {
    resetKeys.push(resetKey);
    return <input type="hidden" name="cf-turnstile-response" value="token-from-widget" />;
  },
}));

const subjects = [
  { value: "question", label: "Question about a piece" },
  { value: "custom", label: "Custom-made order" },
];

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement;

async function send() {
  await act(async () => {
    fireEvent.submit(screen.getByRole("button", { name: /send/i }).closest("form")!);
  });
}

beforeEach(() => {
  sendInquiry.mockReset();
  resetKeys.length = 0;
});

describe("ContactForm", () => {
  it("断られて戻ってきても、書いた本文と選んだ件名が残る", async () => {
    sendInquiry.mockResolvedValue({ status: "error", message: "Please try again." });
    render(<ContactForm email="info@honmyoujifuji.com" product={null} subject="question" subjects={subjects} />);

    fireEvent.change(field("Subject"), { target: { value: "custom" } });
    fireEvent.change(field("Name"), { target: { value: "Ada" } });
    fireEvent.change(field("Email"), { target: { value: "ada@example.com" } });
    fireEvent.change(field("Message"), { target: { value: "A tall bag for a sake bottle, in deep green." } });
    await send();

    expect(screen.getByRole("alert").textContent).toBe("Please try again.");
    expect(field("Message").value).toBe("A tall bag for a sake bottle, in deep green.");
    expect(field("Name").value).toBe("Ada");
    expect(field("Email").value).toBe("ada@example.com");
    expect(field("Subject").value).toBe("custom");
  });

  it("入力漏れで断られたときは印を取り直さない（サーバーは印を使う前に断っている）", async () => {
    sendInquiry.mockResolvedValue({
      status: "error",
      message: "Please check the highlighted fields.",
      errors: { email: "Please enter a valid email address." },
    });
    render(<ContactForm email="info@honmyoujifuji.com" product={null} subject="question" subjects={subjects} />);
    await send();

    // 取り直すと、怪しいと判定された人にはチェックボックスがまた出て、直してすぐ送ると印が空になる
    expect(resetKeys.at(-1) ?? null).toBeNull();
  });

  it("確認や送信で断られたとき（印を使ったあと）は、断られるたびに印を取り直す", async () => {
    sendInquiry
      .mockResolvedValueOnce({ status: "error", message: "We could not confirm this was sent by a person." })
      .mockResolvedValueOnce({ status: "error", message: "We could not send your message." });
    render(<ContactForm email="info@honmyoujifuji.com" product={null} subject="question" subjects={subjects} />);

    await send();
    const first = resetKeys.at(-1);
    await send();
    const second = resetKeys.at(-1);

    expect(first).not.toBeNull();
    expect(first).not.toBeUndefined();
    expect(second).not.toBe(first);
  });

  it("確認の印を一緒に送る", async () => {
    sendInquiry.mockResolvedValue({ status: "sent", message: "Thank you." });
    render(<ContactForm email="info@honmyoujifuji.com" product={null} subject="question" subjects={subjects} />);

    fireEvent.change(field("Name"), { target: { value: "Ada" } });
    await send();

    expect(sendInquiry).toHaveBeenCalledTimes(1);
    const formData = sendInquiry.mock.calls[0][1] as FormData;
    expect(formData.get("cf-turnstile-response")).toBe("token-from-widget");
    expect(formData.get("name")).toBe("Ada");
    expect(screen.getByText("Thank you.")).toBeTruthy();
  });
});
