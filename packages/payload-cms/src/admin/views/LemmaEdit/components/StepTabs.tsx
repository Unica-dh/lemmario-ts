import React from 'react'
import { useLemmaEdit } from '../context'

/**
 * StepTabs - Navigation tra gli step
 */

interface Step {
  id: number
  label: string
  component: React.ReactNode
}

interface StepTabsProps {
  steps: Step[]
}

export const StepTabs: React.FC<StepTabsProps> = ({ steps }) => {
  const { state, dispatch } = useLemmaEdit()
  const { currentStep, isDirty } = state

  const handleStepChange = (stepId: number) => {
    if (isDirty) {
      const confirm = window.confirm(
        'Hai modifiche non salvate. Vuoi davvero cambiare scheda?'
      )
      if (!confirm) return
    }
    dispatch({ type: 'SET_STEP', payload: stepId })
  }

  const currentComponent = steps.find((s) => s.id === currentStep)?.component

  return (
    <div className="step-tabs-container">
      {/* Tab navigation */}
      <div className="tabs-header">
        {steps.map((step) => (
          <button
            key={step.id}
            className={`tab-button ${currentStep === step.id ? 'active' : ''}`}
            onClick={() => handleStepChange(step.id)}
            type="button"
          >
            <span className="tab-number">{step.id}</span>
            <span className="tab-label">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">{currentComponent}</div>
    </div>
  )
}

export default StepTabs