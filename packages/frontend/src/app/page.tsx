import { redirect } from 'next/navigation'
import { getLemmari } from '@/lib/payload-api'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    // Ottiene il primo lemmario attivo
    const response = await fetch('http://payload:3000/api/lemmari?where={"attivo":{"equals":true}}&limit=1', {
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data?.docs?.length > 0) {
      // Redirect al primo lemmario
      const slug = data.docs[0].slug
      redirect(`/${slug}/`)
    }
  } catch (error) {
    console.error('Errore nel caricamento dei lemmari:', error)
  }

  // Fallback se non ci sono lemmari
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Lemmario
      </h1>
      <p className="text-lg text-gray-600">
        Nessun lemmario disponibile al momento.
      </p>
    </div>
  )
}
