import { CalendarDays, House, ListTodo, UserRound } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home', label: 'Inicio', icon: House },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'lists', label: 'Listas', icon: ListTodo },
  { id: 'profile', label: 'Perfil', icon: UserRound },
]

function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación inferior">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
          <button
            className={`bottom-nav__item ${isActive ? 'is-active' : ''}`}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
