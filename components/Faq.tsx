import { useTranslations } from "next-intl";

interface FaqItem {
  id: string;
  q: string;
  a?: string;
  list?: Array<{ name: string; text: string }>;
}

const EMAIL_RE = /([\w.+-]+@[\w-]+\.[\w.-]*\w)/;

/** Metindeki e-posta adresini tıklanır yapar. */
function withMailLinks(text: string) {
  return text.split(EMAIL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={`mailto:${part}`} className="font-semibold text-primary hover:underline break-all">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

/** Sıkça sorulan sorular (ana sayfanın sonu). Yerel `<details>`: JavaScript gerektirmez, yanıtlar sayfa kaynağında yer alır. */
export function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as FaqItem[];

  return (
    <section className="py-10 md:py-14 scroll-mt-20" id="sss" aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-headline-lg-mobile md:text-headline-lg text-on-background text-center mb-8">
        {t("title")}
      </h2>
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {items.map((item) => (
          <details key={item.id} className="group bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-soft-sm">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden px-5 py-4 min-h-[56px] rounded-2xl text-body-md font-semibold text-on-background hover:text-primary transition-colors">
              <span>{item.q}</span>
              <span className="material-symbols-outlined text-xl text-primary shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true">
                expand_more
              </span>
            </summary>
            <div className="px-5 pb-5 text-body-md text-on-surface-variant leading-relaxed">
              {item.a && <p>{withMailLinks(item.a)}</p>}
              {item.list && (
                <ul className="flex flex-col gap-2">
                  {item.list.map((entry) => (
                    <li key={entry.name}>
                      <strong className="font-bold text-on-background">{entry.name}:</strong> {entry.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
