import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { LemmaEditProvider, useLemmaEdit } from './context'
import { useSync } from './hooks'
import { StepTabs, AnteprimaLemma } from './components'
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

      {/* Multi-step form + Sidebar Anteprima */}
      <div className="edit-content-wrapper">
        <div className="edit-content">
          <StepTabs steps={steps} />
        </div>
        <aside className="sidebar-anteprima">
          <AnteprimaLemma />
        </aside>
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
      /* Layout */
      .lemma-edit-view { padding: 2rem; max-width: 1800px; margin: 0 auto; }
      .edit-content-wrapper { display: grid; grid-template-columns: 1fr 400px; gap: 24px; margin-top: 2rem; }
      .edit-content { flex: 1; min-width: 0; }
      .sidebar-anteprima { position: sticky; top: 20px; height: calc(100vh - 200px); overflow-y: auto; }
      
      /* Header */
      .edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e0e0e0; }
      .header-left h1 { font-size: 1.75rem; margin: 0 0 0.5rem 0; color: #333; }
      .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
      .status-badge.saved { background: #d4edda; color: #155724; }
      .status-badge.unsaved { background: #fff3cd; color: #856404; }
      .header-actions { display: flex; gap: 1rem; }
      
      /* Buttons */
      button { padding: 0.5rem 1.25rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; }
      .btn-cancel { background: #6c757d; color: white; }
      .btn-cancel:hover:not(:disabled) { background: #5a6268; }
      .btn-save, .btn-save-final { background: #28a745; color: white; }
      .btn-save:hover:not(:disabled), .btn-save-final:hover:not(:disabled) { background: #218838; }
      .btn-add, .btn-add-def, .btn-add-ricorrenza, .btn-add-rif, .btn-add-variante { background: #007bff; color: white; margin-top: 1rem; }
      .btn-add:hover, .btn-add-def:hover, .btn-add-ricorrenza:hover, .btn-add-rif:hover, .btn-add-variante:hover { background: #0056b3; }
      .btn-delete, .btn-delete-def, .btn-delete-ric, .btn-delete-rif { background: #dc3545; color: white; padding: 0.4rem 0.8rem; font-size: 0.85rem; }
      .btn-delete:hover, .btn-delete-def:hover, .btn-delete-ric:hover, .btn-delete-rif:hover { background: #c82333; }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      
      /* Banners */
      .error-banner { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
      
      /* Tabs */
      .tabs-header { display: flex; gap: 8px; border-bottom: 2px solid #e0e0e0; margin-bottom: 2rem; }
      .tab-button { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; transition: all 0.2s; position: relative; bottom: -2px; }
      .tab-button:hover:not(:disabled) { color: #333; background: #f5f5f5; }
      .tab-button.active { color: #0066cc; border-bottom-color: #0066cc; background: #f0f7ff; }
      .tab-number { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #e0e0e0; color: #666; font-size: 12px; font-weight: bold; }
      .tab-button.active .tab-number { background: #0066cc; color: white; }
      .tab-content { padding: 20px 0; }
      
      /* Form Base */
      .form-group { margin-bottom: 1.5rem; }
      .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333; }
      .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; font-size: 1rem; }
      .form-group textarea { min-height: 100px; resize: vertical; }
      .form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none; border-color: #0066cc; box-shadow: 0 0 0 3px rgba(0,102,204,0.1); }
      .form-group small { display: block; margin-top: 0.25rem; color: #6c757d; font-size: 0.875rem; }
      .required { color: #dc3545; }
      .description { color: #6c757d; margin-bottom: 1.5rem; }
      .empty-state { color: #6c757d; font-style: italic; padding: 2rem; text-align: center; background: #f8f9fa; border-radius: 4px; }
      
      /* Varianti Step */
      .varianti-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
      .variante-item { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 1.25rem; display: flex; gap: 1rem; align-items: flex-start; }
      .variante-input { flex: 1; }
      .variante-input input { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; }
      .variante-note { flex: 2; }
      .variante-note input { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; }
      .add-variante-form { background: #fff; padding: 1rem; border: 1px dashed #ced4da; border-radius: 4px; margin-bottom: 1rem; }
      .add-variante-form input { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; margin-bottom: 0.5rem; }
      
      /* Definizioni Step */
      .definizioni-list { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 1rem; }
      .definizione-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 1.25rem; }
      .def-header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
      .def-number { background: #0066cc; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: bold; font-size: 0.85rem; }
      .def-testo { flex: 1; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; }
      
      /* Ricorrenze (nested in Definizioni) */
      .ricorrenze-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed #ced4da; }
      .ricorrenze-section h4 { margin: 0 0 1rem 0; font-size: 1rem; color: #6c757d; }
      .ricorrenza-item { background: #ffffff; border: 1px solid #ced4da; border-radius: 4px; padding: 1rem; margin-bottom: 0.75rem; }
      .ric-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
      .ric-row.full-width { grid-template-columns: 1fr; }
      .ric-field label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.9rem; }
      .ric-field input, .ric-field select, .ric-field textarea { width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9rem; }
      .ric-field.full-width textarea { min-height: 80px; }
      .ric-actions { display: flex; justify-content: flex-end; }
      
      /* Riferimenti Step */
      .riferimenti-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
      .riferimento-item { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 1.25rem; }
      .rif-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
      .rif-row.full-width { grid-template-columns: 1fr; }
      .rif-field label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.9rem; }
      .rif-field input, .rif-field select, .rif-field textarea { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 4px; }
      .rif-field.full-width textarea { min-height: 60px; }
      .rif-actions { display: flex; justify-content: flex-end; gap: 0.5rem; align-items: center; }
      .badge-auto { background: #17a2b8; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; }
      .info-box { background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px; padding: 1rem; margin-top: 1rem; }
      .info-box strong { color: #004085; }
      
      /* Footer */
      .edit-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #e0e0e0; }
      .footer-info { color: #6c757d; font-size: 0.9rem; }
      .footer-actions { display: flex; gap: 1rem; }
      
      /* Loading */
      .loading-container { text-align: center; padding: 3rem 1rem; }
      .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #0066cc; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

      /* Anteprima Lemma */
      .anteprima-lemma { background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; padding: 1.5rem; }
      .anteprima-placeholder { background: #f8f9fa; border: 1px dashed #ced4da; border-radius: 8px; padding: 2rem; text-align: center; color: #6c757d; font-style: italic; }
      .anteprima-title { margin: 0 0 1.5rem 0; font-size: 1.25rem; color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 0.5rem; }
      .anteprima-section { margin-bottom: 1.5rem; }
      .termine-principale { font-size: 1.5rem; color: #0066cc; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
      .badge-tipo { background: #6c757d; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
      .section-label { display: block; color: #495057; font-size: 0.95rem; margin-bottom: 0.75rem; }
      .varianti-list-preview { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .variante-badge { background: #e9ecef; color: #495057; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; border: 1px solid #ced4da; }
      .def-preview { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
      .def-preview:last-child { margin-bottom: 0; }
      .def-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
      .def-numero { background: #0066cc; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: bold; font-size: 0.85rem; }
      .livello-badge { background: #28a745; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
      .def-testo { color: #333; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem; }
      .text-muted { color: #6c757d; font-style: italic; }
      .ricorrenze-list { background: #ffffff; border: 1px solid #dee2e6; border-radius: 4px; padding: 1rem; margin-top: 1rem; }
      .ricorrenze-header { margin-bottom: 0.75rem; color: #495057; font-size: 0.9rem; }
      .ric-item { background: #f8f9fa; border-left: 3px solid #0066cc; padding: 0.75rem; margin-bottom: 0.75rem; border-radius: 4px; }
      .ric-item:last-child { margin-bottom: 0; }
      .ric-fonte { font-weight: 600; color: #495057; font-size: 0.9rem; margin-bottom: 0.5rem; }
      .ric-pagina { color: #6c757d; font-weight: normal; }
      .ric-testo { color: #6c757d; font-size: 0.85rem; line-height: 1.4; font-style: italic; }
      .empty-text { color: #6c757d; font-style: italic; display: block; padding: 1rem; text-align: center; background: #f8f9fa; border-radius: 4px; }
      .anteprima-footer { border-top: 1px solid #dee2e6; padding-top: 1rem; margin-top: 1.5rem; }
      .footer-note { color: #6c757d; font-size: 0.85rem; display: block; }

      /* Responsive */
      @media (max-width: 1200px) {
        .edit-content-wrapper { grid-template-columns: 1fr; }
        .sidebar-anteprima { display: none; }
      }
      @media (max-width: 768px) {
        .lemma-edit-view { padding: 1rem; }
        .edit-header, .edit-footer { flex-direction: column; gap: 1rem; }
        .ric-row, .rif-row { grid-template-columns: 1fr; }
        .variante-item { flex-direction: column; }
      }
    `
    document.head.appendChild(style)
  }
}
