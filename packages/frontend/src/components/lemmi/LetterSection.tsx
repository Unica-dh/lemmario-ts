import { LemmaCard } from './LemmaCard'

export interface LemmaData {
  id: number
  termine: string
  slug: string
  tipo: 'latino' | 'volgare'
  preview: string
  defCount: number
  fontiCount: number
  cfrCount: number
}

export interface LetterGroup {
  letter: string
  lemmi: LemmaData[]
}

interface LetterSectionProps {
  letter: string
  lemmi: LemmaData[]
  lemmarioSlug: string
  registerRef: (element: HTMLElement | null) => void
}

export function LetterSection({ letter, lemmi, lemmarioSlug, registerRef }: LetterSectionProps) {
  return (
    <section aria-label={`Lemmi con lettera ${letter}`}>
      {/* Sentinel for IntersectionObserver */}
      <div
        ref={registerRef}
        id={`section-${letter}`}
        data-letter={letter}
        className="scroll-mt-28"
      />

      {/* Letter heading */}
      <h2 className="font-serif text-4xl md:text-5xl font-bold text-[var(--color-text)] opacity-20 mb-4 mt-10 first:mt-0">
        {letter}
      </h2>

      {/* Lemmi grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-0 divide-y divide-[var(--color-border)] md:divide-y-0">
        {lemmi.map((lemma) => (
          <div
            key={lemma.id}
            className="border-b border-[var(--color-border)] md:border-b md:border-[var(--color-border)]"
          >
            <LemmaCard
              termine={lemma.termine}
              slug={lemma.slug}
              tipo={lemma.tipo}
              lemmarioSlug={lemmarioSlug}
              definitionPreview={lemma.preview}
              defCount={lemma.defCount}
              fontiCount={lemma.fontiCount}
              cfrCount={lemma.cfrCount}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
