/**
 * 構造化データを body に出す（lib/seo.ts が組む）。`metadata.other` に入れると `<meta>` になり、
 * Google に読まれない。`<` を逃がして、文字列の中から `</script>` で抜けられないようにする。
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
