import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { Lang } from "./i18n";

import { briefOptions } from "../../api/client/@tanstack/react-query.gen";
import { t } from "./i18n";

export function BriefPanel({ lang }: { lang: Lang }) {
  const s = t(lang);
  const brief = useQuery({ ...briefOptions(), retry: false });
  const [copied, setCopied] = useState(false);

  if (brief.isPending) {
    return null;
  }
  if (brief.isError) {
    return (
      <section className="rounded-lg border border-sand-300 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">{s.brief}</h2>
        <p className="text-sm text-neutral-700">{s.briefMissing}</p>
      </section>
    );
  }
  const text = lang === "hi" ? brief.data.hi : brief.data.en;
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
    });
  };
  return (
    <section className="rounded-lg border border-sand-300 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{s.brief}</h2>
        <div className="flex gap-2 print:hidden">
          <button
            className="rounded-md border border-river-700 px-3 py-1 text-sm font-semibold text-river-700 hover:bg-river-50"
            onClick={copy}
            type="button"
          >
            {copied ? s.copied : s.copy}
          </button>
          <button
            className="rounded-md border border-river-700 px-3 py-1 text-sm font-semibold text-river-700 hover:bg-river-50"
            onClick={() => {
              window.print();
            }}
            type="button"
          >
            {s.print}
          </button>
        </div>
      </div>
      <pre className="font-sans whitespace-pre-wrap text-sm leading-relaxed">
        {text}
      </pre>
      <p className="mt-2 text-xs text-neutral-600">
        {s.generated} {brief.data.model} · {brief.data.generated_at}
      </p>
    </section>
  );
}
