import type { Definizione, LivelloRazionalita, Ricorrenza, Fonte } from '@/types/payload'
import { Badge } from '@/components/ui/Badge'

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
      {/* Header con numero e livello razionalità */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
            {numero}
          </span>
          {livello && (
            <Badge variant="info" size="sm">
              Livello {livello.livello}: {livello.nome}
            </Badge>
          )}
        </div>
      </div>

      {/* Testo definizione */}
      <div className="mb-4">
        <p className="text-gray-900 leading-relaxed text-lg">
          {definizione.testo}
        </p>
      </div>

      {/* Ricorrenze */}
      {definizione.ricorrenze && definizione.ricorrenze.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Ricorrenze ({definizione.ricorrenze.length})
          </h4>
          <div className="space-y-3">
            {definizione.ricorrenze.map((ricorrenza, idx) => {
              const fonte = typeof ricorrenza.fonte === 'object' ? ricorrenza.fonte : null
              return (
                <div key={ricorrenza.id || idx} className="bg-gray-50 rounded p-3 text-sm">
                  {/* Testo originale */}
                  <blockquote className="italic text-gray-700 mb-2 border-l-2 border-gray-300 pl-3">
                    &ldquo;{ricorrenza.testo_originale}&rdquo;
                  </blockquote>
                  
                  {/* Fonte */}
                  {fonte && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Fonte:</span> {fonte.shorthand_id}
                      {ricorrenza.pagina_raw && ` (p. ${ricorrenza.pagina_raw})`}
                    </p>
                  )}
                  
                  {/* Note */}
                  {ricorrenza.note && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Note:</span> {ricorrenza.note}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
