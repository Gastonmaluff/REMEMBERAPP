import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  ChevronDown,
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
import {
  enableReminderAlertAudio,
  playCompletionSound,
  playReminderAlertSound,
} from './completionEffects'
import { isMariaReminder } from './portalConfig'
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

const REMINDER_COMPLETE_CELEBRATION_MS = 900
const REMINDER_COMPLETE_EXIT_MS = 250
const REMINDER_RESTORE_TRANSITION_MS = 420
const DRIVING_ALERT_BANNER_MS = 4000
const DRIVING_ALERT_HIGHLIGHT_MS = 5200
const DRIVING_AUDIO_SESSION_KEY = 'rememberapp:driving-audio-enabled'

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration)
  })
}

function getReminderUiCompleted(reminder, transitionState) {
  if (transitionState?.action === 'completing') {
    return false
  }

  if (transitionState?.action === 'restoring') {
    return true
  }

  return reminder.completed === true
}

function MainAppView() {
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
  const [drivingActionFeedback, setDrivingActionFeedback] = useState('')
  const [normalActionFeedback, setNormalActionFeedback] = useState('')
  const [lastDrivingRefreshAt, setLastDrivingRefreshAt] = useState(null)
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false)
  const [reminderTransitions, setReminderTransitions] = useState({})
  const [isDrivingAudioEnabled, setIsDrivingAudioEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.sessionStorage.getItem(DRIVING_AUDIO_SESSION_KEY) === 'true'
  })
  const [drivingIncomingAlert, setDrivingIncomingAlert] = useState(null)
  const [drivingHighlightedReminders, setDrivingHighlightedReminders] = useState({})

  const hasInitializedDrivingAlertsRef = useRef(false)
  const seenDrivingReminderIdsRef = useRef(new Set())
  const drivingAlertTimeoutRef = useRef(null)
  const drivingHighlightTimeoutsRef = useRef({})

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

  const getCompletionState = useCallback(
    (reminder) => getReminderUiCompleted(reminder, reminderTransitions[reminder.id]),
    [reminderTransitions],
  )

  const todaysReminders = useMemo(
    () => reminders.filter((reminder) => reminder.date === todayKey),
    [reminders, todayKey],
  )
  const completedToday = todaysReminders.filter(getCompletionState).length
  const totalToday = todaysReminders.length
  const pendingToday = totalToday - completedToday
  const progress = getProgressValue(completedToday, totalToday)

  const subtitle =
    pendingToday === 1
      ? 'Hoy tienes 1 pendiente'
      : `Hoy tienes ${pendingToday} pendientes`

  const visibleReminders = useMemo(
    () =>
      sortReminders(
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
        getCompletionState,
      ),
    [activeFilter, getCompletionState, reminders, searchTerm, todayKey],
  )

  const pendingReminders = useMemo(
    () => visibleReminders.filter((reminder) => !getCompletionState(reminder)),
    [getCompletionState, visibleReminders],
  )

  const completedReminders = useMemo(
    () => visibleReminders.filter((reminder) => getCompletionState(reminder)),
    [getCompletionState, visibleReminders],
  )

  const drivingReminders = useMemo(
    () => sortDrivingReminders(reminders, todayKey, getCompletionState),
    [getCompletionState, reminders, todayKey],
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

  const clearReminderTransition = useCallback((reminderId) => {
    setReminderTransitions((current) => {
      if (!current[reminderId]) {
        return current
      }

      const next = { ...current }
      delete next[reminderId]
      return next
    })
  }, [])

  const clearDrivingIncomingAlert = useCallback(() => {
    if (drivingAlertTimeoutRef.current) {
      window.clearTimeout(drivingAlertTimeoutRef.current)
      drivingAlertTimeoutRef.current = null
    }

    setDrivingIncomingAlert(null)
  }, [])

  const clearDrivingHighlight = useCallback((reminderId) => {
    const timeoutId = drivingHighlightTimeoutsRef.current[reminderId]

    if (timeoutId) {
      window.clearTimeout(timeoutId)
      delete drivingHighlightTimeoutsRef.current[reminderId]
    }

    setDrivingHighlightedReminders((current) => {
      if (!current[reminderId]) {
        return current
      }

      const next = { ...current }
      delete next[reminderId]
      return next
    })
  }, [])

  const showDrivingIncomingAlert = useCallback(
    (newReminders) => {
      if (!newReminders.length) {
        return
      }

      const mariaOnly = newReminders.every((reminder) => isMariaReminder(reminder))
      const latestReminder = newReminders[newReminders.length - 1]
      const count = newReminders.length

      let title = 'Nuevo recordatorio'
      let message = latestReminder.title

      if (count === 1 && isMariaReminder(latestReminder)) {
        title = 'Nuevo recordatorio de Maria'
      } else if (count > 1 && mariaOnly) {
        title = `Maria agrego ${count} recordatorios`
        message = 'Revisa los pendientes que acaban de entrar.'
      } else if (count > 1) {
        title = `Se agregaron ${count} recordatorios nuevos`
        message = 'Revisa tus pendientes recientes.'
      }

      clearDrivingIncomingAlert()
      setDrivingIncomingAlert({
        id: `${Date.now()}-${latestReminder.id}`,
        title,
        message,
        tone: mariaOnly ? 'maria' : 'default',
      })

      drivingAlertTimeoutRef.current = window.setTimeout(() => {
        setDrivingIncomingAlert(null)
        drivingAlertTimeoutRef.current = null
      }, DRIVING_ALERT_BANNER_MS)
    },
    [clearDrivingIncomingAlert],
  )

  const highlightDrivingReminders = useCallback(
    (newReminders) => {
      setDrivingHighlightedReminders((current) => {
        const next = { ...current }

        newReminders.forEach((reminder) => {
          next[reminder.id] = isMariaReminder(reminder) ? 'maria' : 'default'
        })

        return next
      })

      newReminders.forEach((reminder) => {
        const existingTimeoutId = drivingHighlightTimeoutsRef.current[reminder.id]

        if (existingTimeoutId) {
          window.clearTimeout(existingTimeoutId)
        }

        drivingHighlightTimeoutsRef.current[reminder.id] = window.setTimeout(() => {
          clearDrivingHighlight(reminder.id)
        }, DRIVING_ALERT_HIGHLIGHT_MS)
      })
    },
    [clearDrivingHighlight],
  )

  const refreshDrivingMode = useCallback(async () => {
    setDrivingError('')
    setDrivingActionFeedback('')
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
    setNormalActionFeedback('')
    setIsModalOpen(true)
  }

  function closeReminderModal() {
    setIsModalOpen(false)
    setSaveError('')
    setSaveSucceeded(false)
    setIsSubmitting(false)
  }

  function openDrivingMode() {
    hasInitializedDrivingAlertsRef.current = false
    seenDrivingReminderIdsRef.current = new Set()
    setDrivingError('')
    setDrivingActionFeedback('')
    clearDrivingIncomingAlert()
    setDrivingHighlightedReminders({})
    setIsDrivingModeOpen(true)
  }

  function closeDrivingMode() {
    hasInitializedDrivingAlertsRef.current = false
    seenDrivingReminderIdsRef.current = new Set()
    setIsDrivingModeOpen(false)
    setDrivingError('')
    setDrivingActionFeedback('')
    setIsDrivingRefreshRunning(false)
    clearDrivingIncomingAlert()

    Object.values(drivingHighlightTimeoutsRef.current).forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })

    drivingHighlightTimeoutsRef.current = {}
    setDrivingHighlightedReminders({})
  }

  const handleEnableDrivingAudioAlerts = useCallback(async () => {
    const enabled = await enableReminderAlertAudio()

    if (!enabled) {
      setDrivingActionFeedback('No se pudo activar el sonido en este navegador.')
      return
    }

    console.info('Audio alerts enabled')
    setDrivingActionFeedback('')
    setIsDrivingAudioEnabled(true)
    window.sessionStorage.setItem(DRIVING_AUDIO_SESSION_KEY, 'true')
  }, [])

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
      setNormalActionFeedback('')
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
      await wait(600)
      closeReminderModal()
    }
  }

  const handleReminderCompletionChange = useCallback(
    async (reminder, nextCompleted, source = 'normal') => {
      if (!reminder?.id || reminderTransitions[reminder.id]) {
        return
      }

      const action = nextCompleted ? 'completing' : 'restoring'
      const setScopedFeedback =
        source === 'driving' ? setDrivingActionFeedback : setNormalActionFeedback

      setScopedFeedback('')

      if (nextCompleted) {
        console.info('Completing reminder:', reminder.id)
        setIsCompletedSectionOpen(false)
        void playCompletionSound()
      } else {
        console.info('Restoring reminder:', reminder.id)
      }

      setReminderTransitions((current) => ({
        ...current,
        [reminder.id]: nextCompleted
          ? { action, phase: 'celebrating' }
          : { action },
      }))

      try {
        if (nextCompleted) {
          await Promise.all([
            toggleReminderCompleted(reminder.id, nextCompleted),
            wait(REMINDER_COMPLETE_CELEBRATION_MS),
          ])

          setReminderTransitions((current) => {
            if (!current[reminder.id] || current[reminder.id].action !== 'completing') {
              return current
            }

            return {
              ...current,
              [reminder.id]: { action: 'completing', phase: 'exiting' },
            }
          })

          await wait(REMINDER_COMPLETE_EXIT_MS)
        } else {
          await toggleReminderCompleted(reminder.id, nextCompleted)
          await wait(REMINDER_RESTORE_TRANSITION_MS)
        }

        setReminders((current) =>
          sortReminders(
            current.map((item) =>
              item.id === reminder.id
                ? {
                    ...item,
                    completed: nextCompleted,
                    updatedAt: Date.now(),
                  }
                : item,
            ),
          ),
        )

        if (nextCompleted) {
          console.info('Reminder completed:', reminder.id)
        } else {
          console.info('Reminder restored:', reminder.id)
        }

        if (source === 'driving') {
          setLastDrivingRefreshAt(new Date())
        }
      } catch (error) {
        if (nextCompleted) {
          console.error('Error completing reminder:', error)
          setScopedFeedback('No se pudo marcar como cumplido.')
        } else {
          console.error('Error restoring reminder:', error)
          setScopedFeedback('No se pudo devolver el recordatorio.')
        }
      } finally {
        clearReminderTransition(reminder.id)
      }
    },
    [clearReminderTransition, reminderTransitions],
  )

  const handleCompleteReminder = useCallback(
    (reminder) => handleReminderCompletionChange(reminder, true, 'normal'),
    [handleReminderCompletionChange],
  )

  const handleRestoreReminder = useCallback(
    (reminder) => handleReminderCompletionChange(reminder, false, 'normal'),
    [handleReminderCompletionChange],
  )

  const handleCompleteReminderFromDriving = useCallback(
    (reminder) => handleReminderCompletionChange(reminder, true, 'driving'),
    [handleReminderCompletionChange],
  )

  useEffect(() => {
    return () => {
      clearDrivingIncomingAlert()

      Object.values(drivingHighlightTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
    }
  }, [clearDrivingIncomingAlert])

  useEffect(() => {
    if (!isDrivingModeOpen) {
      return
    }

    const currentPendingReminders = drivingReminders.filter(
      (reminder) => reminder.completed !== true,
    )

    if (!hasInitializedDrivingAlertsRef.current) {
      seenDrivingReminderIdsRef.current = new Set(
        currentPendingReminders.map((reminder) => reminder.id),
      )
      hasInitializedDrivingAlertsRef.current = true
      return
    }

    const newReminders = currentPendingReminders.filter(
      (reminder) => !seenDrivingReminderIdsRef.current.has(reminder.id),
    )

    if (!newReminders.length) {
      return
    }

    newReminders.forEach((reminder) => {
      if (isMariaReminder(reminder)) {
        console.info('New Maria reminder detected:', reminder.id)
      } else {
        console.info('New reminder detected:', reminder.id)
      }
    })

    newReminders.forEach((reminder) => {
      seenDrivingReminderIdsRef.current.add(reminder.id)
    })

    highlightDrivingReminders(newReminders)
    showDrivingIncomingAlert(newReminders)

    if (isDrivingAudioEnabled) {
      void playReminderAlertSound()
    }
  }, [
    drivingReminders,
    highlightDrivingReminders,
    isDrivingAudioEnabled,
    isDrivingModeOpen,
    showDrivingIncomingAlert,
  ])

  const hasCompletedReminders = completedReminders.length > 0
  const hasPendingReminders = pendingReminders.length > 0
  const isCompletedSectionVisible = hasCompletedReminders && isCompletedSectionOpen
  const emptyStateTitle = hasCompletedReminders
    ? 'No hay pendientes en esta vista'
    : 'No hay recordatorios para esta vista'
  const emptyStateBody = hasCompletedReminders
    ? 'Los recordatorios cumplidos quedaron agrupados mas abajo para mantener limpia tu lista principal.'
    : 'Crea uno nuevo con fecha y hora desde el boton azul para empezar a llenar tu agenda.'

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
      actionFeedback={drivingActionFeedback}
      audioAlertsEnabled={isDrivingAudioEnabled}
      highlightedReminders={drivingHighlightedReminders}
      incomingAlert={drivingIncomingAlert}
      errorMessage={drivingError}
      isRefreshing={isDrivingRefreshRunning}
      lastUpdatedAt={lastDrivingRefreshAt}
      onEnableAudioAlerts={handleEnableDrivingAudioAlerts}
      onClose={closeDrivingMode}
      onComplete={handleCompleteReminderFromDriving}
      onRefresh={refreshDrivingMode}
      reminders={drivingReminders}
      todayKey={todayKey}
      transitionStates={reminderTransitions}
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
          <button
            className="icon-button"
            type="button"
            aria-label="Abrir modo manejo"
            onClick={openDrivingMode}
          >
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

          <div className="feedback-stack">
            {errorMessage ? (
              <p className="feedback-message feedback-message--error">{errorMessage}</p>
            ) : null}
            {normalActionFeedback ? (
              <p className="feedback-message feedback-message--error">
                {normalActionFeedback}
              </p>
            ) : null}
          </div>
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
        ) : null}

        {!isLoading && hasPendingReminders ? (
          <div className="reminder-list">
            {pendingReminders.map((reminder) => (
              <ReminderCard
                actionState={reminderTransitions[reminder.id]}
                key={reminder.id}
                onComplete={handleCompleteReminder}
                reminder={reminder}
                todayKey={todayKey}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !hasPendingReminders ? (
          <article className="empty-state">
            <div className="empty-state__icon">
              <Plus size={22} />
            </div>
            <h3>{emptyStateTitle}</h3>
            <p>{emptyStateBody}</p>
            <button
              className="empty-state__button"
              type="button"
              onClick={openReminderModal}
            >
              Crear recordatorio
            </button>
          </article>
        ) : null}

        {!isLoading && hasCompletedReminders ? (
          <section className="completed-section" aria-labelledby="completed-section-title">
            <button
              aria-controls="completed-section-content"
              aria-expanded={isCompletedSectionVisible}
              className="completed-section__toggle"
              id="completed-section-title"
              onClick={() => setIsCompletedSectionOpen((current) => !current)}
              type="button"
            >
              <span className="completed-section__title">
                Cumplidos <span className="completed-section__count">&middot; {completedReminders.length}</span>
              </span>
              <ChevronDown
                className={isCompletedSectionVisible ? 'is-open' : ''}
                size={18}
              />
            </button>

            {isCompletedSectionVisible ? (
              <div className="completed-section__list" id="completed-section-content">
                {completedReminders.map((reminder) => (
                  <ReminderCard
                    actionState={reminderTransitions[reminder.id]}
                    isCompletedView
                    key={reminder.id}
                    onRestore={handleRestoreReminder}
                    reminder={reminder}
                    todayKey={todayKey}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </AppShell>
  )
}

export default MainAppView
