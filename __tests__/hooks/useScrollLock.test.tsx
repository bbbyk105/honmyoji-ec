import { renderHook } from "@testing-library/react";

import { startLenis, stopLenis } from "@/components/motion/lenis";
import { lockScroll, useScrollLock } from "@/hooks/useScrollLock";

jest.mock("@/components/motion/lenis", () => ({
  stopLenis: jest.fn(),
  startLenis: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  document.body.style.overflow = "";
});

describe("lockScroll", () => {
  it("最初の一人で止め、最後の一人が離れたときだけ外す", () => {
    const releaseMenu = lockScroll();
    const releaseCart = lockScroll();
    expect(document.body.style.overflow).toBe("hidden");
    expect(stopLenis).toHaveBeenCalledTimes(1);

    // メニューを閉じても、カートが開いている間は止まったまま
    releaseMenu();
    expect(document.body.style.overflow).toBe("hidden");
    expect(startLenis).not.toHaveBeenCalled();

    releaseCart();
    expect(document.body.style.overflow).toBe("");
    expect(startLenis).toHaveBeenCalledTimes(1);
  });

  it("同じ release を二度呼んでも一回ぶんしか数えない", () => {
    const releaseA = lockScroll();
    const releaseB = lockScroll();
    releaseA();
    releaseA();
    expect(document.body.style.overflow).toBe("hidden");
    releaseB();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("useScrollLock", () => {
  it("active の間だけ止め、false に戻るか外れたら離す", () => {
    const { rerender, unmount } = renderHook(({ active }) => useScrollLock(active), {
      initialProps: { active: false },
    });
    expect(document.body.style.overflow).toBe("");

    rerender({ active: true });
    expect(document.body.style.overflow).toBe("hidden");

    rerender({ active: false });
    expect(document.body.style.overflow).toBe("");

    rerender({ active: true });
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("二つの部品が同時に止めても、片方が閉じただけでは外れない", () => {
    const menu = renderHook(({ active }) => useScrollLock(active), { initialProps: { active: true } });
    const cart = renderHook(({ active }) => useScrollLock(active), { initialProps: { active: true } });

    menu.rerender({ active: false });
    expect(document.body.style.overflow).toBe("hidden");

    cart.rerender({ active: false });
    expect(document.body.style.overflow).toBe("");
  });
});
