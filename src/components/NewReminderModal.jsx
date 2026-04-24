import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import ReminderForm from './ReminderForm'

function getSaveLabel(isSubmitting, saveSucceeded) {
  if (isSubmitting) {
    return 'Creando...'
  }

  if (saveSucceeded) {
    return 'Guardado'
  }

  return 'Guardar'
}

function NewReminderModal({
  errorMessage,
  isSubmitting,
  onClose,
  onSubmit,
  saveSucceeded,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSubmitting, onClose])

  return (
    <div
      className="modal-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-reminder-title"
    >
      <header className="modal-header">
        <button
          className="icon-button icon-button--ghost"
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 id="new-reminder-title">Nuevo recordatorio</h2>
        <button
          className="modal-header__save"
          disabled={isSubmitting || saveSucceeded}
          form="reminder-form"
          type="submit"
        >
          {getSaveLabel(isSubmitting, saveSucceeded)}
        </button>
      </header>

      <ReminderForm
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        saveSucceeded={saveSucceeded}
      />
    </div>
  )
}

export default NewReminderModal
