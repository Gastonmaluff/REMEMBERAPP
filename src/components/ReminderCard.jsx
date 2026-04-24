import { CalendarDays, Check, Clock3 } from 'lucide-react'
import { getCategoryMeta, getReminderVisual, renderReminderIcon } from '../reminderOptions'
import { formatShortDate } from '../reminderUtils'

function ReminderCard({ onToggle, reminder, todayKey }) {
  const categoryMeta = getCategoryMeta(reminder.category)
  const visual = getReminderVisual(reminder)
  const showDate = reminder.date && reminder.date !== todayKey

  return (
    <article className={`reminder-card ${reminder.completed ? 'is-completed' : ''}`}>
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
        <h3>{reminder.title}</h3>

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

      <button
        aria-label={reminder.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
        className={`checkbox-button ${reminder.completed ? 'is-checked' : ''}`}
        onClick={() => onToggle(reminder.id, !reminder.completed)}
        type="button"
      >
        {reminder.completed ? <Check size={18} /> : null}
      </button>
    </article>
  )
}

export default ReminderCard
