import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronDown, Clock3, Plus } from 'lucide-react'
import {
  createMariaPortalReminder,
  subscribeToMariaPortalReminders,
} from './services/remindersService'
import {
  formatShortDate,
  getDrivingBucket,
  getDrivingBucketLabel,
  getRoundedTime,
  getTodayKey,
  sortDrivingReminders,
  sortReminders,
} from './reminderUtils'

function getPortalItemStatus(reminder, todayKey) {
  if (reminder.completed) {
    return {
      label: 'Cumplido',
      tone: 'completed',
    }
  }

  const bucket = getDrivingBucket(reminder, todayKey)

  return {
    label: getDrivingBucketLabel(bucket),
    tone: bucket,
  }
}

function MariaPortalItem({ reminder, showCompletedState = false, todayKey }) {
  const status = getPortalItemStatus(reminder, todayKey)

  return (
    <article
      className={`portal-reminder ${showCompletedState ? 'is-completed' : ''}`}
    >
      <div className="portal-reminder__header">
        <div>
          <h3>{reminder.title}</h3>
          <div className="portal-reminder__meta">
            <span className="meta-inline">
              <CalendarDays size={14} />
              {formatShortDate(reminder.date)}
            </span>
            <span className="meta-inline">
              <Clock3 size={14} />
              {reminder.time}
            </span>
          </div>
        </div>

        <span className={`portal-status portal-status--${status.tone}`}>
          {showCompletedState ? <CheckCircle2 size={15} /> : null}
          {status.label}
        </span>
      </div>

      {reminder.notes ? <p className="portal-reminder__notes">{reminder.notes}</p> : null}
    </article>
  )
}

function MariaPortalView() {
  const [reminders, setReminders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false)
  const [formValues, setFormValues] = useState({
    title: '',
    notes: '',
    date: getTodayKey(),
    time: getRoundedTime(),
  })

  const todayKey = getTodayKey()

  useEffect(() => {
    console.info('Maria portal loaded')

    const unsubscribe = subscribeToMariaPortalReminders(
      (items) => {
        console.info('Loaded Maria reminders:', items.length)
        setReminders(sortReminders(items))
        setErrorMessage('')
        setIsLoading(false)
      },
      (error) => {
        console.error('Error loading Maria reminders:', error)
        setErrorMessage('No se pudieron cargar los recordatorios de Maria.')
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage('')
    }, 2200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [feedbackMessage])

  const pendingReminders = useMemo(
    () => sortDrivingReminders(reminders, todayKey),
    [reminders, todayKey],
  )

  const completedReminders = useMemo(
    () =>
      sortReminders(
        reminders.filter((reminder) => reminder.completed === true),
        () => false,
      ),
    [reminders],
  )

  function updateField(field, value) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (
      isSubmitting ||
      !formValues.title.trim() ||
      !formValues.date ||
      !formValues.time
    ) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      const createdReminder = await createMariaPortalReminder(formValues)

      setReminders((current) =>
        sortReminders([
          ...current.filter((reminder) => reminder.id !== createdReminder.id),
          createdReminder,
        ]),
      )
      setFormValues({
        title: '',
        notes: '',
        date: getTodayKey(),
        time: getRoundedTime(),
      })
      setFeedbackMessage('Recordatorio agregado')
    } catch {
      setErrorMessage('No se pudo agregar el recordatorio')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell maria-portal">
      <div className="app-shell__frame">
        <div className="app-shell__content portal-screen">
          <header className="portal-header">
            <p className="dashboard-header__eyebrow">Portal especial</p>
            <h1>Hola Mar&iacute;a</h1>
            <p className="portal-header__subtitle">
              Carg&aacute; ac&aacute; los recordatorios para Gast&oacute;n
            </p>
          </header>

          <section className="portal-card">
            <form className="portal-form" onSubmit={handleSubmit}>
              <label className="portal-field">
                <span>Titulo del recordatorio</span>
                <input
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="Ej. Llamar al contador"
                  type="text"
                  value={formValues.title}
                />
              </label>

              <label className="portal-field">
                <span>Nota opcional</span>
                <textarea
                  onChange={(event) => updateField('notes', event.target.value)}
                  placeholder="Detalles para Gaston"
                  rows={3}
                  value={formValues.notes}
                />
              </label>

              <div className="portal-form__grid">
                <label className="portal-field">
                  <span>Fecha</span>
                  <input
                    onChange={(event) => updateField('date', event.target.value)}
                    type="date"
                    value={formValues.date}
                  />
                </label>

                <label className="portal-field">
                  <span>Hora</span>
                  <input
                    onChange={(event) => updateField('time', event.target.value)}
                    type="time"
                    value={formValues.time}
                  />
                </label>
              </div>

              {feedbackMessage ? (
                <p className="feedback-message feedback-message--success">
                  {feedbackMessage}
                </p>
              ) : null}
              {errorMessage ? (
                <p className="feedback-message feedback-message--error">{errorMessage}</p>
              ) : null}

              <button
                className="primary-button"
                disabled={
                  isSubmitting ||
                  !formValues.title.trim() ||
                  !formValues.date ||
                  !formValues.time
                }
                type="submit"
              >
                {isSubmitting ? 'Agregando...' : 'Agregar recordatorio'}
              </button>
            </form>
          </section>

          <section className="portal-section" aria-labelledby="maria-pending-title">
            <div className="portal-section__header">
              <h2 id="maria-pending-title">Pendientes para Gast&oacute;n</h2>
              <span className="portal-section__count">{pendingReminders.length}</span>
            </div>

            {isLoading ? (
              <div className="portal-list">
                {[1, 2, 3].map((item) => (
                  <article className="portal-reminder portal-reminder--skeleton" key={item}>
                    <div className="skeleton-line skeleton-line--title" />
                    <div className="skeleton-line skeleton-line--meta" />
                  </article>
                ))}
              </div>
            ) : pendingReminders.length > 0 ? (
              <div className="portal-list">
                {pendingReminders.map((reminder) => (
                  <MariaPortalItem key={reminder.id} reminder={reminder} todayKey={todayKey} />
                ))}
              </div>
            ) : (
              <article className="empty-state empty-state--compact">
                <div className="empty-state__icon">
                  <Plus size={22} />
                </div>
                <h3>No hay recordatorios pendientes para Gast&oacute;n</h3>
                <p>Cuando cargues uno nuevo desde este portal, va a aparecer ac&aacute;.</p>
              </article>
            )}
          </section>

          <section className="portal-section" aria-labelledby="maria-completed-title">
            <div className="portal-section__header">
              <button
                aria-controls="maria-completed-content"
                aria-expanded={isCompletedSectionOpen && completedReminders.length > 0}
                className="completed-section__toggle"
                id="maria-completed-title"
                onClick={() => setIsCompletedSectionOpen((current) => !current)}
                type="button"
              >
                <span className="completed-section__title">
                  Cumplidos <span className="completed-section__count">&middot; {completedReminders.length}</span>
                </span>
                <ChevronDown
                  className={
                    isCompletedSectionOpen && completedReminders.length > 0 ? 'is-open' : ''
                  }
                  size={18}
                />
              </button>
            </div>

            {completedReminders.length === 0 ? (
              <p className="portal-section__hint">
                Todavia no hay recordatorios cumplidos
              </p>
            ) : null}

            {completedReminders.length > 0 && isCompletedSectionOpen ? (
              <div className="portal-list" id="maria-completed-content">
                {completedReminders.map((reminder) => (
                  <MariaPortalItem
                    key={reminder.id}
                    reminder={reminder}
                    showCompletedState
                    todayKey={todayKey}
                  />
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}

export default MariaPortalView
