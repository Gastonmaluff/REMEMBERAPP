import { useEffect, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  CircleDot,
  Ellipsis,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import AppShell from './components/AppShell'
import FilterChips from './components/FilterChips'
import NewReminderModal from './components/NewReminderModal'
import ReminderCard from './components/ReminderCard'
import ReminderStats from './components/ReminderStats'
import { FILTER_OPTIONS } from './reminderOptions'
import {
  createReminder,
  subscribeToReminders,
  toggleReminderCompleted,
} from './services/remindersService'
import {
  getProgressValue,
  getSectionTitle,
  getTodayKey,
  matchesSearch,
  sortReminders,
} from './reminderUtils'

function App() {
  const [reminders, setReminders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('today')
  const [activeTab, setActiveTab] = useState('home')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToReminders(
      (items) => {
        setReminders(sortReminders(items))
        setErrorMessage('')
        setIsLoading(false)
      },
      (error) => {
        console.error(error)
        setErrorMessage(
          'No pudimos sincronizar con Firestore. Revisa permisos y la conexión de Firebase.',
        )
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const todayKey = getTodayKey()
  const todaysReminders = reminders.filter((reminder) => reminder.date === todayKey)
  const completedToday = todaysReminders.filter((reminder) => reminder.completed).length
  const totalToday = todaysReminders.length
  const pendingToday = totalToday - completedToday
  const progress = getProgressValue(completedToday, totalToday)

  const subtitle =
    pendingToday === 1
      ? 'Hoy tienes 1 pendiente'
      : `Hoy tienes ${pendingToday} pendientes`

  const filteredReminders = sortReminders(
    reminders
      .filter((reminder) => {
        if (activeFilter === 'today') {
          return reminder.date === todayKey
        }

        if (activeFilter === 'upcoming') {
          return reminder.date > todayKey
        }

        if (activeFilter === 'work') {
          return reminder.category === 'Trabajo'
        }

        if (activeFilter === 'personal') {
          return reminder.category === 'Personal'
        }

        return true
      })
      .filter((reminder) => matchesSearch(reminder, searchTerm)),
  )

  const stats = [
    {
      id: 'completed',
      label: 'Completados',
      value: completedToday,
      caption: 'Hoy',
      tone: 'success',
      icon: CheckCircle2,
    },
    {
      id: 'pending',
      label: 'Pendientes',
      value: pendingToday,
      caption: 'Hoy',
      tone: 'warning',
      icon: CircleDot,
    },
    {
      id: 'progress',
      label: 'Progreso de hoy',
      value: progress,
      caption: `${completedToday} de ${totalToday} completados`,
      tone: 'primary',
      type: 'progress',
    },
  ]

  async function handleCreateReminder(formValues) {
    setSaveError('')
    setIsSubmitting(true)

    try {
      await createReminder(formValues)
      setIsModalOpen(false)
    } catch (error) {
      console.error(error)
      setSaveError(
        'No pudimos crear el recordatorio. Verifica tu colección reminders y los permisos de Firestore.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleReminder(reminderId, completed) {
    try {
      await toggleReminderCompleted(reminderId, completed)
    } catch (error) {
      console.error(error)
      setErrorMessage('No pudimos actualizar el estado del recordatorio.')
    }
  }

  return (
    <AppShell
      activeTab={activeTab}
      isModalOpen={isModalOpen}
      onOpenModal={() => setIsModalOpen(true)}
      onTabChange={setActiveTab}
      modalContent={
        <NewReminderModal
          errorMessage={saveError}
          isSubmitting={isSubmitting}
          onClose={() => {
            setIsModalOpen(false)
            setSaveError('')
          }}
          onSubmit={handleCreateReminder}
        />
      }
    >
      <header className="dashboard-header">
        <div>
          <p className="dashboard-header__eyebrow">Rememberapp</p>
          <h1>Recordatorios</h1>
          <p className="dashboard-header__subtitle">
            {isLoading ? 'Sincronizando recordatorios...' : subtitle}
          </p>
        </div>

        <div className="dashboard-actions" aria-label="Acciones principales">
          <button
            className="icon-button icon-button--notification"
            type="button"
            aria-label="Ver notificaciones"
          >
            <Bell size={21} />
          </button>
          <button className="icon-button" type="button" aria-label="Más opciones">
            <Ellipsis size={21} />
          </button>
        </div>
      </header>

      <div className="search-field">
        <Search size={20} />
        <input
          aria-label="Buscar recordatorios"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar recordatorios"
          type="search"
          value={searchTerm}
        />
        <button className="search-field__action" type="button" aria-label="Filtrar resultados">
          <SlidersHorizontal size={19} />
        </button>
      </div>

      <FilterChips
        activeValue={activeFilter}
        onChange={setActiveFilter}
        options={FILTER_OPTIONS}
      />

      <ReminderStats stats={stats} />

      <section className="list-section" aria-labelledby="reminders-section-title">
        <div className="list-section__header">
          <h2 id="reminders-section-title">{getSectionTitle(activeFilter)}</h2>
          {errorMessage ? (
            <p className="feedback-message feedback-message--error">{errorMessage}</p>
          ) : null}
        </div>

        {isLoading ? (
          <div className="reminder-list">
            {[1, 2, 3].map((item) => (
              <article className="reminder-card reminder-card--skeleton" key={item}>
                <div className="reminder-card__icon skeleton-block" />
                <div className="reminder-card__body">
                  <div className="skeleton-line skeleton-line--title" />
                  <div className="skeleton-line skeleton-line--meta" />
                </div>
                <div className="skeleton-toggle" />
              </article>
            ))}
          </div>
        ) : filteredReminders.length > 0 ? (
          <div className="reminder-list">
            {filteredReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                onToggle={handleToggleReminder}
                reminder={reminder}
                todayKey={todayKey}
              />
            ))}
          </div>
        ) : (
          <article className="empty-state">
            <div className="empty-state__icon">
              <Plus size={22} />
            </div>
            <h3>No hay recordatorios para esta vista</h3>
            <p>
              Crea uno nuevo con fecha y hora desde el botón azul para empezar a llenar tu agenda.
            </p>
            <button className="empty-state__button" type="button" onClick={() => setIsModalOpen(true)}>
              Crear recordatorio
            </button>
          </article>
        )}
      </section>
    </AppShell>
  )
}

export default App
