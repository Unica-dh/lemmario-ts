import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { LemmaEditProvider, useLemmaEdit } from './context'
import { useSync } from './hooks'
import { StepTabs } from './components'
import { BaseStep, VariantiStep, DefinizioniStep, RiferimentiStep } from './steps'

/**
 * LemmaEditView - Custom Edit View per Collection Lemmi
 * 
 * Form multi-step unificato che permette di gestire:
 * - Dati base lemma
 * - Varianti grafiche
 * - Definizioni con ricorrenze
 * - Riferimenti incrociati
 */

const LemmaEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const history = useHistory()
  const { state, dispatch } = useLemmaEdit()
  const { loadLemma, saveAll, isLoading, isSaving, error } = useSync()

  const { lemma, isDirty, currentStep } = state

  // Carica lemma all'avvio
  useEffect(() => {
    if (id && id !== 'create') {
      loadLemma(id).catch((err) => {
        console.error('Errore caricamento lemma:', err)
        alert('Errore nel caricamento del lemma')
      })
    }
  }, [id])

  // Warning prima di lasciare la pagina con modifiche non salvate
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleSave = async () => {
    if (!isDirty) {
      alert('Nessuna modifica da salvare')
      return
    }

    try {
      await saveAll()
      alert('✅ Lemma salvato con successo!')
    } catch (err: any) {
      console.error('Errore salvataggio:', err)
      alert(`❌ Errore nel salvataggio: ${err.message}`)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirm = window.confirm(
        'Hai modifiche non salvate. Vuoi davvero annullare?'
      )
      if (!confirm) return
    }
    history.push('/admin/collections/lemmi')
  }

  const steps = [
    { id: 1, label: 'Dati Base', component: <BaseStep /> },
    { id: 2, label: 'Varianti Grafiche', component: <VariantiStep /> },
    { id: 3, label: 'Definizioni', component: <DefinizioniStep /> },
    { id: 4, label: 'Riferimenti', component: <RiferimentiStep /> },
  ]

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Caricamento lemma...</p>
      </div>
    )
  }

  if (!lemma && id !== 'create') {
    return (
      <div className="error-container">
        <h2>Lemma non trovato</h2>
        <button onClick={handleCancel}>← Torna alla lista</button>
      </div>
    )
  }

  return (
    <div className="lemma-edit-view">
      {/* Header */}
      <header className="edit-header">
        <div className="header-left">
          <h1>
            {lemma?.id ? `Modifica Lemma: ${lemma.termine}` : 'Nuovo Lemma'}
          </h1>
          <span className={`status-badge ${isDirty ? 'unsaved' : 'saved'}`}>
            {isDirty ? '⚠️ Non salvato' : '✅ Salvato'}
          </span>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Annulla
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? 'Salvataggio...' : '💾 Salva Tutto'}
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <strong>❌ Errore:</strong> {error}
        </div>
      )}

      {/* Multi-step form */}
      <div className="edit-content">
        <StepTabs steps={steps} />
      </div>

      {/* Footer */}
      <footer className="edit-footer">
        <div className="footer-info">
          <p>
            Step {currentStep} di {steps.length} •{' '}
            {isDirty ? 'Modifiche non salvate' : 'Tutto salvato'}
          </p>
        </div>
        <div className="footer-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn-prev"
              onClick={() =>
                dispatch({ type: 'SET_STEP', payload: currentStep - 1 })
              }
            >
              ← Precedente
            </button>
          )}
          {currentStep < steps.length && (
            <button
              type="button"
              className="btn-next"
              onClick={() =>
                dispatch({ type: 'SET_STEP', payload: currentStep + 1 })
              }
            >
              Successivo →
            </button>
          )}
          {currentStep === steps.length && (
            <button
              type="button"
              className="btn-save-final"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? 'Salvataggio...' : '✅ Salva e Completa'}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

// Wrapper con Provider
export const LemmaEditView: React.FC = () => {
  return (
    <LemmaEditProvider>
      <LemmaEditContent />
    </LemmaEditProvider>
  )
}

export default LemmaEditView

// Inject CSS styles (inline to avoid import issues with ts-node)
if (typeof document !== 'undefined') {
  const styleId = 'lemma-edit-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .lemma-edit-view { padding: 2rem; max-width: 1400px; margin: 0 auto; }
      .edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e0e0e0; }
      .header-left h1 { font-size: 1.75rem; margin: 0 0 0.5rem 0; color: #333; }
      .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
      .status-badge.saved { background: #d4edda; color: #155724; }
      .status-badge.unsaved { background: #fff3cd; color: #856404; }
      .header-actions { display: flex; gap: 1rem; }
      .btn-cancel { background: #6c757d; color: white; padding: 0.5rem 1.25rem; border: none; border-radius: 4px; cursor: pointer; }
      .btn-save, .btn-save-final { background: #28a745; color: white; padding: 0.5rem 1.25rem; border: none; border-radius: 4px; cursor: pointer; }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      .error-banner { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
      .tabs-header { display: flex; gap: 8px; border-bottom: 2px solid #e0e0e0; margin-bottom: 2rem; }
      .tab-button { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; transition: all 0.2s; position: relative; bottom: -2px; }
      .tab-button:hover:not(:disabled) { color: #333; background: #f5f5f5; }
      .tab-button.active { color: #0066cc; border-bottom-color: #0066cc; background: #f0f7ff; }
      .tab-number { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #e0e0e0; color: #666; font-size: 12px; font-weight: bold; }
      .tab-button.active .tab-number { background: #0066cc; color: white; }
      .tab-content { padding: 20px 0; }
      .form-group { margin-bottom: 1.5rem; }
      .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333; }
      .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; font-size: 1rem; }
      .form-group textarea { min-height: 100px; resize: vertical; }
      .edit-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #e0e0e0; }
      .footer-actions { display: flex; gap: 1rem; }
      .loading-container { text-align: center; padding: 3rem 1rem; }
      .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #0066cc; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `
    document.head.appendChild(style)
  }
}
