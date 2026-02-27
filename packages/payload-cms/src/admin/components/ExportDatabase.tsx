import React, { useState, useCallback } from 'react'
import { useAuth } from 'payload/components/utilities'

const ExportDatabase: React.FC = () => {
  const { user } = useAuth()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      window.location.href = '/api/admin/export/database'
    } finally {
      // Reset after a delay to allow the download to start
      setTimeout(() => setDownloading(false), 3000)
    }
  }, [])

  if (!user || (user as any).ruolo !== 'super_admin') {
    return null
  }

  return (
    <div
      style={{
        marginTop: '2rem',
        padding: '1.5rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        backgroundColor: 'var(--theme-elevation-50)',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Export Database</h3>
      <p style={{ marginBottom: '1rem', color: 'var(--theme-elevation-600)' }}>
        Scarica un dump completo del database in formato SQL per replicare
        l&apos;ambiente in locale.
      </p>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="btn btn--style-primary btn--size-medium"
      >
        {downloading ? 'Download in corso...' : 'Scarica Database SQL'}
      </button>
    </div>
  )
}

export default ExportDatabase
