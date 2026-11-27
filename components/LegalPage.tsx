import { Fragment, type ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import type { LegalBlock, LegalDoc } from "@/content/legal/types";

const INLINE_RE = /(\*\*[^*]+\*\*|[\w.+-]+@[\w-]+\.[\w.-]*\w)/;

/** `**kalın**` parçalarını kalınlaştırır, e-posta adreslerini tıklanır yapar. */
function inline(text: string): ReactNode {
  return text.split(INLINE_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith("**")) {
      return (
        <strong key={i} className="font-bold text-on-background">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return (
      <a key={i} href={`mailto:${part}`} className="font-bold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary inline-block max-w-full break-all">
        {part}
      </a>
    );
  });
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{inline(block)}</p>;
  if ("list" in block) {
    return (
      <ul className="list-disc pl-5 space-y-2 marker:text-primary/60">
        {block.list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>
    );
  }
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-outline-variant">
          {block.table.head.map((h) => (
            <th key={h} scope="col" className="py-2 pr-4 font-bold text-on-background align-bottom w-1/2 last:pr-0">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.table.rows.map((row) => (
          <tr key={row[0]} className="border-b border-outline-variant/50">
            {row.map((cell, i) => (
              <td key={i} className="py-2.5 pr-4 align-top last:pr-0">
                {inline(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <Fragment>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </Fragment>
  );
}

/** Gizlilik Politikası ve Kullanım Koşulları için ortak, sade okuma sayfası. */
export function LegalPage({ doc, locale }: { doc: LegalDoc; locale: string }) {
  return (
    <>
      <main lang={locale} className="px-6 py-10 md:py-16">
        <article className="max-w-2xl mx-auto text-[14.5px] md:text-[15px] leading-[1.75] font-medium text-on-surface-variant">
          <header className="mb-8 space-y-3">
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background text-balance">{doc.title}</h1>
            <p className="text-xs">{doc.updated}</p>
            <Blocks blocks={doc.intro} />
          </header>
          {doc.sections.map((section, i) => (
            <section key={section.title} id={section.id} className="scroll-mt-24 border-t border-outline-variant/50 py-6 space-y-3">
              <h2 className="text-headline-sm text-on-background">
                {i + 1}. {section.title}
              </h2>
              <Blocks blocks={section.blocks} />
            </section>
          ))}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
