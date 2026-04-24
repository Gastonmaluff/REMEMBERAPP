import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  CircleDot,
  Plus,
  Search,
  ShipWheel,
  SlidersHorizontal,
} from 'lucide-react'
import AppShell from './components/AppShell'
import DrivingModeView from './components/DrivingModeView'
import FilterChips from './components/FilterChips'
import NewReminderModal from './components/NewReminderModal'
import ReminderCard from './components/ReminderCard'
import ReminderStats from './components/ReminderStats'
import { FILTER_OPTIONS } from './reminderOptions'
import {
  createReminder,
  fetchReminders,
  subscribeToReminders,
  toggleReminderCompleted,
} from './services/remindersService'
import {
  getProgressValue,
  getSectionTitle,
  getTodayKey,
  matchesSearch,
  sortDrivingReminders,
  sortReminders,
} from './reminderUtils'

function App() {
  const [reminders, setReminders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSucceeded, setSaveSucceeded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('today')
  const [activeTab, setActiveTab] = useState('home')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrivingModeOpen, setIsDrivingModeOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDrivingRefreshRunning, setIsDrivingRefreshRunning] = useState(false)
  const [drivingError, setDrivingError] = useState('')
  const [lastDrivingRefreshAt, setLastDrivingRefreshAt] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToReminders(
      (items) => {
        setReminders(sortReminders(items))
        setErrorMessage('')
        setIsLoading(false)
      },
      () => {
        setErrorMessage(
          'No pudimos sincronizar con Firestore. Revisa permisos y la conexion de Firebase.',
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

  const drivingReminders = useMemo(
    () => sortDrivingReminders(reminders, todayKey),
    [reminders, todayKey],
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

  const refreshDrivingMode = useCallback(async () => {
    setDrivingError('')
    setIsDrivingRefreshRunning(true)

    try {
      const items = await fetchReminders()
      setReminders(sortReminders(items))
      setLastDrivingRefreshAt(new Date())
    } catch (error) {
      console.error('Driving mode refresh failed:', error)
      setDrivingError('No se pudo actualizar el modo manejo.')
    } finally {
      setIsDrivingRefreshRunning(false)
    }
  }, [])

  function openReminderModal() {
    setSaveError('')
    setSaveSucceeded(false)
    setIsModalOpen(true)
  }

  function closeReminderModal() {
    setIsModalOpen(false)
    setSaveError('')
    setSaveSucceeded(false)
    setIsSubmitting(false)
  }

  function openDrivingMode() {
    setDrivingError('')
    setIsDrivingModeOpen(true)
  }

  function closeDrivingMode() {
    setIsDrivingModeOpen(false)
    setDrivingError('')
    setIsDrivingRefreshRunning(false)
  }

  async function handleCreateReminder(formValues) {
    setSaveError('')
    setSaveSucceeded(false)
    setIsSubmitting(true)

    let createdReminder = null

    try {
      createdReminder = await createReminder(formValues)

      setReminders((current) =>
        sortReminders([
          ...current.filter((reminder) => reminder.id !== createdReminder.id),
          createdReminder,
        ]),
      )
      setErrorMessage('')
      setSearchTerm('')
      setActiveTab('home')
      setActiveFilter(createdReminder.date > todayKey ? 'upcoming' : 'today')
      setSaveSucceeded(true)
    } catch (error) {
      setSaveError(error.message || 'No se pudo guardar el recordatorio.')
    } finally {
      setIsSubmitting(false)
    }

    if (createdReminder) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 600)
      })
      closeReminderModal()
    }
  }

  async function handleToggleReminder(reminderId, completed) {
    try {
      await toggleReminderCompleted(reminderId, completed)
      setReminders((current) =>
        sortReminders(
          current.map((reminder) =>
            reminder.id === reminderId
              ? {
                  ...reminder,
                  completed,
                  updatedAt: Date.now(),
                }
              : reminder,
          ),
        ),
      )
    } catch (error) {
      console.error('Toggle reminder failed:', error)
      setErrorMessage('No pudimos actualizar el estado del recordatorio.')
    }
  }

  const overlayContent = isModalOpen ? (
    <NewReminderModal
      errorMessage={saveError}
      isSubmitting={isSubmitting}
      onClose={closeReminderModal}
      onSubmit={handleCreateReminder}
      saveSucceeded={saveSucceeded}
    />
  ) : isDrivingModeOpen ? (
    <DrivingModeView
      errorMessage={drivingError}
      isRefreshing={isDrivingRefreshRunning}
      lastUpdatedAt={lastDrivingRefreshAt}
      onClose={closeDrivingMode}
      onRefresh={refreshDrivingMode}
      reminders={drivingReminders}
      todayKey={todayKey}
    />
  ) : null

  return (
    <AppShell
      activeTab={activeTab}
      isOverlayOpen={Boolean(overlayContent)}
      onOpenModal={openReminderModal}
      onTabChange={setActiveTab}
      overlayContent={overlayContent}
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
          <button className="icon-button" type="button" aria-label="Abrir modo manejo" onClick={openDrivingMode}>
            <ShipWheel size={21} />
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
              Crea uno nuevo con fecha y hora desde el boton azul para empezar a llenar tu agenda.
            </p>
            <button
              className="empty-state__button"
              type="button"
              onClick={openReminderModal}
            >
              Crear recordatorio
            </button>
          </article>
        )}
      </section>
    </AppShell>
  )
}

export default App
