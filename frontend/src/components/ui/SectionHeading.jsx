import Reveal from "./Reveal";

/** Consistent eyebrow + title + subtitle block used across sections. */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  icon = null,
}) {
  const alignment =
    align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <Reveal className={`flex max-w-2xl flex-col gap-4 ${alignment}`}>
      {eyebrow && (
        <span className="eyebrow">
          {icon}
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-[2.6rem] md:leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base leading-relaxed text-ink-muted sm:text-lg">{subtitle}</p>
      )}
    </Reveal>
  );
}
