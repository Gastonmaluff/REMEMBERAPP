import { useEffect } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  RefreshCw,
} from 'lucide-react'
import { getCategoryMeta, getPriorityMeta } from '../reminderOptions'
import {
  formatLastUpdated,
  formatShortDate,
  getDrivingBucket,
  getDrivingBucketLabel,
} from '../reminderUtils'

const REFRESH_INTERVAL_MS = 7 * 60 * 1000

function DrivingReminderRow({ actionState, onComplete, reminder, todayKey }) {
  const categoryMeta = getCategoryMeta(reminder.category)
  const priorityMeta = getPriorityMeta(reminder.priority)
  const bucket = getDrivingBucket(reminder, todayKey)
  const isCompleting = actionState?.action === 'completing'
  const isBusy = Boolean(actionState)

  return (
    <article
      className={`driving-row driving-row--${bucket} ${isCompleting ? 'is-completing' : ''}`}
    >
      <div className="driving-row__main">
        <div className="driving-row__title-line">
          <h3 className="driving-row__title">{reminder.title}</h3>
          <span className={`driving-status driving-status--${bucket}`}>
            {getDrivingBucketLabel(bucket)}
          </span>
        </div>

        <div className="driving-row__meta">
          <span className="driving-meta">
            <CalendarDays size={14} />
            {formatShortDate(reminder.date)}
          </span>
          <span className="driving-meta">
            <Clock3 size={14} />
            {reminder.time}
          </span>
          <span
            className="driving-tag"
            style={{
              '--driving-tag-accent': categoryMeta.accent,
              '--driving-tag-surface': categoryMeta.surface,
            }}
          >
            {reminder.category}
          </span>
          <span
            className="driving-tag driving-tag--priority"
            style={{
              '--driving-tag-accent': priorityMeta.accent,
              '--driving-tag-surface': priorityMeta.surface,
            }}
          >
            {reminder.priority}
          </span>
        </div>
      </div>

      <button
        aria-label="Marcar como cumplido"
        className={`checkbox-button checkbox-button--driving ${isCompleting ? 'is-checked' : ''}`}
        disabled={isBusy}
        onClick={() => onComplete(reminder)}
        type="button"
      >
        {isCompleting ? <Check size={22} /> : null}
      </button>
    </article>
  )
}

function DrivingModeView({
  actionFeedback,
  errorMessage,
  isRefreshing,
  lastUpdatedAt,
  onClose,
  onComplete,
  onRefresh,
  reminders,
  transitionStates,
  todayKey,
}) {
  useEffect(() => {
    onRefresh()

    const intervalId = window.setInterval(() => {
      onRefresh()
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [onRefresh])

  return (
    <div className="driving-mode" role="dialog" aria-modal="true" aria-labelledby="driving-mode-title">
      <header className="driving-header">
        <button className="icon-button icon-button--ghost" onClick={onClose} type="button" aria-label="Cerrar modo manejo">
          <ArrowLeft size={22} />
        </button>

        <div className="driving-header__copy">
          <p className="driving-header__eyebrow">Vista rapida</p>
          <h2 id="driving-mode-title">Modo Manejo</h2>
          <p className="driving-header__status">
            {isRefreshing
              ? 'Actualizando...'
              : `Ultima actualizacion: ${formatLastUpdated(lastUpdatedAt)}`}
          </p>
        </div>

        <button
          className="icon-button"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
          aria-label="Actualizar recordatorios"
        >
          <RefreshCw className={isRefreshing ? 'is-spinning' : ''} size={20} />
        </button>
      </header>

      {errorMessage ? (
        <p className="feedback-message feedback-message--error driving-mode__feedback">
          {errorMessage}
        </p>
      ) : null}
      {actionFeedback ? (
        <p className="feedback-message feedback-message--error driving-mode__feedback">
          {actionFeedback}
        </p>
      ) : null}

      {reminders.length > 0 ? (
        <section className="driving-list" aria-label="Recordatorios pendientes para manejar">
          {reminders.map((reminder) => (
            <DrivingReminderRow
              actionState={transitionStates[reminder.id]}
              key={reminder.id}
              onComplete={onComplete}
              reminder={reminder}
              todayKey={todayKey}
            />
          ))}
        </section>
      ) : (
        <section className="driving-empty">
          <h3>Sin pendientes para manejar</h3>
          <p>Cuando tengas recordatorios vencidos, de hoy o proximos, van a aparecer aqui.</p>
        </section>
      )}
    </div>
  )
}

export default DrivingModeView
