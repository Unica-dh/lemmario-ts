/**
 * Extracts a sort key from a bibliographic title by stripping location/author prefixes.
 *
 * Handles two patterns:
 * 1. Location prefixes (stripped iteratively): "Bologna, Archivio di Stato, Riformatori dello Studio"
 *    → strips "Bologna" then "Archivio di Stato" → sort key = "Riformatori dello Studio"
 * 2. Author prefixes (single strip): "Luca Pacioli, Summa de arithmetica..."
 *    → sort key = "Summa de arithmetica..."
 *
 * Words in TITLE_START_WORDS are never stripped (they mark the beginning of the actual title).
 */

// Geographic/institutional words: always strip (can be nested)
const LOCATION_FIRST_WORDS = ['Archivio', 'Bologna', 'Firenze', 'Genova']

// Words that mark the actual title start (never strip)
const TITLE_START_WORDS = [
  'Breve',
  'Capitula',
  'Costituzioni',
  'Libro',
  'Manoscritto',
  'Nuova',
  'Pratica',
  'Regesta',
  'Regulae',
  'Ricordi',
  'Rotuli',
  'San',
  'Statuti',
  'Statuto',
  'Statutorum',
  'Tractato',
  'Tractatus',
  'Trattato',
  'Volumen',
]

export function getBibliographySortKey(titolo: string): string {
  let result = titolo

  // Iteratively strip location/institutional prefixes
  let stripped = true
  while (stripped) {
    stripped = false
    const commaIndex = result.indexOf(', ')
    if (commaIndex < 0) break

    const beforeComma = result.substring(0, commaIndex)
    const firstWord = beforeComma.split(/\s+/)[0]

    if (LOCATION_FIRST_WORDS.includes(firstWord)) {
      result = result.substring(commaIndex + 2)
      stripped = true
    }
  }

  // If location prefixes were stripped, we already have the title
  if (result !== titolo) return result

  // Otherwise check for author prefix (single strip)
  const commaIndex = titolo.indexOf(', ')
  if (commaIndex < 0) return titolo

  const beforeComma = titolo.substring(0, commaIndex)
  const firstWord = beforeComma.split(/\s+/)[0]

  if (TITLE_START_WORDS.includes(firstWord)) return titolo

  // Personal names, "Anonimo", abbreviations like "P.", "F."
  return titolo.substring(commaIndex + 2)
}
