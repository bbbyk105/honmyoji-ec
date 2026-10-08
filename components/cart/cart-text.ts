import type { Lang } from "@/lib/lang";

/**
 * カートの文言。言語はブラウザの設定（`hooks/useBrowserLang.ts`）。
 * 日本語は店の画面でふつうに使う言葉にする（「購入手続きへ」「小計」「削除」）。
 */
type CartText = {
  title: string;
  dialogLabel: string;
  close: string;
  closeLabel: string;
  empty: string;
  priceToCome: string;
  unavailable: string;
  remove: string;
  subtotal: string;
  noteCheckout: string;
  noteContact: string;
  opening: string;
  checkout: string;
  askAbout: string;
  sendCart: string;
  clearAll: string;
  viewCollection: string;
};

export const CART_TEXT: Record<Lang, CartText> = {
  en: {
    title: "Cart",
    dialogLabel: "Cart",
    close: "Close",
    closeLabel: "Close cart",
    empty:
      "Your cart is empty. Add a piece from the collection, then take it to checkout — or write to us first if you would rather ask.",
    priceToCome: "Price to come",
    unavailable: "No longer available",
    remove: "Remove",
    subtotal: "Subtotal",
    noteCheckout: "Shipping is added at the next step. Payment is handled by Stripe — we never see your card.",
    noteContact: "Nothing is charged here. Send us your cart and a person writes back with payment details.",
    opening: "Opening checkout",
    checkout: "Check out",
    askAbout: "Ask about these",
    sendCart: "Send this cart",
    clearAll: "Clear all",
    viewCollection: "View the collection",
  },
  ja: {
    title: "カート",
    dialogLabel: "カート",
    close: "閉じる",
    closeLabel: "カートを閉じる",
    empty:
      "カートは空です。作品一覧から選んで、購入手続きへお進みください。先に聞いておきたいことがあれば、お問い合わせからどうぞ。",
    priceToCome: "価格は準備中",
    unavailable: "現在お求めいただけません",
    remove: "削除",
    subtotal: "小計",
    noteCheckout: "送料は次の画面で加わります。お支払いは Stripe が扱うため、カードの情報が当店に届くことはありません。",
    noteContact: "ここでお支払いは発生しません。カートの内容を送っていただければ、お支払いの方法をメールでご案内します。",
    opening: "決済画面を開いています",
    checkout: "購入手続きへ",
    askAbout: "この作品について問い合わせる",
    sendCart: "この内容で問い合わせる",
    clearAll: "すべて削除",
    viewCollection: "作品一覧を見る",
  },
};
