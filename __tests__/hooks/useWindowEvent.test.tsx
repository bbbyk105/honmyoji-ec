import { fireEvent, renderHook } from "@testing-library/react";

import { useWindowEvent } from "@/hooks/useWindowEvent";

function pressEscape() {
  fireEvent.keyDown(window, { key: "Escape" });
}

describe("useWindowEvent", () => {
  it("最新の handler を呼ぶ（描画のたびに付け直さない）", () => {
    const add = jest.spyOn(window, "addEventListener");
    const first = jest.fn();
    const second = jest.fn();

    const { rerender } = renderHook(({ handler }) => useWindowEvent("keydown", handler), {
      initialProps: { handler: first },
    });
    const keydownAdds = () => add.mock.calls.filter(([type]) => type === "keydown").length;
    const added = keydownAdds();

    rerender({ handler: second });
    pressEscape();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(keydownAdds()).toBe(added);
    add.mockRestore();
  });

  it("enabled が false の間は呼ばない", () => {
    const handler = jest.fn();
    const { rerender } = renderHook(({ enabled }) => useWindowEvent("keydown", handler, { enabled }), {
      initialProps: { enabled: false },
    });

    pressEscape();
    expect(handler).not.toHaveBeenCalled();

    rerender({ enabled: true });
    pressEscape();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("外れたら listener も外す", () => {
    const handler = jest.fn();
    const { unmount } = renderHook(() => useWindowEvent("keydown", handler));
    unmount();
    pressEscape();
    expect(handler).not.toHaveBeenCalled();
  });
});
