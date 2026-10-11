import { useSearchParams } from "react-router";

import type { Lang } from "../features/ranking/i18n";

import { RankingPage } from "../features/ranking/ranking-page";

export default function Home() {
  const [params, setParams] = useSearchParams();
  const lang: Lang = params.get("lang") === "en" ? "en" : "hi";
  const toggle = () => {
    setParams({ lang: lang === "hi" ? "en" : "hi" });
  };
  return <RankingPage lang={lang} onToggleLang={toggle} />;
}
