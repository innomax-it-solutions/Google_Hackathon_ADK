import { useState } from "react";
import Icon from "../ui/Icon";

/**
 * MediaImage — renders an <img> when the asset loads, otherwise a gradient
 * fallback with an icon + optional label. Editorial image assets aren't bundled
 * today, so the fallback is what shows until images are added; `src` is kept
 * forward-looking so dropping files in "just works".
 */
export default function MediaImage({ src, alt, gradient, icon = "FileText", label, className = "" }) {
  const [failed, setFailed] = useState(!src);

  if (!failed && src) {
    return (
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradient} p-4 text-center text-white ${className}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      {label && <span className="line-clamp-2 text-xs font-medium text-white/90">{label}</span>}
    </div>
  );
}
