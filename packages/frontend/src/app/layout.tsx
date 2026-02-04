import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glossari.dh.unica.it'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    template: '%s | Glossari UniCa',
    default: 'Glossari - Dizionari Storici | Universita di Cagliari',
  },

  description: 'Glossari della terminologia matematica ed economica italiana storica. Progetto del Centro Interdipartimentale per l\'Umanistica Digitale dell\'Universita degli Studi di Cagliari.',

  keywords: [
    'glossario',
    'dizionario storico',
    'lessico italiano',
    'matematica medievale',
    'economia medievale',
    'umanistica digitale',
    'terminologia storica',
    'latino',
    'volgare',
  ],

  authors: [
    { name: 'Centro Umanistica Digitale - Universita di Cagliari' },
  ],

  creator: 'Centro Interdipartimentale per l\'Umanistica Digitale',
  publisher: 'Universita degli Studi di Cagliari',

  formatDetection: {
    email: false,
    telephone: false,
  },

  openGraph: {
    type: 'website',
    locale: 'it_IT',
    siteName: 'Glossari - Universita di Cagliari',
    title: 'Glossari - Dizionari Storici della Terminologia Italiana',
    description: 'Glossari della terminologia matematica ed economica italiana storica. Progetto del Centro Interdipartimentale per l\'Umanistica Digitale.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Glossari dell\'Universita di Cagliari - Dizionario storico della terminologia italiana',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Glossari - Dizionari Storici | UniCa',
    description: 'Glossari della terminologia matematica ed economica italiana storica.',
    images: ['/og-image.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  category: 'education',

  other: {
    'google-site-verification': '', // Add verification code when available
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              '@id': `${SITE_URL}/#organization`,
              name: 'Centro Interdipartimentale per l\'Umanistica Digitale',
              alternateName: 'DH UniCa',
              url: SITE_URL,
              logo: `${SITE_URL}/og-image.jpg`,
              parentOrganization: {
                '@type': 'CollegeOrUniversity',
                name: 'Universita degli Studi di Cagliari',
                url: 'https://www.unica.it',
              },
              sameAs: [
                'https://www.facebook.com/dh.unica',
                'https://www.instagram.com/dh.unica',
                'https://t.me/dhunica',
              ],
            }),
          }}
        />
        {/* JSON-LD WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': `${SITE_URL}/#website`,
              url: SITE_URL,
              name: 'Glossari - Universita di Cagliari',
              description: 'Glossari della terminologia matematica ed economica italiana storica',
              publisher: {
                '@id': `${SITE_URL}/#organization`,
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${SITE_URL}/ricerca?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
              inLanguage: 'it-IT',
            }),
          }}
        />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
