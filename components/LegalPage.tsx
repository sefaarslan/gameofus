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
        <strong key={i} className="font-bold text-[#fff1ed]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return (
      <a key={i} href={`mailto:${part}`} className="font-bold text-[#ff8a85] underline decoration-[#ff8a85]/40 underline-offset-4 hover:decoration-[#ff8a85] inline-block max-w-full break-all">
        {part}
      </a>
    );
  });
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{inline(block)}</p>;
  if ("list" in block) {
    return (
      <ul className="list-disc pl-4 space-y-1.5 marker:text-[#ff8a85]/70">
        {block.list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>
    );
  }
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-white/20">
          {block.table.head.map((h) => (
            <th key={h} scope="col" className="py-2 pr-4 font-bold text-[#fff1ed] align-bottom w-1/2 last:pr-0">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.table.rows.map((row) => (
          <tr key={row[0]} className="border-b border-white/10">
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
      <main lang={locale} className="bg-[#120b0a] px-4 py-6 md:py-12">
        <article className="max-w-2xl mx-auto rounded-[24px] border border-white/[0.06] bg-[#211614] px-5 py-7 md:px-10 md:py-10 text-[13px] md:text-[13.5px] leading-[1.7] font-medium text-[#d8c2be]">
          <header className="mb-6 space-y-2.5">
            <h1 className="text-[22px] md:text-[26px] leading-tight font-bold text-[#fff1ed] text-balance">{doc.title}</h1>
            <p className="text-[11.5px] text-[#ff8a85]">{doc.updated}</p>
            <Blocks blocks={doc.intro} />
          </header>
          {doc.sections.map((section, i) => (
            <section key={section.title} id={section.id} className="scroll-mt-24 border-t border-white/10 py-5 last:pb-0 space-y-2.5">
              <h2 className="text-[15px] md:text-[16px] leading-snug font-bold text-[#fff1ed]">
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
