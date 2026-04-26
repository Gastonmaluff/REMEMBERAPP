import { useCallback, useEffect, useRef, useState } from 'react'
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
const DRIVER_ATTENTION_INTERVAL_MS = 22000
const DRIVER_ATTENTION_PAUSE_AFTER_INTERACTION_MS = 20000
const DRIVER_ATTENTION_STAGGER_MS = 120
const DRIVER_VISIBLE_ROW_THRESHOLD_PX = 24

const ATTENTION_ANIMATION_WEIGHTS = [
  ['tilt', 45],
  ['nudge', 20],
  ['glow', 20],
  ['lift', 15],
]

const PRIMARY_ATTENTION_ANIMATION_WEIGHTS = [
  ['tilt', 60],
  ['glow', 15],
  ['nudge', 15],
  ['lift', 10],
]

const ATTENTION_ANIMATION_DURATIONS = {
  tilt: 1450,
  nudge: 1040,
  glow: 1180,
  lift: 980,
}

function getWeightedRandomType(weights) {
  const totalWeight = weights.reduce(
    (sum, [, weight]) => sum + weight,
    0,
  )
  let cursor = Math.random() * totalWeight

  for (const [type, weight] of weights) {
    cursor -= weight

    if (cursor <= 0) {
      return type
    }
  }

  return 'nudge'
}

function getAttentionAnimationType({ preferTilt = false } = {}) {
  return getWeightedRandomType(
    preferTilt ? PRIMARY_ATTENTION_ANIMATION_WEIGHTS : ATTENTION_ANIMATION_WEIGHTS,
  )
}

function getReminderAttentionScore(reminder, todayKey) {
  const bucket = getDrivingBucket(reminder, todayKey)
  let score = 0

  if (bucket === 'overdue') {
    score += 5
  }

  if (isMariaReminder(reminder)) {
    score += 4
  }

  if (reminder.priority === 'Alta') {
    score += 3
  }

  if (bucket === 'today') {
    score += 2
  }

  if (bucket === 'upcoming') {
    score += 1
  }

  return score
}

function pickWeightedReminder(candidates) {
  if (!candidates.length) {
    return null
  }

  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.score, 0)
  let cursor = Math.random() * totalWeight

  for (const candidate of candidates) {
    cursor -= candidate.score

    if (cursor <= 0) {
      return candidate
    }
  }

  return candidates[0] ?? null
}

function getAttentionTargetCount(visibleCandidatesCount) {
  if (visibleCandidatesCount <= 1) {
    return visibleCandidatesCount
  }

  if (visibleCandidatesCount === 2) {
    return 2
  }

  return Math.random() < 0.52 ? 2 : 3
}

function pickAttentionReminders(candidates, todayKey) {
  if (!candidates.length) {
    return []
  }

  const scoredCandidates = candidates
    .map((reminder) => ({
      reminder,
      score: getReminderAttentionScore(reminder, todayKey),
      isPriorityAnchor:
        getDrivingBucket(reminder, todayKey) === 'overdue' || isMariaReminder(reminder),
    }))
    .sort((left, right) => right.score - left.score)

  const topScore = scoredCandidates[0]?.score ?? 0
  const desiredCount = Math.min(scoredCandidates.length, getAttentionTargetCount(candidates.length))
  let candidatePool = scoredCandidates
    .filter(({ score }) => score >= Math.max(topScore - 2, 1))
    .slice(0, 6)

  if (candidatePool.length < desiredCount) {
    candidatePool = scoredCandidates.slice(0, Math.min(6, Math.max(desiredCount, candidatePool.length)))
  }

  const targetCount = Math.min(candidatePool.length, desiredCount)

  if (!targetCount) {
    return []
  }

  const selected = []
  const available = [...candidatePool]
  const priorityAnchors = available.filter((candidate) => candidate.isPriorityAnchor)

  if (priorityAnchors.length) {
    const anchor = pickWeightedReminder(priorityAnchors)

    if (anchor) {
      selected.push(anchor.reminder)
      const anchorIndex = available.findIndex(
        (candidate) => candidate.reminder.id === anchor.reminder.id,
      )

      if (anchorIndex >= 0) {
        available.splice(anchorIndex, 1)
      }
    }
  }

  while (selected.length < targetCount && available.length) {
    const picked = pickWeightedReminder(available)

    if (!picked) {
      break
    }

    selected.push(picked.reminder)

    const pickedIndex = available.findIndex(
      (candidate) => candidate.reminder.id === picked.reminder.id,
    )

    if (pickedIndex >= 0) {
      available.splice(pickedIndex, 1)
    }
  }

  return selected
}

function DrivingReminderRow({
  actionState,
  attentionAnimationDelay,
  attentionAnimationType,
  highlightTone,
  onComplete,
  rowRef,
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
      className={`driving-row driving-row--${bucket} ${isMariaSource ? 'is-maria' : ''} ${isCompleting ? 'is-completing' : ''} ${isCelebrating ? 'is-celebrating' : ''} ${isExiting ? 'is-exiting' : ''} ${highlightTone ? 'is-new-arrival' : ''} ${attentionAnimationType ? `driver-card-attention--${attentionAnimationType}` : ''}`}
      ref={rowRef}
      style={
        attentionAnimationType
          ? { '--driver-attention-delay': `${attentionAnimationDelay}ms` }
          : undefined
      }
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
  const [attentionAnimations, setAttentionAnimations] = useState([])

  const attentionAnimationsRef = useRef([])
  const attentionTimeoutRef = useRef(null)
  const lastInteractionAtRef = useRef(0)
  const prefersReducedMotionRef = useRef(false)
  const remindersRef = useRef(reminders)
  const highlightedRemindersRef = useRef(highlightedReminders)
  const transitionStatesRef = useRef(transitionStates)
  const incomingAlertRef = useRef(incomingAlert)
  const todayKeyRef = useRef(todayKey)
  const scrollContainerRef = useRef(null)
  const rowRefs = useRef({})

  useEffect(() => {
    remindersRef.current = reminders
  }, [reminders])

  useEffect(() => {
    highlightedRemindersRef.current = highlightedReminders
  }, [highlightedReminders])

  useEffect(() => {
    transitionStatesRef.current = transitionStates
  }, [transitionStates])

  useEffect(() => {
    incomingAlertRef.current = incomingAlert
  }, [incomingAlert])

  useEffect(() => {
    todayKeyRef.current = todayKey
  }, [todayKey])

  useEffect(() => {
    lastInteractionAtRef.current = Date.now()
  }, [])

  const clearAttentionAnimations = useCallback(() => {
    if (attentionTimeoutRef.current) {
      window.clearTimeout(attentionTimeoutRef.current)
      attentionTimeoutRef.current = null
    }

    attentionAnimationsRef.current = []
    setAttentionAnimations([])
  }, [])

  const markUserInteraction = useCallback(() => {
    lastInteractionAtRef.current = Date.now()
    clearAttentionAnimations()
  }, [clearAttentionAnimations])

  const setRowRef = useCallback((reminderId, node) => {
    if (node) {
      rowRefs.current[reminderId] = node
      return
    }

    delete rowRefs.current[reminderId]
  }, [])

  const getVisibleCandidateReminders = useCallback(
    (currentReminders, currentTransitions, currentHighlights) => {
      const scrollNode = scrollContainerRef.current

      if (!scrollNode) {
        return []
      }

      const scrollRect = scrollNode.getBoundingClientRect()
      const visibleTop = scrollRect.top + DRIVER_VISIBLE_ROW_THRESHOLD_PX
      const visibleBottom = scrollRect.bottom - DRIVER_VISIBLE_ROW_THRESHOLD_PX

      return currentReminders.filter((reminder) => {
        if (currentTransitions[reminder.id] || currentHighlights[reminder.id]) {
          return false
        }

        const rowNode = rowRefs.current[reminder.id]

        if (!rowNode) {
          return false
        }

        const rowRect = rowNode.getBoundingClientRect()
        const visibleHeight =
          Math.min(rowRect.bottom, visibleBottom) - Math.max(rowRect.top, visibleTop)

        return visibleHeight >= DRIVER_VISIBLE_ROW_THRESHOLD_PX
      })
    },
    [],
  )

  const triggerAttentionAnimation = useCallback(() => {
    if (prefersReducedMotionRef.current) {
      return
    }

    if (Date.now() - lastInteractionAtRef.current < DRIVER_ATTENTION_PAUSE_AFTER_INTERACTION_MS) {
      return
    }

    if (attentionAnimationsRef.current.length > 0 || incomingAlertRef.current) {
      return
    }

    const currentTransitions = transitionStatesRef.current
    const currentHighlights = highlightedRemindersRef.current

    if (Object.keys(currentTransitions).length > 0 || Object.keys(currentHighlights).length > 0) {
      return
    }

    const currentReminders = remindersRef.current

    if (!currentReminders.length) {
      return
    }

    const visibleCandidates = getVisibleCandidateReminders(
      currentReminders,
      currentTransitions,
      currentHighlights,
    )
    const remindersToAnimate = pickAttentionReminders(
      visibleCandidates,
      todayKeyRef.current,
    )

    if (!remindersToAnimate.length) {
      return
    }

    const nextAttentionAnimations = remindersToAnimate.map((reminder, index) => ({
      reminderId: reminder.id,
      type: getAttentionAnimationType({ preferTilt: index === 0 }),
      delay: index * DRIVER_ATTENTION_STAGGER_MS,
    }))

    const maxAnimationTime = nextAttentionAnimations.reduce((maxDuration, animation) => {
      const totalDuration =
        (ATTENTION_ANIMATION_DURATIONS[animation.type] ?? 1200) + animation.delay
      return Math.max(maxDuration, totalDuration)
    }, 0)

    attentionAnimationsRef.current = nextAttentionAnimations
    setAttentionAnimations(nextAttentionAnimations)
    attentionTimeoutRef.current = window.setTimeout(() => {
      attentionTimeoutRef.current = null
      attentionAnimationsRef.current = []
      setAttentionAnimations([])
    }, maxAnimationTime + 120)
  }, [getVisibleCandidateReminders])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReducedMotionPreference = () => {
      prefersReducedMotionRef.current = mediaQuery.matches

      if (mediaQuery.matches) {
        clearAttentionAnimations()
      }
    }

    updateReducedMotionPreference()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateReducedMotionPreference)

      return () => {
        mediaQuery.removeEventListener('change', updateReducedMotionPreference)
      }
    }

    mediaQuery.addListener(updateReducedMotionPreference)

    return () => {
      mediaQuery.removeListener(updateReducedMotionPreference)
    }
  }, [clearAttentionAnimations])

  useEffect(() => {
    onRefresh()

    const intervalId = window.setInterval(() => {
      onRefresh()
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [onRefresh])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      triggerAttentionAnimation()
    }, DRIVER_ATTENTION_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      clearAttentionAnimations()
    }
  }, [clearAttentionAnimations, triggerAttentionAnimation])

  const handleClose = useCallback(() => {
    markUserInteraction()
    onClose()
  }, [markUserInteraction, onClose])

  const handleRefresh = useCallback(() => {
    markUserInteraction()
    onRefresh()
  }, [markUserInteraction, onRefresh])

  const handleEnableAudioAlerts = useCallback(() => {
    markUserInteraction()
    onEnableAudioAlerts()
  }, [markUserInteraction, onEnableAudioAlerts])

  const handleComplete = useCallback(
    (reminder) => {
      markUserInteraction()
      onComplete(reminder)
    },
    [markUserInteraction, onComplete],
  )

  return (
    <div
      className="driving-mode"
      role="dialog"
      aria-modal="true"
      aria-labelledby="driving-mode-title"
      onClickCapture={markUserInteraction}
      onTouchStartCapture={markUserInteraction}
    >
      <div className="driving-mode__scroll" onScroll={markUserInteraction} ref={scrollContainerRef}>
        <header className="driving-header">
          <button className="icon-button icon-button--ghost icon-button--compact" onClick={handleClose} type="button" aria-label="Cerrar modo manejo">
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
              onClick={audioAlertsEnabled ? undefined : handleEnableAudioAlerts}
              title={audioAlertsEnabled ? 'Sonido activo' : 'Activar sonido'}
              type="button"
            >
              {audioAlertsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              className="icon-button icon-button--compact"
              disabled={isRefreshing}
              onClick={handleRefresh}
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
                attentionAnimationDelay={
                  attentionAnimations.find(
                    (attentionAnimation) => attentionAnimation.reminderId === reminder.id,
                  )?.delay ?? 0
                }
                attentionAnimationType={
                  attentionAnimations.find(
                    (attentionAnimation) => attentionAnimation.reminderId === reminder.id,
                  )?.type ?? ''
                }
                highlightTone={highlightedReminders[reminder.id]}
                key={reminder.id}
                onComplete={handleComplete}
                rowRef={(node) => setRowRef(reminder.id, node)}
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
