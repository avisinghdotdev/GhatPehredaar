import type { Axis, Coverage, Limit, Note } from "../../api/client";

export type Lang = "en" | "hi";
export type Phase = "pre" | "during" | "after";

const strings = {
  en: {
    title: "Ghat Pehredaar",
    subtitle:
      "Which Bhopal ghat needs help before Durga visarjan on 20 October 2026",
    source:
      "MPPCB idol-immersion reports 2023 to 2025, scored against CPCB Class B (outdoor bathing): oxygen 5 mg/l or more, BOD 3 mg/l or less, pH 6.5 to 8.5. Every number links to the report page it was printed on.",
    switchTo: "हिन्दी में देखें",
    loading: "Loading readings…",
    error: "The API is not reachable.",
    rank: "Rank",
    ghat: "Ghat",
    failing: "Readings outside the limit",
    rankRange: (low: string, high: string) =>
      `Rank ${low} to ${high} across 1,000 resamples of the six festivals`,
    axes: {
      chronic: "Already failing before immersion",
      shock: "Clearly worse during immersion",
      recovery: "Still failing one week after",
    },
    verdict: {
      fail: "Yes",
      warn: "Partly",
      pass: "No",
      unknown: "Not sampled",
    },
    lever: {
      chronic: "Aerate before, or do not use",
      shock: "Cranes, liners, crowd control",
      recovery: "Cleanup crews and re-test",
    },
    evidence: "Evidence, with report pages",
    phase: { pre: "Before", during: "During", after: "One week after" },
    phaseShort: { pre: "Before", during: "During", after: "+1 week" },
    festival: { Ganesh: "Ganesh", Durga: "Durga" },
    page: "page",
    notSampled: "not sampled",
    bdl: "below detection limit",
    atDetectionLimit: "printed at detection limit",
    limit: "limit",
    noLimit: "no Class B limit",
    coverage: "Which samples exist",
    notes: "What this data cannot tell you",
    brief: "Brief to forward",
    briefMissing: "Brief not generated yet. Run `just brief` with an API key.",
    copy: "Copy",
    copied: "Copied",
    generated: "Written by",
    print: "Print / PDF",
    footer:
      "Public data only. No health claims. Missing data is shown as missing, never as clean.",
    skip: "Skip to main content",
    govStrip: "Government of Madhya Pradesh · Bhopal Municipal Corporation",
    prototype: "Hackathon prototype · not an official BMC website",
    forOfficer: "For the BMC officer in charge of visarjan",
    dataSources: "Data sources",
    report: (year: string) => `MPPCB idol-immersion report ${year} (PDF)`,
    cpcb: "CPCB water-quality criteria (classes A to E)",
    latestData: "Latest data: Durga visarjan 2025 report",
    builtAt:
      "Built at Bhopal Impact Lab 2026, Bhopal, 11 October 2026. Open source under the MIT license, offered to the Government of Madhya Pradesh through MPSeDC.",
    chartTitle:
      "Share of oxygen, BOD and pH readings outside the limit, worst first",
    median: "median of all festivals",
    chooseGhat: "Choose a ghat",
    ghatCount: (n: string) => `${n} ghats ranked, worst first`,
    cityTag: "Bhopal · the city of lakes",
  },
  hi: {
    title: "घाट पहरेदार",
    subtitle:
      "20 अक्टूबर 2026 के दुर्गा विसर्जन से पहले भोपाल के किस घाट को मदद चाहिए",
    source:
      "MPPCB की मूर्ति-विसर्जन रिपोर्टें 2023 से 2025, CPCB क्लास B (खुले में स्नान) मानक पर जाँची गईं: ऑक्सीजन 5 mg/l या ज़्यादा, BOD 3 mg/l या कम, pH 6.5 से 8.5। हर संख्या उस रिपोर्ट पेज से जुड़ी है जहाँ वह छपी है।",
    switchTo: "View in English",
    loading: "रीडिंग लोड हो रही हैं…",
    error: "API उपलब्ध नहीं है।",
    rank: "क्रम",
    ghat: "घाट",
    failing: "मानक से बाहर रीडिंग",
    rankRange: (low: string, high: string) =>
      `छह त्योहारों के 1,000 पुनर्नमूनों में क्रम ${low} से ${high}`,
    axes: {
      chronic: "विसर्जन से पहले ही खराब",
      shock: "विसर्जन के दौरान साफ़ तौर पर बिगड़ा",
      recovery: "एक हफ्ते बाद भी खराब",
    },
    verdict: {
      fail: "हाँ",
      warn: "कुछ हद तक",
      pass: "नहीं",
      unknown: "नमूना नहीं",
    },
    lever: {
      chronic: "पहले एरेशन करें, या घाट न चुनें",
      shock: "क्रेन, लाइनर, भीड़-नियंत्रण",
      recovery: "सफ़ाई दल और दोबारा जाँच",
    },
    evidence: "सबूत, रिपोर्ट पेज के साथ",
    phase: { pre: "पहले", during: "दौरान", after: "एक हफ्ते बाद" },
    phaseShort: { pre: "पहले", during: "दौरान", after: "+1 हफ्ता" },
    festival: { Ganesh: "गणेश", Durga: "दुर्गा" },
    page: "पेज",
    notSampled: "नमूना नहीं",
    bdl: "पहचान-सीमा से नीचे",
    atDetectionLimit: "पहचान-सीमा पर छपा",
    limit: "मानक",
    noLimit: "क्लास B में मानक नहीं",
    coverage: "कौन से नमूने मौजूद हैं",
    notes: "यह डेटा क्या नहीं बता सकता",
    brief: "आगे भेजने के लिए नोट",
    briefMissing: "नोट अभी नहीं बना है। API key के साथ `just brief` चलाएँ।",
    copy: "कॉपी करें",
    copied: "कॉपी हो गया",
    generated: "लेखक",
    print: "प्रिंट / PDF",
    footer:
      "केवल सार्वजनिक डेटा। स्वास्थ्य पर कोई दावा नहीं। जो डेटा नहीं है, उसे 'नहीं है' दिखाया गया है, साफ़ नहीं।",
    skip: "मुख्य सामग्री पर जाएँ",
    govStrip: "मध्यप्रदेश शासन · नगर पालिक निगम भोपाल",
    prototype: "हैकाथॉन प्रोटोटाइप · नगर निगम की आधिकारिक वेबसाइट नहीं",
    forOfficer: "नगर निगम के विसर्जन-प्रभारी अधिकारी के लिए",
    dataSources: "डेटा स्रोत",
    report: (year: string) => `MPPCB मूर्ति-विसर्जन रिपोर्ट ${year} (PDF)`,
    cpcb: "CPCB जल-गुणवत्ता मानक (क्लास A से E)",
    latestData: "नवीनतम डेटा: दुर्गा विसर्जन 2025 रिपोर्ट",
    builtAt:
      "भोपाल इम्पैक्ट लैब 2026, भोपाल में 11 अक्टूबर 2026 को बनाया गया। MIT लाइसेंस के साथ ओपन सोर्स, MPSeDC के माध्यम से मध्यप्रदेश शासन को समर्पित।",
    chartTitle:
      "ऑक्सीजन, BOD और pH की मानक से बाहर रीडिंग का हिस्सा, सबसे खराब पहले",
    median: "सभी त्योहारों की माध्यिका",
    chooseGhat: "घाट चुनें",
    ghatCount: (n: string) => `${n} घाट, सबसे खराब पहले`,
    cityTag: "भोपाल · झीलों का शहर",
  },
} as const;

export type Strings = (typeof strings)[Lang];

export function t(lang: Lang): Strings {
  return strings[lang];
}

const parameterNames: Record<Lang, Record<string, string>> = {
  en: {},
  hi: {
    "Dissolved oxygen": "घुलित ऑक्सीजन",
    BOD: "BOD",
    pH: "pH",
    COD: "COD",
    Conductivity: "चालकता",
    Turbidity: "गंदलापन",
    "Total solids": "कुल ठोस",
    Chromium: "क्रोमियम",
    Lead: "लेड (सीसा)",
    Zinc: "ज़िंक",
    Copper: "कॉपर (ताँबा)",
  },
};

export function parameterName(lang: Lang, parameter: string): string {
  return parameterNames[lang][parameter] ?? parameter;
}

export function limitText(lang: Lang, limit: Limit | null): string {
  if (limit === null) {
    return t(lang).noLimit;
  }
  const unit = limit.unit === "" ? "" : ` ${limit.unit}`;
  switch (limit.kind) {
    case "min":
      return `${t(lang).limit} ≥ ${String(limit.low)}${unit}`;
    case "max":
      return `${t(lang).limit} ≤ ${String(limit.high)}${unit}`;
    case "range":
      return `${t(lang).limit} ${String(limit.low)}–${String(limit.high)}`;
  }
}

export function axisCount(axis: Axis): string {
  return axis.total === 0
    ? ""
    : `${String(axis.failing)} / ${String(axis.total)}`;
}

export function noteText(lang: Lang, note: Note): string {
  return lang === "hi" ? note.hi : note.en;
}

export function festivalName(lang: Lang, festival: string): string {
  const names = t(lang).festival;
  return festival === "Ganesh" || festival === "Durga"
    ? names[festival]
    : festival;
}

export function coverageLabel(lang: Lang, coverage: Coverage): string {
  return `${festivalName(lang, coverage.festival)} ${String(coverage.year)}`;
}
