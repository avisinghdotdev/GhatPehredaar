import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { Axis, GhatRanking, Note } from "../../api/client";
import type { Lang } from "./i18n";

import { rankingOptions } from "../../api/client/@tanstack/react-query.gen";
import { BriefPanel } from "./brief-panel";
import { FailShareChart, PhaseChart } from "./charts";
import { Evidence } from "./evidence";
import { axisCount, noteText, t } from "./i18n";

type AxisKey = "chronic" | "shock" | "recovery";
const axisKeys: readonly AxisKey[] = ["chronic", "shock", "recovery"];
const reportYears = ["2023", "2024", "2025"] as const;

const verdictTone: Record<Axis["verdict"], string> = {
  fail: "bg-red-100 text-red-900 border-red-200",
  warn: "bg-amber-100 text-amber-900 border-amber-200",
  pass: "bg-river-100 text-river-900 border-river-100",
  unknown: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

function shortName(site: string): string {
  return site.replace(/\s*\(.*?\)/, "").split(" / ")[0] ?? site;
}

function AxisBadge({
  axis,
  axisKey,
  lang,
}: {
  axis: Axis;
  axisKey: AxisKey;
  lang: Lang;
}) {
  const s = t(lang);
  return (
    <div
      className={`rounded-md border px-2 py-1 text-sm ${verdictTone[axis.verdict]}`}
    >
      <div className="text-xs opacity-80">{s.axes[axisKey]}</div>
      <div className="font-semibold">
        {s.verdict[axis.verdict]}
        {axis.total === 0 ? "" : ` · ${axisCount(axis)}`}
      </div>
      {axis.verdict === "fail" || axis.verdict === "warn" ? (
        <div className="text-xs">{s.lever[axisKey]}</div>
      ) : null}
    </div>
  );
}

function GhatSwitcher({
  ghats,
  lang,
  onSelect,
  selected,
}: {
  ghats: GhatRanking[];
  lang: Lang;
  onSelect: (site: string) => void;
  selected: string;
}) {
  const s = t(lang);
  const byName = [...ghats].sort((a, b) => a.site.localeCompare(b.site));
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        {s.chooseGhat}
        <select
          className="rounded-md border border-sand-300 bg-white px-3 py-1.5 text-sm font-semibold text-river-900"
          onChange={(event) => {
            onSelect(event.target.value);
          }}
          value={selected}
        >
          {byName.map((ghat) => (
            <option key={ghat.site} value={ghat.site}>
              {shortName(ghat.site)} · #{String(ghat.rank)}
            </option>
          ))}
        </select>
      </label>
      <span className="text-sm text-neutral-600">
        {s.ghatCount(String(ghats.length))}
      </span>
    </div>
  );
}

function GhatDetail({ ghat, lang }: { ghat: GhatRanking; lang: Lang }) {
  const s = t(lang);
  const percent = Math.round(ghat.fail_share * 100);
  return (
    <section className="overflow-hidden rounded-lg border border-sand-300 bg-white shadow-sm">
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_minmax(15rem,18rem)]">
        <div>
          <h2 className="text-xl font-semibold">
            <span className="mr-2 text-river-700">{String(ghat.rank)}.</span>
            {ghat.site}
            <span className="ml-2 text-sm font-normal text-neutral-600">
              {ghat.water_body}
            </span>
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            {s.failing}: {String(ghat.failing)} / {String(ghat.readings)} (
            {String(percent)}%).{" "}
            {s.rankRange(String(ghat.rank_low), String(ghat.rank_high))}.
          </p>
          <div
            aria-hidden="true"
            className="mt-2 h-2 w-full overflow-hidden rounded bg-sand-100"
          >
            <div
              className="h-full bg-red-400"
              style={{ width: `${String(percent)}%` }}
            />
          </div>
          <p className="mt-3 leading-relaxed">
            {lang === "hi" ? ghat.reason_hi : ghat.reason_en}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {ghat.parameters
              .filter(
                (p) =>
                  p.parameter === "Dissolved oxygen" || p.parameter === "BOD",
              )
              .map((p) => (
                <PhaseChart evidence={p} key={p.parameter} lang={lang} />
              ))}
          </div>
        </div>
        <div className="grid content-start gap-2">
          {axisKeys.map((key) => (
            <AxisBadge axis={ghat[key]} axisKey={key} key={key} lang={lang} />
          ))}
        </div>
      </div>
      <details className="print:hidden">
        <summary className="cursor-pointer border-t border-sand-100 px-4 py-2 text-sm font-semibold text-river-700">
          {s.evidence}
        </summary>
        <Evidence ghat={ghat} lang={lang} />
      </details>
    </section>
  );
}

function Notes({ lang, notes }: { lang: Lang; notes: Note[] }) {
  const s = t(lang);
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="mb-2 text-lg font-semibold">{s.notes}</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {notes.map((note) => (
          <li key={note.key}>{noteText(lang, note)}</li>
        ))}
      </ul>
    </section>
  );
}

function SiteHeader({
  lang,
  onToggleLang,
}: {
  lang: Lang;
  onToggleLang: () => void;
}) {
  const s = t(lang);
  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:bg-white focus:px-3 focus:py-2"
        href="#main"
      >
        {s.skip}
      </a>
      <div className="bg-river-900 text-sand-50 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs">
          <span>{s.govStrip}</span>
          <button
            className="rounded border border-sand-300/60 px-2 py-0.5 font-semibold hover:bg-river-700"
            onClick={onToggleLang}
            type="button"
          >
            {s.switchTo}
          </button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="h-1 bg-[linear-gradient(90deg,#ff9933_0_33.3%,#ffffff_33.3%_66.6%,#138808_66.6%)]"
      />
      <header className="border-b border-sand-300 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <img
            alt="Government of Madhya Pradesh"
            className="h-16 w-auto"
            src="/logos/mp-gov.png"
          />
          <img
            alt="Bhopal Municipal Corporation"
            className="h-16 w-auto"
            src="/logos/bmc.png"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-river-900 sm:text-3xl">
              {s.title}
              <span className="ml-3 text-base font-normal text-neutral-600">
                {lang === "hi" ? "Ghat Pehredaar" : "घाट पहरेदार"}
              </span>
            </h1>
            <p className="text-base sm:text-lg">{s.subtitle}</p>
            <p className="text-sm text-neutral-600">
              {s.forOfficer} · {s.cityTag}
            </p>
          </div>
          <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
            {s.prototype}
          </span>
        </div>
      </header>
    </>
  );
}

function SiteFooter({ lang }: { lang: Lang }) {
  const s = t(lang);
  return (
    <footer className="mt-8 bg-river-900 text-sand-100 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 text-sm md:grid-cols-3">
        <div>
          <h2 className="mb-2 font-semibold text-white">{s.dataSources}</h2>
          <ul className="space-y-1">
            {reportYears.map((year) => (
              <li key={year}>
                <a
                  className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
                  href={`/api/pdf/${year}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {s.report(year)}
                </a>
              </li>
            ))}
            <li>
              <a
                className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
                href="https://cpcb.gov.in/water-quality-criteria/"
                rel="noreferrer"
                target="_blank"
              >
                {s.cpcb}
              </a>
            </li>
          </ul>
          <p className="mt-2 text-sand-300">{s.latestData}</p>
        </div>
        <p className="leading-relaxed">{s.builtAt}</p>
        <p className="leading-relaxed">
          {s.footer}
          <span className="mt-2 block text-sand-300">v{__APP_VERSION__}</span>
        </p>
      </div>
    </footer>
  );
}

function Dashboard({ ghats, lang }: { ghats: GhatRanking[]; lang: Lang }) {
  const [selected, setSelected] = useState(ghats[0]?.site ?? "");
  const ghat = ghats.find((g) => g.site === selected) ?? ghats[0];
  if (ghat === undefined) {
    return null;
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <FailShareChart ghats={ghats} lang={lang} />
      <div className="grid content-start gap-3">
        <GhatSwitcher
          ghats={ghats}
          lang={lang}
          onSelect={setSelected}
          selected={ghat.site}
        />
        <GhatDetail ghat={ghat} lang={lang} />
      </div>
    </div>
  );
}

export function RankingPage({
  lang,
  onToggleLang,
}: {
  lang: Lang;
  onToggleLang: () => void;
}) {
  const s = t(lang);
  const ranking = useQuery(rankingOptions());
  return (
    <>
      <SiteHeader lang={lang} onToggleLang={onToggleLang} />
      <main className="mx-auto max-w-7xl px-4 py-5" id="main">
        <p className="mb-4 text-sm text-neutral-700">{s.source}</p>
        {ranking.isPending ? <p>{s.loading}</p> : null}
        {ranking.isError ? <p className="text-red-800">{s.error}</p> : null}
        {ranking.data ? (
          <div className="grid gap-4">
            <Dashboard ghats={ranking.data.ghats} lang={lang} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Notes lang={lang} notes={ranking.data.notes} />
              <BriefPanel lang={lang} />
            </div>
          </div>
        ) : null}
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
