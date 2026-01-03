import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Lemmario</h3>
            <p className="text-sm text-gray-600">
              Dizionario specializzato della terminologia matematica ed economica
              italiana storica da statuti e documenti medievali e rinascimentali.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3">Link utili</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/informazioni" className="text-gray-600 hover:text-primary-600">
                  Informazioni sul progetto
                </Link>
              </li>
              <li>
                <Link href="/bibliografia" className="text-gray-600 hover:text-primary-600">
                  Bibliografia
                </Link>
              </li>
              <li>
                <Link href="/contatti" className="text-gray-600 hover:text-primary-600">
                  Contatti
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3">Ricerca</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ricerca" className="text-gray-600 hover:text-primary-600">
                  Ricerca avanzata
                </Link>
              </li>
              <li>
                <Link href="/lemmari" className="text-gray-600 hover:text-primary-600">
                  Sfoglia dizionari
                </Link>
              </li>
              <li>
                <Link href="/lemmi" className="text-gray-600 hover:text-primary-600">
                  Indice lemmi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>&copy; {currentYear} Lemmario. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  )
}
