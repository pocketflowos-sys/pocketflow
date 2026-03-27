import type { ReactNode } from "react";
import * as React from "react";

type SectionHeadingProps = {
  kicker?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left"
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-4xl text-center" : "max-w-3xl"}>
      {kicker ? (
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
          {kicker}
        </p>
      ) : null}
      <h2 className="text-4xl font-semibold leading-tight md:text-6xl">{title}</h2>
      {description ? (
        <p className="mt-5 text-lg leading-8 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
