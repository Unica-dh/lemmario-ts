import { notFound } from 'next/navigation'
import MainNav from '@/components/MainNav'
import { getLemmarioBySlug } from '@/lib/payload-api'

interface LayoutProps {
  children: React.ReactNode
  params: {
    'lemmario-slug': string
  }
}

export default async function LemmarioLayout({ children, params }: LayoutProps) {
  const lemmario = await getLemmarioBySlug(params['lemmario-slug'])

  if (!lemmario) {
    notFound()
  }

  return (
    <>
      <MainNav
        lemmarioSlug={lemmario.slug}
        lemmarioId={lemmario.id}
        lemmarioTitolo={lemmario.titolo}
      />
      <main className="flex-1">
        {children}
      </main>
    </>
  )
}
