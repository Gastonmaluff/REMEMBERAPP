export const MARIA_PORTAL_TOKEN = 'maria-gaston-2026'
export const MARIA_REMINDER_LABEL = 'MARIA'
export const MARIA_REMINDER_COLOR = '#E35D9B'

export function getPortalRequest() {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  const token = params.get('token')

  return {
    token,
    view,
    isMariaPortal: view === 'maria',
    isMariaPortalValid: view === 'maria' && token === MARIA_PORTAL_TOKEN,
  }
}

export function isMariaReminder(reminder) {
  return (
    reminder?.source === 'maria_portal' ||
    (reminder?.createdBy === 'maria' && reminder?.assignedTo === 'gaston')
  )
}

export function isMariaPortalReminder(reminder) {
  return isMariaReminder(reminder)
}

export function logMariaReminderRender(reminderId) {
  if (reminderId) {
    console.info('Rendering Maria reminder:', reminderId)
  }
}
