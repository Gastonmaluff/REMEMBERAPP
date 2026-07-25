import {
  BriefcaseBusiness,
  CalendarDays,
  CarFront,
  ListTodo,
  Plus,
  Sparkles,
  SunMedium,
  UserRound,
} from 'lucide-react'

const DESKTOP_NAV_ITEMS = [
  { value: 'today', label: 'Hoy', icon: SunMedium },
  { value: 'upcoming', label: 'Próximos', icon: CalendarDays },
  { value: 'work', label: 'Trabajo', icon: BriefcaseBusiness },
  { value: 'personal', label: 'Personal', icon: UserRound },
]

function DesktopSidebar({
  activeFilter,
  onFilterChange,
  onOpenDrivingMode,
  onOpenModal,
}) {
  return (
    <aside className="desktop-sidebar" aria-label="Navegación de escritorio">
      <div className="desktop-sidebar__brand">
        <span className="desktop-sidebar__brand-icon" aria-hidden="true">
          <ListTodo size={21} />
        </span>
        <span>
          <strong>Rememberapp</strong>
          <small>Tu agenda personal</small>
        </span>
      </div>

      <div className="desktop-sidebar__section">
        <p className="desktop-sidebar__label">Mi agenda</p>
        <nav className="desktop-sidebar__nav">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.value === activeFilter

            return (
              <button
                aria-label={item.label}
                className={`desktop-sidebar__nav-item ${isActive ? 'is-active' : ''}`}
                key={item.value}
                onClick={() => onFilterChange(item.value)}
                type="button"
                aria-current={isActive ? 'page' : undefined}
              >
                <span>
                  <Icon size={18} />
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="desktop-sidebar__actions">
        <button className="desktop-sidebar__new" onClick={onOpenModal} type="button">
          <Plus size={18} />
          Nuevo recordatorio
        </button>
        <button className="desktop-sidebar__driving" onClick={onOpenDrivingMode} type="button">
          <CarFront size={18} />
          Modo manejo
        </button>
      </div>

      <div className="desktop-sidebar__footer">
        <span aria-hidden="true">
          <Sparkles size={17} />
        </span>
        <div>
          <strong>Todo en un lugar</strong>
          <small>Sincronizado con Firebase</small>
        </div>
      </div>
    </aside>
  )
}

export default DesktopSidebar
