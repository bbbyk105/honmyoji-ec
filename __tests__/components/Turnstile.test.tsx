// 人が送っているかの確認の枠（Cloudflare Turnstile）。スクリプトは本物を読まず、<script> に
// load / error を投げ、window.turnstile に偽物を置く。
//
// 読み込みの状態をモジュールが覚えていると、前のテストの「もう読んだ」が次に漏れるので、
// テストごとに React・testing-library・部品をまとめて読み直す（React を一つに揃えるため一緒に）。

// 読み込むと afterEach を登録する本体ではなく、後始末を自分で呼ぶ /pure を使う
type Lib = typeof import("@testing-library/react/pure");
let act: Lib["act"];
let render: Lib["render"];
let screen: Lib["screen"];
let cleanup: Lib["cleanup"];
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let StrictMode: typeof import("react").StrictMode;
let Turnstile: typeof import("@/components/site/Turnstile").Turnstile;

type Options = Record<string, unknown> & {
  callback?: (token: string) => void;
  "error-callback"?: (code: string) => void;
};

let live: Map<string, Options>;
let seq = 0;
const api = {
  render: jest.fn((_el: HTMLElement, options: Options) => {
    const id = `w${++seq}`;
    live.set(id, options);
    return id;
  }),
  reset: jest.fn<void, [string]>(),
  remove: jest.fn((id: string) => {
    live.delete(id);
  }),
};

const EMAIL = "info@honmyoujifuji.com";
const script = () =>
  document.querySelector<HTMLScriptElement>('script[src^="https://challenges.cloudflare.com/turnstile/"]');

/** スクリプトを読み終えたことにする */
async function finishLoading() {
  await act(async () => {
    window.turnstile = api;
    script()!.dispatchEvent(new Event("load"));
  });
}

const only = () => [...live.values()][0];

afterEach(() => cleanup());

beforeEach(() => {
  jest.isolateModules(() => {
    ({ act, render, screen, cleanup } = jest.requireActual<Lib>("@testing-library/react/pure"));
    ({ StrictMode } = jest.requireActual<typeof import("react")>("react"));
    ({ Turnstile } = jest.requireActual<typeof import("@/components/site/Turnstile")>("@/components/site/Turnstile"));
  });
  live = new Map();
  api.render.mockClear();
  api.reset.mockClear();
  api.remove.mockClear();
  delete window.turnstile;
  document.querySelectorAll("script").forEach((el) => el.remove());
});

describe("Turnstile", () => {
  it("スクリプトを読み終えたら、サイトキーと action を渡して枠を一つ描き、外すときに片付ける", async () => {
    const { unmount } = render(<Turnstile action="contact" email={EMAIL} />);
    expect(script()).not.toBeNull();
    await finishLoading();

    expect(live.size).toBe(1);
    expect(only()).toMatchObject({ sitekey: "1x00000000000000000000AA", action: "contact", theme: "light" });

    unmount();
    expect(live.size).toBe(0);
  });

  it("読み終えたあとで置き直しても（StrictMode の付け外しでも）、枠が一つ残る", async () => {
    const first = render(<Turnstile action="contact" email={EMAIL} />);
    await finishLoading();
    first.unmount();

    await act(async () => {
      render(
        <StrictMode>
          <Turnstile action="contact" email={EMAIL} />
        </StrictMode>,
      );
    });

    expect(live.size).toBe(1);
  });

  it("読み込み中にページを離れて戻っても、戻った方に枠を描く", async () => {
    const first = render(<Turnstile action="contact" email={EMAIL} />);
    first.unmount();
    render(<Turnstile action="contact" email={EMAIL} />);
    await finishLoading();

    expect(live.size).toBe(1);
  });

  it("resetKey が null 以外の値に変わったときだけ取り直す", async () => {
    const { rerender } = render(<Turnstile action="contact" email={EMAIL} resetKey={null} />);
    await finishLoading();

    rerender(<Turnstile action="contact" email={EMAIL} resetKey={null} />);
    expect(api.reset).not.toHaveBeenCalled();

    rerender(<Turnstile action="contact" email={EMAIL} resetKey={{ attempt: 1 }} />);
    expect(api.reset).toHaveBeenCalledTimes(1);

    // 入力漏れで断られた（印はまだ使っていない）
    rerender(<Turnstile action="contact" email={EMAIL} resetKey={null} />);
    expect(api.reset).toHaveBeenCalledTimes(1);

    rerender(<Turnstile action="contact" email={EMAIL} resetKey={{ attempt: 2 }} />);
    expect(api.reset).toHaveBeenCalledTimes(2);
  });

  it("スクリプトが読めないときは、直接メールするよう出す（送っても必ず断られるので）", async () => {
    render(<Turnstile action="contact" email={EMAIL} />);
    await act(async () => {
      script()!.dispatchEvent(new Event("error"));
    });

    expect(screen.getByRole("status").textContent).toContain(EMAIL);
  });

  it("枠がエラーを返したら同じ案内を出し、通れば消す", async () => {
    render(<Turnstile action="contact" email={EMAIL} />);
    await finishLoading();

    act(() => only()["error-callback"]?.("110200"));
    expect(screen.getByRole("status").textContent).toContain(EMAIL);

    act(() => only().callback?.("token"));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
