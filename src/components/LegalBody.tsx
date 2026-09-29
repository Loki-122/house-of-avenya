export type PolicySection = {
  heading: string;
  paragraphs?: string[];
  points?: string[];
};

type LegalBodyProps = {
  intro: string;
  updated: string;
  sections: PolicySection[];
};

/**
 * Shared editorial layout for the policy / service pages so they stay
 * visually consistent with the rest of the site.
 */
export default function LegalBody({ intro, updated, sections }: LegalBodyProps) {
  return (
    <section className="bg-brand-ivory px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="border-b border-brand-antiqueGold/30 pb-6 font-display text-editorial-lg italic leading-relaxed text-brand-espresso/85">
          {intro}
        </p>

        <p className="mt-6 font-sans text-[0.625rem] uppercase tracking-[0.35em] text-brand-antiqueGoldDark">
          Last Updated — {updated}
        </p>

        <div className="mt-14 space-y-12">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-display text-xl uppercase tracking-[0.06em] text-brand-espresso sm:text-2xl">
                {section.heading}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
                  {paragraph}
                </p>
              ))}

              {section.points && (
                <ul className="mt-5 space-y-3">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-4 font-sans text-editorial-sm leading-relaxed text-brand-espresso/75">
                      <span aria-hidden="true" className="mt-3 h-px w-6 shrink-0 bg-brand-terracotta" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
