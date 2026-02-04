/**
 * DefinedTerm JSON-LD Schema component for Lemmi
 * Generates structured data for dictionary/glossary entries
 * https://schema.org/DefinedTerm
 */

import { JsonLd } from './JsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'

interface LemmaSchemaProps {
  lemma: {
    termine: string
    slug: string
    tipo?: 'latino' | 'volgare'
    etimologia?: string
  }
  lemmario: {
    slug: string
    titolo: string
  }
  definizione?: string
}

export function LemmaSchema({ lemma, lemmario, definizione }: LemmaSchemaProps) {
  const url = `${SITE_URL}/${lemmario.slug}/lemmi/${lemma.slug}`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': url,
    name: lemma.termine,
    url: url,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': `${SITE_URL}/${lemmario.slug}`,
      name: lemmario.titolo,
      url: `${SITE_URL}/${lemmario.slug}`,
    },
  }

  // Add description from definition or etymology
  if (definizione) {
    schema.description = definizione
  } else if (lemma.etimologia) {
    schema.description = lemma.etimologia
  }

  // Add language based on tipo
  if (lemma.tipo === 'latino') {
    schema.inLanguage = 'la'
    schema.termCode = 'lat'
  } else if (lemma.tipo === 'volgare') {
    schema.inLanguage = 'it'
    schema.termCode = 'it-medieval'
  }

  return <JsonLd data={schema} />
}
