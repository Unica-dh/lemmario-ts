import MainNav from '@/components/MainNav'

export default function RicercaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MainNav />
      <main className="flex-1">
        {children}
      </main>
    </>
  )
}
