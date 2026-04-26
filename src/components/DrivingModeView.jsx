import { useEffect } from 'react'
import {
  ArrowLeft,
  Check,
  RefreshCw,
  Volume2,
  VolumeX,
} from 'lucide-react'
import CompletionCelebration from './CompletionCelebration'
import { getCategoryMeta, getPriorityMeta } from '../reminderOptions'
import {
  formatLastUpdated,
  formatShortDate,
  getDrivingBucket,
  getDrivingBucketLabel,
} from '../reminderUtils'
import {
  isMariaReminder,
  logMariaReminderRender,
  MARIA_REMINDER_LABEL,
} from '../portalConfig'

const REFRESH_INTERVAL_MS = 7 * 60 * 1000

function DrivingReminderRow({
  actionState,
  highlightTone,
  onComplete,
  reminder,
  todayKey,
}) {
  const categoryMeta = getCategoryMeta(reminder.category)
  const priorityMeta = getPriorityMeta(reminder.priority)
  const bucket = getDrivingBucket(reminder, todayKey)
  const bucketLabel = getDrivingBucketLabel(bucket)
  const isCompleting = actionState?.action === 'completing'
  const isCelebrating = isCompleting && actionState?.phase === 'celebrating'
  const isExiting = isCompleting && actionState?.phase === 'exiting'
  const isBusy = Boolean(actionState)
  const isMariaSource = isMariaReminder(reminder)

  useEffect(() => {
    if (isMariaSource) {
      logMariaReminderRender(reminder.id)
    }
  }, [isMariaSource, reminder.id])

  return (
    <article
      className={`driving-row driving-row--${bucket} ${isMariaSource ? 'is-maria' : ''} ${isCompleting ? 'is-completing' : ''} ${isCelebrating ? 'is-celebrating' : ''} ${isExiting ? 'is-exiting' : ''} ${highlightTone ? 'is-new-arrival' : ''}`}
    >
      {isCompleting ? <CompletionCelebration compact isMaria={isMariaSource} /> : null}

      <div className="driving-row__content">
        <div className="driving-row__headline">
          {isMariaSource ? (
            <span className="origin-pill origin-pill--driving">{MARIA_REMINDER_LABEL}</span>
          ) : null}
          <span
            className="driving-tag driving-tag--priority"
            style={{
              '--driving-tag-accent': priorityMeta.accent,
              '--driving-tag-surface': priorityMeta.surface,
            }}
          >
            {reminder.priority}
          </span>
          <h3 className="driving-row__title" title={reminder.title}>
            {reminder.title}
          </h3>
        </div>

        <div className="driving-row__meta">
          <span className="driving-meta">{formatShortDate(reminder.date)}</span>
          <span className="driving-meta__separator" aria-hidden="true">
            &middot;
          </span>
          <span className="driving-meta">{reminder.time}</span>
          <span className="driving-meta__separator" aria-hidden="true">
            &middot;
          </span>
          <span
            className="driving-meta driving-meta--accent"
            style={{
              '--driving-meta-accent': categoryMeta.accent,
            }}
          >
            {reminder.category}
          </span>
          <span className="driving-meta__separator" aria-hidden="true">
            &middot;
          </span>
          <span className={`driving-status driving-status--${bucket}`}>
            {bucketLabel}
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
        {isCompleting ? <Check size={18} /> : null}
      </button>
    </article>
  )
}

function DrivingModeView({
  actionFeedback,
  audioAlertsEnabled,
  errorMessage,
  highlightedReminders,
  incomingAlert,
  isRefreshing,
  lastUpdatedAt,
  onEnableAudioAlerts,
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
      <div className="driving-mode__scroll">
        <header className="driving-header">
          <button className="icon-button icon-button--ghost icon-button--compact" onClick={onClose} type="button" aria-label="Cerrar modo manejo">
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

          <div className="driving-header__actions">
            <button
              aria-label={audioAlertsEnabled ? 'Sonido activo' : 'Activar sonido'}
              aria-pressed={audioAlertsEnabled}
              className={`icon-button icon-button--compact driving-header__sound-button ${audioAlertsEnabled ? 'is-active' : ''}`}
              onClick={audioAlertsEnabled ? undefined : onEnableAudioAlerts}
              title={audioAlertsEnabled ? 'Sonido activo' : 'Activar sonido'}
              type="button"
            >
              {audioAlertsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              className="icon-button icon-button--compact"
              disabled={isRefreshing}
              onClick={onRefresh}
              type="button"
              aria-label="Actualizar recordatorios"
              title="Actualizar recordatorios"
            >
              <RefreshCw className={isRefreshing ? 'is-spinning' : ''} size={20} />
            </button>
          </div>
        </header>

        {incomingAlert ? (
          <div
            aria-live="polite"
            className={`driving-alert-banner ${incomingAlert.tone === 'maria' ? 'is-maria' : ''}`}
            key={incomingAlert.id}
          >
            <p className="driving-alert-banner__eyebrow">{incomingAlert.title}</p>
            <strong>{incomingAlert.message}</strong>
          </div>
        ) : null}

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
                highlightTone={highlightedReminders[reminder.id]}
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
    </div>
  )
}

export default DrivingModeView
