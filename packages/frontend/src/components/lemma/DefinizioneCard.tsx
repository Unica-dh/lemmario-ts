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
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header con numero e testo definizione */}
      <div className="flex items-start gap-3 mb-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex-shrink-0">
          {numero}
        </span>
        <p className="text-gray-900 leading-relaxed text-lg">
          {definizione.testo}
        </p>
      </div>

      {/* Ricorrenze */}
      {definizione.ricorrenze && definizione.ricorrenze.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {definizione.ricorrenze.length === 1 ? 'Ricorrenza:' : `Ricorrenze (${definizione.ricorrenze.length}):`}
          </h4>
          <div className="space-y-4">
            {definizione.ricorrenze.map((ricorrenza, idx) => {
              const fonte = typeof ricorrenza.fonte === 'object' ? ricorrenza.fonte : null
              return (
                <div key={ricorrenza.id || idx} className="bg-gray-50 rounded-lg p-4">
                  {/* Fonte - mostrata prima della citazione */}
                  {fonte && (
                    <div className="mb-3">
                      <p className="text-primary-700 font-semibold italic">
                        {fonte.titolo}
                        {fonte.anno && ` (${fonte.anno})`}:
                      </p>
                    </div>
                  )}

                  {/* Testo originale della citazione */}
                  <blockquote className="text-gray-700 mb-3 pl-4 border-l-3 border-primary-300">
                    «{ricorrenza.testo_originale}»
                    {ricorrenza.pagina_raw && (
                      <span className="text-gray-500 text-sm ml-1">
                        - {ricorrenza.pagina_raw}
                      </span>
                    )}
                  </blockquote>

                  {/* Riferimento bibliografico completo */}
                  {fonte?.riferimento_completo && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">Riferimento bibliografico:</span>{' '}
                        {fonte.riferimento_completo}
                      </p>
                    </div>
                  )}

                  {/* Note */}
                  {ricorrenza.note && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      <span className="font-medium">Note:</span> {ricorrenza.note}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Livello di razionalità - in fondo */}
      {livello && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Livello di razionalità:</span>{' '}
            <span className="text-primary-700">
              {livello.numero ?? livello.livello}. {livello.nome?.replace(/^Livello \d+ - /, '')}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
