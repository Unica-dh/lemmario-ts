import Link from 'next/link'
import type { Definizione, LivelloRazionalita, Ricorrenza, Fonte } from '@/types/payload'

interface DefinizioneCardProps {
  definizione: Definizione & {
    livello_razionalita?: LivelloRazionalita
    ricorrenze?: Array<Ricorrenza & { fonte?: Fonte }>
  }
  numero: number
  lemmarioSlug: string
}

export function DefinizioneCard({ definizione, numero, lemmarioSlug }: DefinizioneCardProps) {
  const livello = typeof definizione.livello_razionalita === 'object'
    ? definizione.livello_razionalita
    : null

  return (
    <div>
      {/* Header: DEFINIZIONE N + Livello razionalità */}
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="label-uppercase text-[var(--color-text-muted)]">
          Definizione {numero}
        </h3>
        {livello && (
          <span className="label-uppercase text-[var(--color-text-muted)]">
            Livello: {livello.nome?.replace(/^Livello \d+ - /, '')} ({livello.numero ?? livello.livello})
          </span>
        )}
      </div>

      {/* Testo definizione */}
      <p className="font-serif text-lg text-[var(--color-text-body)] leading-relaxed mb-6">
        {definizione.testo}
      </p>

      {/* Ricorrenze (ordinate per campo ordine) */}
      {definizione.ricorrenze && definizione.ricorrenze.length > 0 && (
        <div className="space-y-5 mb-2">
          {[...definizione.ricorrenze]
            .sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0))
            .map((ricorrenza, idx) => {
            const fonte = typeof ricorrenza.fonte === 'object' ? ricorrenza.fonte : null
            return (
              <div
                key={ricorrenza.id || idx}
                className="pl-5 border-l-2 border-[var(--color-border)]"
              >
                {/* Testo originale tra guillemets */}
                <p className="font-serif italic text-[var(--color-text-body)] leading-relaxed">
                  &laquo;{ricorrenza.testo_originale}&raquo;
                </p>

                {/* Fonte: titolo cliccabile + pagina_raw */}
                {fonte && (
                  <p className="mt-2 text-sm text-[var(--color-text-muted)] text-right">
                    &mdash;{' '}
                    <Link
                      href={`/${lemmarioSlug}/bibliografia#fonte-${fonte.id}`}
                      className="hover:text-[var(--color-text)] transition-colors underline decoration-dotted underline-offset-2"
                    >
                      {fonte.titolo || fonte.shorthand_id}
                    </Link>
                    {ricorrenza.pagina_raw && <>, {ricorrenza.pagina_raw}</>}
                  </p>
                )}

                {/* Datazione del documento */}
                {fonte?.anno && (
                  <p className="mt-1 text-xs text-[var(--color-text-muted)] text-right">
                    Datazione: {fonte.anno}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
