function pad(value) {
  return String(value).padStart(2, '0')
}

function capitalize(value) {
  if (!value) {
    return value
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function priorityWeight(priority) {
  const weights = {
    Alta: 0,
    Media: 1,
    Baja: 2,
  }

  return weights[priority] ?? 3
}

function getReminderDateTimeKey(reminder) {
  return `${reminder.date || '9999-12-31'}T${reminder.time || '23:59'}`
}

export function getTodayKey(referenceDate = new Date()) {
  return [
    referenceDate.getFullYear(),
    pad(referenceDate.getMonth() + 1),
    pad(referenceDate.getDate()),
  ].join('-')
}

export function getRoundedTime(referenceDate = new Date()) {
  const next = new Date(referenceDate)
  const roundedMinutes = Math.ceil(next.getMinutes() / 5) * 5

  if (roundedMinutes === 60) {
    next.setHours(next.getHours() + 1)
    next.setMinutes(0, 0, 0)
  } else {
    next.setMinutes(roundedMinutes, 0, 0)
  }

  return `${pad(next.getHours())}:${pad(next.getMinutes())}`
}

export function formatShortDate(dateString) {
  if (!dateString) {
    return 'Sin fecha'
  }

  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  })

  return formatter.format(new Date(`${dateString}T00:00:00`)).replace('.', '')
}

export function formatFriendlyDate(dateString) {
  if (!dateString) {
    return 'Selecciona una fecha'
  }

  if (dateString === getTodayKey()) {
    return `Hoy, ${formatShortDate(dateString)}`
  }

  return capitalize(formatShortDate(dateString))
}

export function formatFriendlyTime(timeString) {
  if (!timeString) {
    return 'Selecciona una hora'
  }

  return timeString
}

export function formatLastUpdated(dateValue) {
  if (!dateValue) {
    return 'Sin actualizar'
  }

  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateValue)
}

export function getSectionTitle(filterValue) {
  const titles = {
    today: 'Hoy',
    upcoming: 'Proximos',
    work: 'Trabajo',
    personal: 'Personal',
  }

  return titles[filterValue] ?? 'Recordatorios'
}

export function getProgressValue(completed, total) {
  if (!total) {
    return 0
  }

  return Math.round((completed / total) * 100)
}

export function matchesSearch(reminder, searchTerm) {
  if (!searchTerm.trim()) {
    return true
  }

  const normalizedTerm = searchTerm.trim().toLowerCase()
  const haystack = [
    reminder.title,
    reminder.notes,
    reminder.category,
    reminder.priority,
    reminder.date,
    reminder.time,
  ]

  return haystack.some((value) => value?.toLowerCase().includes(normalizedTerm))
}

export function getDrivingBucket(reminder, todayKey = getTodayKey()) {
  if (reminder.date < todayKey) {
    return 'overdue'
  }

  if (reminder.date === todayKey) {
    return 'today'
  }

  return 'upcoming'
}

export function getDrivingBucketLabel(bucket) {
  const labels = {
    overdue: 'Atrasado',
    today: 'Hoy',
    upcoming: 'Proximo',
  }

  return labels[bucket] ?? 'Pendiente'
}

export function sortReminders(reminders) {
  return [...reminders].sort((left, right) => {
    const completedOrder = Number(Boolean(left.completed)) - Number(Boolean(right.completed))

    if (completedOrder !== 0) {
      return completedOrder
    }

    const leftKey = getReminderDateTimeKey(left)
    const rightKey = getReminderDateTimeKey(right)

    if (leftKey !== rightKey) {
      return leftKey.localeCompare(rightKey)
    }

    return Number(left.createdAt ?? 0) - Number(right.createdAt ?? 0)
  })
}

export function sortDrivingReminders(reminders, todayKey = getTodayKey()) {
  const bucketWeight = {
    overdue: 0,
    today: 1,
    upcoming: 2,
  }

  return [...reminders]
    .filter((reminder) => !reminder.completed)
    .sort((left, right) => {
      const leftBucket = getDrivingBucket(left, todayKey)
      const rightBucket = getDrivingBucket(right, todayKey)

      if (bucketWeight[leftBucket] !== bucketWeight[rightBucket]) {
        return bucketWeight[leftBucket] - bucketWeight[rightBucket]
      }

      const leftKey = getReminderDateTimeKey(left)
      const rightKey = getReminderDateTimeKey(right)

      if (leftKey !== rightKey) {
        return leftKey.localeCompare(rightKey)
      }

      if (priorityWeight(left.priority) !== priorityWeight(right.priority)) {
        return priorityWeight(left.priority) - priorityWeight(right.priority)
      }

      return Number(left.createdAt ?? 0) - Number(right.createdAt ?? 0)
    })
}
