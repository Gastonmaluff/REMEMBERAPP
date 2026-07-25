import { CarFront, CheckCircle2, Clock3, Plus, Sparkles } from 'lucide-react'
import { getCategoryMeta } from '../reminderOptions'

function DesktopOverviewPanel({
  completedToday,
  onOpenDrivingMode,
  onOpenModal,
  pendingReminders,
  pendingToday,
  progress,
  totalToday,
}) {
  const highlightedReminders = pendingReminders.slice(0, 3)

  return (
    <aside className="desktop-overview" aria-label="Resumen y acciones rápidas">
      <section className="desktop-overview__progress-card">
        <div className="desktop-overview__heading">
          <span>
            <Sparkles size={17} />
          </span>
          <div>
            <p>Resumen de hoy</p>
            <h2>Tu progreso</h2>
          </div>
        </div>

        <div className="desktop-overview__progress">
          <div
            className="desktop-overview__progress-ring"
            style={{ '--desktop-progress': `${progress}%` }}
          >
            <strong>{progress}%</strong>
          </div>
          <div className="desktop-overview__progress-copy">
            <strong>{completedToday} completados</strong>
            <span>
              {pendingToday} pendientes de {totalToday} para hoy
            </span>
          </div>
        </div>
      </section>

      <section className="desktop-overview__quick-actions">
        <p className="desktop-overview__label">Acciones rápidas</p>
        <button className="desktop-overview__primary-action" onClick={onOpenModal} type="button">
          <Plus size={18} />
          Crear recordatorio
        </button>
        <button className="desktop-overview__secondary-action" onClick={onOpenDrivingMode} type="button">
          <CarFront size={18} />
          Abrir modo manejo
        </button>
      </section>

      <section className="desktop-overview__upcoming">
        <div className="desktop-overview__upcoming-header">
          <div>
            <p className="desktop-overview__label">En foco</p>
            <h2>Próximos pendientes</h2>
          </div>
          <span>{pendingReminders.length}</span>
        </div>

        {highlightedReminders.length > 0 ? (
          <div className="desktop-overview__mini-list">
            {highlightedReminders.map((reminder) => {
              const categoryMeta = getCategoryMeta(reminder.category)

              return (
                <article className="desktop-overview__mini-item" key={reminder.id}>
                  <span
                    className="desktop-overview__mini-dot"
                    style={{ '--mini-accent': categoryMeta.accent }}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{reminder.title}</strong>
                    <small>
                      <Clock3 size={12} />
                      {reminder.time} · {reminder.category}
                    </small>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="desktop-overview__empty">
            <span aria-hidden="true">
              <CheckCircle2 size={24} />
            </span>
            <strong>Todo despejado</strong>
            <p>No tienes pendientes en esta vista.</p>
          </div>
        )}
      </section>
    </aside>
  )
}

export default DesktopOverviewPanel
