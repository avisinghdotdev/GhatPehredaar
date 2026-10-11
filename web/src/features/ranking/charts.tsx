import type { GhatRanking, ParameterEvidence } from "../../api/client";
import type { Lang, Phase } from "./i18n";

import { limitText, parameterName, t } from "./i18n";

const phases: readonly Phase[] = ["pre", "during", "after"];

function shortName(site: string): string {
  return site.replace(/\s*\(.*?\)/, "").split(" / ")[0] ?? site;
}

export function FailShareChart({
  ghats,
  lang,
}: {
  ghats: GhatRanking[];
  lang: Lang;
}) {
  const s = t(lang);
  const rowHeight = 26;
  const labelWidth = 150;
  const barWidth = 210;
  const height = ghats.length * rowHeight + 8;
  return (
    <figure className="rounded-lg border border-sand-300 bg-white p-4">
      <figcaption className="mb-2 text-sm font-semibold">
        {s.chartTitle}
      </figcaption>
      <svg
        aria-label={s.chartTitle}
        className="w-full font-sans text-[12px]"
        role="img"
        viewBox={`0 0 ${String(labelWidth + barWidth + 50)} ${String(height)}`}
      >
        {[25, 50, 75].map((tick) => (
          <line
            className="stroke-sand-300"
            key={tick}
            strokeDasharray="2 3"
            x1={labelWidth + (barWidth * tick) / 100}
            x2={labelWidth + (barWidth * tick) / 100}
            y1={0}
            y2={height - 8}
          />
        ))}
        {ghats.map((ghat, index) => {
          const y = index * rowHeight + 4;
          const width = barWidth * ghat.fail_share;
          const percent = Math.round(ghat.fail_share * 100);
          return (
            <g key={ghat.site}>
              <title>{`${ghat.site}: ${String(ghat.failing)} / ${String(ghat.readings)}`}</title>
              <text
                className="fill-river-900"
                dominantBaseline="middle"
                x={0}
                y={y + 11}
              >
                {`${String(ghat.rank)}. ${shortName(ghat.site)}`}
              </text>
              <rect
                className="fill-river-700"
                height={14}
                rx={4}
                width={Math.max(width, 4)}
                x={labelWidth}
                y={y + 4}
              />
              <text
                className="fill-river-900 font-semibold"
                dominantBaseline="middle"
                x={labelWidth + width + 6}
                y={y + 11}
              >
                {`${String(percent)}%`}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];
  const lower = sorted[middle - 1];
  if (upper === undefined) {
    return null;
  }
  return sorted.length % 2 === 1 || lower === undefined
    ? upper
    : (lower + upper) / 2;
}

export function PhaseChart({
  evidence,
  lang,
}: {
  evidence: ParameterEvidence;
  lang: Lang;
}) {
  const s = t(lang);
  const limit = evidence.limit ?? null;
  const points = phases.map((phase) => ({
    phase,
    value: median(
      evidence.events
        .map((event) => event[phase]?.value ?? null)
        .filter((value): value is number => value !== null),
    ),
  }));
  const bound = limit?.low ?? limit?.high ?? 0;
  const top = Math.max(bound, ...points.map((p) => p.value ?? 0)) * 1.25 || 1;
  const width = 220;
  const height = 110;
  const left = 16;
  const right = 204;
  const plotTop = 18;
  const plotBottom = 84;
  const x = (index: number) =>
    left + ((right - left) * index) / (phases.length - 1);
  const y = (value: number) =>
    plotBottom - ((plotBottom - plotTop) * value) / top;
  const path = points
    .map((p, i) =>
      p.value === null ? null : `${String(x(i))},${String(y(p.value))}`,
    )
    .filter((segment): segment is string => segment !== null)
    .join(" ");
  const title = `${parameterName(lang, evidence.parameter)} · ${s.median}`;
  return (
    <figure>
      <figcaption className="text-xs font-semibold text-neutral-700">
        {title}
        <span className="font-normal text-neutral-500">
          {` · ${limitText(lang, limit)}`}
        </span>
      </figcaption>
      <svg
        aria-label={title}
        className="w-full font-sans text-[11px]"
        role="img"
        viewBox={`0 0 ${String(width)} ${String(height)}`}
      >
        {limit === null ? null : (
          <line
            className="stroke-neutral-400"
            strokeDasharray="3 3"
            x1={left}
            x2={right}
            y1={y(bound)}
            y2={y(bound)}
          />
        )}
        <polyline
          className="fill-none stroke-river-700"
          points={path}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
        {points.map((p, i) => {
          const fails =
            p.value !== null &&
            limit !== null &&
            ((limit.low !== null &&
              limit.low !== undefined &&
              p.value < limit.low) ||
              (limit.high !== null &&
                limit.high !== undefined &&
                p.value > limit.high));
          return (
            <g key={p.phase}>
              {p.value === null ? (
                <text
                  className="fill-neutral-400"
                  textAnchor="middle"
                  x={x(i)}
                  y={plotBottom - 4}
                >
                  {s.notSampled}
                </text>
              ) : (
                <>
                  <title>{`${s.phase[p.phase]}: ${String(p.value)}`}</title>
                  <circle
                    className={fails ? "fill-red-500" : "fill-river-700"}
                    cx={x(i)}
                    cy={y(p.value)}
                    r={5}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <text
                    className={
                      fails ? "fill-red-800 font-semibold" : "fill-river-900"
                    }
                    textAnchor="middle"
                    x={x(i)}
                    y={y(p.value) - 9}
                  >
                    {String(p.value)}
                  </text>
                </>
              )}
              <text
                className="fill-neutral-600"
                textAnchor={
                  i === 0 ? "start" : i === phases.length - 1 ? "end" : "middle"
                }
                x={x(i)}
                y={height - 4}
              >
                {s.phaseShort[p.phase]}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
