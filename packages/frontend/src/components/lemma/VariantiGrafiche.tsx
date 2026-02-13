import type { VarianteGrafica } from '@/types/payload'

interface VariantiGraficheProps {
  varianti: VarianteGrafica[]
}

export function VariantiGrafiche({ varianti }: VariantiGraficheProps) {
  if (!varianti || varianti.length === 0) {
    return null
  }

  const sorted = [...varianti].sort((a, b) => {
    const ordA = (a as VarianteGrafica & { ordine?: number }).ordine ?? 0
    const ordB = (b as VarianteGrafica & { ordine?: number }).ordine ?? 0
    return ordA - ordB
  })

  return (
    <section className="mb-8">
      <h2 className="label-uppercase text-[var(--color-text-muted)] mb-3">
        Varianti grafiche
      </h2>
      <p className="font-serif italic text-lg text-[var(--color-text-body)]">
        {sorted.map((v) => v.variante).join(', ')}
      </p>
    </section>
  )
}
