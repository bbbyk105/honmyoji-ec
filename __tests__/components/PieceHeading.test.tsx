import { render, screen } from "@testing-library/react";

import { PieceHeading } from "@/components/collection/PieceHeading";

// 作品ページの h1 は名前だけ（"Ai"）だと何の品か分からないので、上の区分の行も h1 に入れる。
// 見た目は今までと同じ（区分の小さな行の下に大きな名前）。

it("h1 に区分と名前の両方が入り、語がくっつかない", () => {
  render(<PieceHeading kind="Tatami-beri bottle bag · Medium" name="Ai" />);
  const h1 = screen.getByRole("heading", { level: 1 });

  expect(h1.textContent).toBe("Tatami-beri bottle bag · Medium Ai");
});
