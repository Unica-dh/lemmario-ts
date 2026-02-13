import type { Definizione, LivelloRazionalita, Ricorrenza, Fonte } from '@/types/payload'

interface DefinizioneCardProps {
  definizione: Definizione & {
    livello_razionalita?: LivelloRazionalita
    ricorrenze?: Array<Ricorrenza & { fonte?: Fonte }>
  }
  numero: number
}

export function DefinizioneCard({ definizione, numero }: DefinizioneCardProps) {
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

      {/* Ricorrenze */}
      {definizione.ricorrenze && definizione.ricorrenze.length > 0 && (
        <div className="space-y-5 mb-2">
          {definizione.ricorrenze.map((ricorrenza, idx) => {
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

                {/* Fonte: shorthand_id + pagina_raw */}
                {fonte && (
                  <p className="mt-2 text-sm text-[var(--color-text-muted)] text-right">
                    &mdash; {fonte.shorthand_id}
                    {ricorrenza.pagina_raw && <>, {ricorrenza.pagina_raw}</>}
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
