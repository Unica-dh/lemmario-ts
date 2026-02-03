import Link from 'next/link'
import { getGlobalContenutiStatici } from '@/lib/payload-api'

export default async function Footer() {
  const currentYear = new Date().getFullYear()
  const contenutiStatici = await getGlobalContenutiStatici()

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

          {contenutiStatici.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Informazioni</h3>
              <ul className="space-y-2 text-sm">
                {contenutiStatici.map((contenuto) => (
                  <li key={contenuto.id}>
                    <Link
                      href={`/pagine/${contenuto.slug}`}
                      className="text-gray-600 hover:text-primary-600"
                    >
                      {contenuto.titolo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-bold text-gray-900 mb-3">Navigazione</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary-600">
                  Dizionari
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
