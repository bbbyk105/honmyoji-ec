import { revalidatePath } from "next/cache";

/**
 * 作品が出る公開ページを作り直す（価格・ステータス・文言が変わったとき、売れたとき）。
 * 管理画面の保存と Webhook の両方がこれを呼ぶ —— ページを足したら、ここだけ直す。
 */
export function revalidateCatalogPages(): void {
  revalidatePath("/");
  revalidatePath("/collection");
  revalidatePath("/collection/[slug]", "page");
  revalidatePath("/contact");
}
