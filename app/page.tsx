import { headers } from "next/headers";
import { redirect } from "next/navigation";

const SUPPORTED_LOCALES = ["tr", "en", "es"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return "tr";
  const langs = acceptLanguage
    .split(",")
    .map((l) => l.split(";")[0].trim().toLowerCase());
  for (const lang of langs) {
    if (lang.startsWith("tr")) return "tr";
    if (lang.startsWith("en")) return "en";
    if (lang.startsWith("es")) return "es";
  }
  return "tr";
}

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const locale = detectLocale(acceptLanguage);
  redirect(`/${locale}`);
}
