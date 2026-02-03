import type { VarianteGrafica } from '@/types/payload'

interface VariantiGraficheProps {
  varianti: VarianteGrafica[]
}

export function VariantiGrafiche({ varianti }: VariantiGraficheProps) {
  if (!varianti || varianti.length === 0) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Varianti Grafiche ({varianti.length})
      </h3>
      <div className="flex flex-wrap gap-3">
        {varianti.map((variante, idx) => (
          <div
            key={variante.id || idx}
            className="bg-white border border-blue-300 rounded-lg px-4 py-2 shadow-sm"
            title={variante.note || undefined}
          >
            <span className="font-medium text-gray-900">{variante.variante}</span>
            {variante.note && (
              <span className="ml-2 text-xs text-gray-500">({variante.note})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
