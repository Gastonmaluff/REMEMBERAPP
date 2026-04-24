import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import ReminderForm from './ReminderForm'

function NewReminderModal({ errorMessage, isSubmitting, onClose, onSubmit }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="new-reminder-title">
      <header className="modal-header">
        <button className="icon-button icon-button--ghost" onClick={onClose} type="button" aria-label="Volver">
          <ArrowLeft size={22} />
        </button>
        <h2 id="new-reminder-title">Nuevo recordatorio</h2>
        <button
          className="modal-header__save"
          disabled={isSubmitting}
          form="reminder-form"
          type="submit"
        >
          Guardar
        </button>
      </header>

      <ReminderForm errorMessage={errorMessage} isSubmitting={isSubmitting} onSubmit={onSubmit} />
    </div>
  )
}

export default NewReminderModal
