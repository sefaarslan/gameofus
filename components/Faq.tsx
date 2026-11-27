import { useLocale, useTranslations } from "next-intl";

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
      <a key={i} href={`mailto:${part}`} className="font-bold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary break-all">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

/**
 * Sıkça sorulan sorular (ana sayfanın sonu): ortalanmış başlık + ince çizgilerle ayrılan sorular, açılınca eksiye dönen artı.
 * Yerel `<details name="faq">`: JavaScript gerektirmez, aynı anda tek soru açık kalır, yanıtlar sayfa kaynağında yer alır.
 */
export function Faq() {
  const t = useTranslations("faq");
  const locale = useLocale();
  const items = t.raw("items") as FaqItem[];

  return (
    // `lang`: büyük harfe çevirme dile göre yapılsın (Türkçe i → İ)
    <section id="sss" lang={locale} className="py-12 md:py-20 scroll-mt-20" aria-labelledby="faq-title">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-7 md:mb-10">
          <p className="flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            <span className="h-px w-7 bg-primary/30" aria-hidden="true" />
            {t("eyebrow")}
            <span className="h-px w-7 bg-primary/30" aria-hidden="true" />
          </p>
          <h2 id="faq-title" className="mt-3 text-[22px] md:text-[30px] leading-tight font-bold text-on-background text-balance">
            {t("title")}
          </h2>
        </header>

        <div className="border-t border-outline-variant/50">
          {items.map((item) => (
            <details key={item.id} name="faq" className="faq-item group border-b border-outline-variant/50">
              <summary className="flex items-center justify-between gap-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden py-4 px-1 text-[14px] md:text-[15px] leading-snug font-bold text-on-background hover:text-primary group-open:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2 rounded-md">
                <span>{item.q}</span>
                {/* Artı → eksi: dikey çizgi yatayın üzerine döner */}
                <span className="relative block h-3 w-3 shrink-0 text-primary/60 group-hover:text-primary group-open:text-primary transition-colors" aria-hidden="true">
                  <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rounded-full bg-current" />
                  <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 rounded-full bg-current transition-transform duration-300 group-open:rotate-90 motion-reduce:transition-none" />
                </span>
              </summary>
              <div className="faq-answer px-1 pb-5 pr-8 md:pr-12 text-[13.5px] md:text-[14.5px] leading-[1.75] font-medium text-on-surface-variant">
                {item.a && <p>{withMailLinks(item.a)}</p>}
                {item.list && (
                  <ul className="flex flex-col gap-1.5">
                    {item.list.map((entry) => (
                      <li key={entry.name} className="relative pl-3.5 before:absolute before:left-0 before:top-[0.72em] before:h-1 before:w-1 before:rounded-full before:bg-primary/50">
                        <strong className="font-bold text-on-background">{entry.name}:</strong> {entry.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
