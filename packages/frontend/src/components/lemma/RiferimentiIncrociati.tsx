import Link from 'next/link'
import type { RiferimentoIncrociato, Lemma } from '@/types/payload'
import { Badge } from '@/components/ui/Badge'

interface RiferimentiIncrociatiProps {
  riferimenti: Array<RiferimentoIncrociato & { lemma_destinazione?: Lemma }>
  lemmarioSlug: string
}

const tipoLabels: Record<string, string> = {
  sinonimo: 'Sinonimo',
  contrario: 'Contrario',
  correlato: 'Correlato',
  vedi_anche: 'Vedi anche',
}

const tipoColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'> = {
  sinonimo: 'success',
  contrario: 'danger',
  correlato: 'primary',
  vedi_anche: 'outline',
}

export function RiferimentiIncrociati({ riferimenti, lemmarioSlug }: RiferimentiIncrociatiProps) {
  if (!riferimenti || riferimenti.length === 0) {
    return null
  }

  // Raggruppa per tipo
  const raggruppati = riferimenti.reduce((acc, rif) => {
    const tipo = rif.tipo || 'vedi_anche'
    if (!acc[tipo]) acc[tipo] = []
    acc[tipo].push(rif)
    return acc
  }, {} as Record<string, typeof riferimenti>)

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Riferimenti Incrociati ({riferimenti.length})
      </h3>
      <div className="space-y-4">
        {Object.entries(raggruppati).map(([tipo, refs]) => (
          <div key={tipo}>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {tipoLabels[tipo] || tipo}
            </h4>
            <div className="flex flex-wrap gap-2">
              {refs.map((rif, idx) => {
                const lemma = typeof rif.lemma_destinazione === 'object' 
                  ? rif.lemma_destinazione 
                  : null

                if (!lemma) return null

                return (
                  <Link
                    key={rif.id || idx}
                    href={`/${lemmarioSlug}/lemmi/${lemma.slug}`}
                    className="group"
                  >
                    <Badge
                      variant={tipoColors[tipo] || 'outline'}
                      size="md"
                      className="group-hover:shadow-md transition-shadow"
                    >
                      {lemma.termine}
                      {rif.note && (
                        <span className="ml-1 text-xs opacity-70">
                          • {rif.note}
                        </span>
                      )}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
