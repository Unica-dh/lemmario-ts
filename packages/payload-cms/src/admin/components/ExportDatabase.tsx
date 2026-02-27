import React, { useState, useEffect } from 'react'

const ExportDatabase: React.FC = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch('/api/utenti/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.ruolo === 'super_admin') {
          setIsSuperAdmin(true)
        }
      })
      .catch(() => {
        // ignore - user not authenticated or fetch failed
      })
  }, [])

  if (!isSuperAdmin) {
    return null
  }

  const handleDownload = () => {
    setDownloading(true)
    window.location.href = '/api/admin/export/database'
    setTimeout(() => setDownloading(false), 3000)
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
