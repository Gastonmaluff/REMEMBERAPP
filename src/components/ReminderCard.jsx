import { CalendarDays, Check, Clock3, RotateCcw } from 'lucide-react'
import { getCategoryMeta, getReminderVisual, renderReminderIcon } from '../reminderOptions'
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
  const isRestoring = actionState?.action === 'restoring'
  const isBusy = Boolean(actionState)
  const showCheckedState = isCompletedView || isCompleting
  const cardClassName = [
    'reminder-card',
    isCompletedView ? 'is-completed-view' : '',
    isCompleting ? 'is-completing' : '',
    isRestoring ? 'is-restoring' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={cardClassName}>
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
