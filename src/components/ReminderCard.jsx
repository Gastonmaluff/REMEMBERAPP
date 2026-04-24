import { useEffect } from 'react'
import { CalendarDays, Check, Clock3, RotateCcw } from 'lucide-react'
import { getCategoryMeta, getReminderVisual, renderReminderIcon } from '../reminderOptions'
import CompletionCelebration from './CompletionCelebration'
import {
  isMariaReminder,
  logMariaReminderRender,
  MARIA_REMINDER_LABEL,
} from '../portalConfig'
import { formatShortDate } from '../reminderUtils'

function ReminderCard({
  actionState,
  isCompletedView = false,
  onComplete,
  onRestore,
  reminder,
  todayKey,
}) {
  const categoryMeta = getCategoryMeta(reminder.category)
  const visual = getReminderVisual(reminder)
  const showDate = reminder.date && reminder.date !== todayKey
  const isCompleting = actionState?.action === 'completing'
  const isCelebrating = isCompleting && actionState?.phase === 'celebrating'
  const isExiting = isCompleting && actionState?.phase === 'exiting'
  const isRestoring = actionState?.action === 'restoring'
  const isBusy = Boolean(actionState)
  const showCheckedState = isCompletedView || isCompleting
  const showMariaSource = isMariaReminder(reminder)
  const cardClassName = [
    'reminder-card',
    showMariaSource ? 'is-maria' : '',
    isCompletedView ? 'is-completed-view' : '',
    isCompleting ? 'is-completing' : '',
    isCelebrating ? 'is-celebrating' : '',
    isExiting ? 'is-exiting' : '',
    isRestoring ? 'is-restoring' : '',
  ]
    .filter(Boolean)
    .join(' ')

  useEffect(() => {
    if (showMariaSource) {
      logMariaReminderRender(reminder.id)
    }
  }, [reminder.id, showMariaSource])

  return (
    <article className={cardClassName}>
      {isCompleting ? <CompletionCelebration isMaria={showMariaSource} /> : null}

      <div
        className="reminder-card__icon"
        style={{
          '--icon-accent': visual.accent,
          '--icon-surface': visual.surface,
        }}
      >
        {renderReminderIcon(visual.iconId, { size: 28 })}
      </div>

      <div className="reminder-card__body">
        {showMariaSource ? (
          <span className="origin-pill origin-pill--headline">{MARIA_REMINDER_LABEL}</span>
        ) : null}
        <h3 className="reminder-card__title">{reminder.title}</h3>

        <div className="reminder-card__meta">
          <span className="meta-inline">
            <Clock3 size={14} />
            {reminder.time}
          </span>

          {showDate ? (
            <span className="meta-inline">
              <CalendarDays size={14} />
              {formatShortDate(reminder.date)}
            </span>
          ) : null}

          <span
            className="category-pill"
            style={{
              '--pill-accent': categoryMeta.accent,
              '--pill-surface': categoryMeta.surface,
            }}
          >
            {reminder.category}
          </span>
        </div>
      </div>

      {isCompletedView ? (
        <div className="reminder-card__actions">
          <span className="checkbox-button is-checked is-readonly" aria-hidden="true">
            <Check size={18} />
          </span>

          <button
            aria-label="Devolver recordatorio a pendientes"
            className="restore-button"
            disabled={isBusy}
            onClick={() => onRestore(reminder)}
            type="button"
          >
            <RotateCcw size={15} />
            Devolver
          </button>
        </div>
      ) : (
        <button
          aria-label="Marcar como completado"
          className={`checkbox-button ${showCheckedState ? 'is-checked' : ''}`}
          disabled={isBusy}
          onClick={() => onComplete(reminder)}
          type="button"
        >
          {showCheckedState ? <Check size={18} /> : null}
        </button>
      )}
    </article>
  )
}

export default ReminderCard
