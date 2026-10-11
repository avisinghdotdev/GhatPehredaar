import type {
  Coverage,
  GhatRanking,
  ParameterEvidence,
  Reading,
} from "../../api/client";
import type { Lang, Phase } from "./i18n";

import {
  coverageLabel,
  festivalName,
  limitText,
  parameterName,
  t,
} from "./i18n";

const phases: readonly Phase[] = ["pre", "during", "after"];

function pdfHref(year: number, page: number, printed: string): string {
  return `/api/pdf/${String(year)}#page=${String(page)}&search=${encodeURIComponent(printed)}&phrase=true`;
}

function ReadingCell({
  lang,
  reading,
  year,
}: {
  lang: Lang;
  reading: Reading | null;
  year: number;
}) {
  const s = t(lang);
  if (reading === null || reading.flag === "not sampled") {
    return <td className="px-2 py-1 text-neutral-400">{s.notSampled}</td>;
  }
  const label =
    reading.value === null
      ? reading.flag === "BDL" || reading.flag === "ND"
        ? s.bdl
        : s.notSampled
      : reading.printed;
  const tone =
    reading.fails === true
      ? "bg-red-100 text-red-900 font-semibold"
      : reading.fails === false
        ? "text-river-900"
        : "text-neutral-700";
  return (
    <td className={`px-2 py-1 ${tone}`}>
      <a
        className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
        href={pdfHref(year, reading.source_page, reading.printed)}
        rel="noreferrer"
        target="_blank"
        title={`${s.page} ${String(reading.source_page)}`}
      >
        {label}
      </a>
      {reading.detection_limit_as_value ? (
        <span className="ml-1 text-xs text-amber-800">
          ({s.atDetectionLimit})
        </span>
      ) : null}
    </td>
  );
}

function ParameterTable({
  evidence,
  lang,
}: {
  evidence: ParameterEvidence;
  lang: Lang;
}) {
  const s = t(lang);
  const failing =
    evidence.failing === null
      ? ""
      : ` · ${String(evidence.failing)} / ${String(evidence.readings)} ${s.failing.toLowerCase()}`;
  return (
    <div className="min-w-72">
      <h4 className="mb-1 text-sm font-semibold">
        {parameterName(lang, evidence.parameter)}
        {evidence.unit === "" ? "" : ` (${evidence.unit})`}
        <span className="font-normal text-neutral-600">
          {` · ${limitText(lang, evidence.limit ?? null)}${failing}`}
        </span>
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-neutral-600">
            <th className="px-2 py-1" scope="col">
              {s.ghat === "Ghat" ? "Festival" : "त्योहार"}
            </th>
            {phases.map((phase) => (
              <th className="px-2 py-1" key={phase} scope="col">
                {s.phase[phase]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {evidence.events.map((event) => (
            <tr
              className="border-t border-sand-100"
              key={`${String(event.year)}-${event.festival}`}
            >
              <th className="px-2 py-1 text-left font-normal" scope="row">
                {festivalName(lang, event.festival)} {String(event.year)}
              </th>
              {phases.map((phase) => (
                <ReadingCell
                  key={phase}
                  lang={lang}
                  reading={event[phase]}
                  year={event.year}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CoverageGrid({
  coverage,
  lang,
}: {
  coverage: Coverage[];
  lang: Lang;
}) {
  const s = t(lang);
  return (
    <table className="text-sm">
      <caption className="mb-1 text-left text-sm font-semibold">
        {s.coverage}
      </caption>
      <thead>
        <tr className="text-left text-xs text-neutral-600">
          <th className="px-2 py-1" scope="col">
            {s.ghat === "Ghat" ? "Festival" : "त्योहार"}
          </th>
          {phases.map((phase) => (
            <th className="px-2 py-1" key={phase} scope="col">
              {s.phase[phase]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {coverage.map((row) => (
          <tr
            className="border-t border-sand-100"
            key={`${String(row.year)}-${row.festival}`}
          >
            <th className="px-2 py-1 text-left font-normal" scope="row">
              {coverageLabel(lang, row)}
            </th>
            {phases.map((phase) => (
              <td className="px-2 py-1" key={phase}>
                {row[phase] ? (
                  <span className="text-river-700">●</span>
                ) : (
                  <span className="text-neutral-400">{s.notSampled}</span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Evidence({ ghat, lang }: { ghat: GhatRanking; lang: Lang }) {
  return (
    <div className="grid gap-6 border-t border-sand-300 bg-sand-50 p-4 lg:grid-cols-[auto_1fr]">
      <div className="self-start">
        <CoverageGrid coverage={ghat.coverage} lang={lang} />
      </div>
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {ghat.parameters.map((evidence) => (
          <ParameterTable
            evidence={evidence}
            key={evidence.parameter}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
