import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getLemmaBySlug,
  getDefinizioniByLemma,
  getVariantiByLemma,
  getRiferimentiByLemma,
  getRicorrenzeByDefinizione,
} from '@/lib/payload-api'
import type { Lemma, Lemmario, Definizione, LivelloRazionalita, Fonte, Ricorrenza } from '@/types/payload'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function LemmaPage({ params }: PageProps) {
  const lemma = await getLemmaBySlug(params.slug)

  if (!lemma) {
    notFound()
  }

  const [definizioni, varianti, riferimenti] = await Promise.all([
    getDefinizioniByLemma(lemma.id),
    getVariantiByLemma(lemma.id),
    getRiferimentiByLemma(lemma.id),
  ])

  // Carica le ricorrenze per ogni definizione
  const definizioniConRicorrenze = await Promise.all(
    definizioni.map(async (def) => ({
      ...def,
      ricorrenze: await getRicorrenzeByDefinizione(def.id),
    }))
  )

  const lemmario = typeof lemma.lemmario === 'object' ? lemma.lemmario : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/lemmi" className="hover:text-primary-600">Lemmi</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{lemma.termine}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {lemma.termine}
            </h1>
            <div className="flex gap-3 items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${
                lemma.tipo === 'latino'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {lemma.tipo === 'latino' ? 'Latino' : 'Volgare'}
              </span>
              {lemmario && (
                <Link
                  href={`/lemmari/${lemmario.slug}`}
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  {lemmario.titolo}
                </Link>
              )}
            </div>
          </div>
        </div>

        {lemma.etimologia && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-1">Etimologia</h2>
            <p className="text-gray-700">{lemma.etimologia}</p>
          </div>
        )}
      </header>

      {/* Varianti Grafiche */}
      {varianti.length > 0 && (
        <section className="mb-8 bg-blue-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Varianti grafiche</h2>
          <div className="flex flex-wrap gap-2">
            {varianti.map((variante) => (
              <span
                key={variante.id}
                className="px-3 py-1 bg-white border border-blue-200 rounded text-sm text-gray-700"
              >
                {variante.variante}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Definizioni */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Definizioni</h2>

        {definizioniConRicorrenze.length === 0 ? (
          <p className="text-gray-600">Nessuna definizione disponibile.</p>
        ) : (
          <div className="space-y-8">
            {definizioniConRicorrenze.map((definizione) => {
              const livello = typeof definizione.livello_razionalita === 'object'
                ? definizione.livello_razionalita as LivelloRazionalita
                : null

              return (
                <div key={definizione.id} className="border-l-4 border-primary-500 pl-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {definizione.numero_definizione}.
                    </h3>
                    {livello && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {livello.nome} (Livello {livello.livello})
                      </span>
                    )}
                  </div>

                  <p className="text-gray-800 mb-4 text-lg">
                    {definizione.testo_definizione}
                  </p>

                  {definizione.contesto_uso && (
                    <div className="mb-4 bg-gray-50 rounded p-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Contesto d&apos;uso
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {definizione.contesto_uso}
                      </p>
                    </div>
                  )}

                  {/* Ricorrenze */}
                  {definizione.ricorrenze && definizione.ricorrenze.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Ricorrenze nelle fonti
                      </h4>
                      <div className="space-y-4">
                        {definizione.ricorrenze.map((ricorrenza: Ricorrenza) => {
                          const fonte = typeof ricorrenza.fonte === 'object'
                            ? ricorrenza.fonte as Fonte
                            : null

                          return (
                            <div
                              key={ricorrenza.id}
                              className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                            >
                              <blockquote className="font-serif italic text-gray-800 mb-2">
                                &ldquo;{ricorrenza.citazione_originale}&rdquo;
                              </blockquote>

                              {ricorrenza.trascrizione_moderna && (
                                <p className="text-sm text-gray-600 mb-2">
                                  Trascrizione: {ricorrenza.trascrizione_moderna}
                                </p>
                              )}

                              {fonte && (
                                <div className="text-sm text-gray-700 mt-3 pt-3 border-t border-amber-200">
                                  <div className="font-semibold">{fonte.titolo}</div>
                                  {fonte.autore && (
                                    <div className="text-gray-600">Autore: {fonte.autore}</div>
                                  )}
                                  {fonte.anno && (
                                    <div className="text-gray-600">Anno: {fonte.anno}</div>
                                  )}
                                  {ricorrenza.pagina_riferimento && (
                                    <div className="text-gray-600">
                                      Pagina: {ricorrenza.pagina_riferimento}
                                    </div>
                                  )}
                                  {fonte.shorthand_id && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Rif.: {fonte.shorthand_id}
                                    </div>
                                  )}
                                </div>
                              )}

                              {ricorrenza.note_filologiche && (
                                <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
                                  <strong>Note filologiche:</strong> {ricorrenza.note_filologiche}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Riferimenti Incrociati */}
      {riferimenti.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Riferimenti incrociati</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riferimenti.map((rif) => {
              const lemmaDestinazione = typeof rif.lemma_destinazione === 'object'
                ? rif.lemma_destinazione as Lemma
                : null

              if (!lemmaDestinazione) return null

              const tipoLabel = {
                sinonimo: 'Sinonimo',
                contrario: 'Contrario',
                correlato: 'Correlato',
                vedi_anche: 'Vedi anche',
              }[rif.tipo]

              return (
                <Link
                  key={rif.id}
                  href={`/lemmi/${lemmaDestinazione.slug}`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="text-sm text-gray-600 mb-1">{tipoLabel}</div>
                  <div className="font-semibold text-gray-900">{lemmaDestinazione.termine}</div>
                  {rif.note && (
                    <div className="text-sm text-gray-600 mt-2">{rif.note}</div>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Note Redazionali */}
      {lemma.note_redazionali && (
        <section className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Note redazionali</h2>
          <p className="text-gray-700 text-sm">{lemma.note_redazionali}</p>
        </section>
      )}
    </div>
  )
}
