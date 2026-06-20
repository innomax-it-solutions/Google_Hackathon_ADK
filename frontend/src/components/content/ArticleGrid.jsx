import { SearchX } from "lucide-react";
import Reveal from "../ui/Reveal";
import ArticleCard from "./ArticleCard";

/** ArticleGrid — responsive grid of ArticleCards with an empty state. */
export default function ArticleGrid({ articles, basePath, assetDir, icon, emptyMessage = "Nothing found.", animate = true }) {
  if (!articles?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 py-20 text-center dark:border-white/10">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-muted dark:bg-white/[0.06]">
          <SearchX className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm font-medium text-ink-soft">{emptyMessage}</p>
        <p className="mt-1 text-sm text-ink-muted">Try a different search term or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a, i) =>
        animate ? (
          <Reveal key={a.slug || a.id} delay={Math.min(i, 8) * 0.04}>
            <ArticleCard article={a} basePath={basePath} assetDir={assetDir} icon={icon} />
          </Reveal>
        ) : (
          <ArticleCard key={a.slug || a.id} article={a} basePath={basePath} assetDir={assetDir} icon={icon} />
        ),
      )}
    </div>
  );
}
