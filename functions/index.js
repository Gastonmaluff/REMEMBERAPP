const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { defineSecret } = require('firebase-functions/params')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')

admin.initializeApp()

const REMINDERS_COLLECTION = 'reminders'
const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_ID = defineSecret('TELEGRAM_CHAT_ID')

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function normalizeReminder(reminder = {}) {
  return {
    title: String(reminder.title ?? '').trim(),
    notes: String(reminder.notes ?? '').trim(),
    date: String(reminder.date ?? '').trim(),
    time: String(reminder.time ?? '').trim(),
    datetime: String(reminder.datetime ?? '').trim(),
    createdBy: String(reminder.createdBy ?? '').trim(),
    assignedTo: String(reminder.assignedTo ?? '').trim(),
    source: String(reminder.source ?? '').trim(),
    priority: String(reminder.priority ?? '').trim(),
    completed: reminder.completed === true,
  }
}

function isMariaReminder(reminder) {
  return reminder.createdBy === 'maria' || reminder.source === 'maria_portal'
}

function buildTelegramMessage(reminder) {
  const mariaReminder = isMariaReminder(reminder)
  const title = escapeHtml(reminder.title || 'Recordatorio sin titulo')
  const notes = escapeHtml(reminder.notes)
  const date = escapeHtml(reminder.date || 'Sin fecha')
  const time = escapeHtml(reminder.time || 'Sin hora')
  const priority = escapeHtml(
    reminder.priority || (mariaReminder ? 'Alta' : 'Sin prioridad'),
  )

  const lines = [
    mariaReminder ? '🔔 Nuevo recordatorio de Maria' : '🔔 Nuevo recordatorio',
    '',
    `<b>${title}</b>`,
    '',
    `📅 Fecha: ${date}`,
    `🕒 Hora: ${time}`,
    mariaReminder ? `🔥 Prioridad: ${priority}` : `⚡ Prioridad: ${priority}`,
  ]

  if (notes) {
    lines.push('', `📝 Nota: ${notes}`)
  }

  return lines.join('\n')
}

async function sendTelegramNotification(reminderId, reminder) {
  const botToken = TELEGRAM_BOT_TOKEN.value()
  const chatId = TELEGRAM_CHAT_ID.value()

  if (!botToken || !chatId) {
    logger.error('Telegram notification failed:', {
      reminderId,
      error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secret.',
    })
    return
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildTelegramMessage(reminder),
        parse_mode: 'HTML',
      }),
    },
  )

  const responseText = await response.text()
  let responsePayload = responseText

  try {
    responsePayload = JSON.parse(responseText)
  } catch {
    // Keep raw payload when Telegram does not return JSON.
  }

  if (!response.ok || responsePayload?.ok === false) {
    logger.error('Telegram notification failed:', {
      reminderId,
      status: response.status,
      response: responsePayload,
    })
    return
  }

  logger.info('Telegram notification sent:', reminderId)
}

exports.sendTelegramReminderNotification = onDocumentCreated(
  {
    document: `${REMINDERS_COLLECTION}/{reminderId}`,
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID],
  },
  async (event) => {
    const snapshot = event.data

    if (!snapshot) {
      logger.warn('Telegram notification skipped: empty Firestore event payload.')
      return
    }

    const reminderId = event.params.reminderId
    const reminder = normalizeReminder(snapshot.data())
    const mariaReminder = isMariaReminder(reminder)

    logger.info('New reminder created:', reminderId)
    logger.info('Reminder payload:', reminder)
    logger.info('Is Maria reminder:', mariaReminder)

    try {
      logger.info('Sending Telegram notification:', reminderId)
      await sendTelegramNotification(reminderId, reminder)
    } catch (error) {
      logger.error('Telegram notification failed:', {
        reminderId,
        error: error?.message ?? String(error),
      })
    }
  },
)
