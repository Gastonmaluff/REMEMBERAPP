import {
  collection as liveCollection,
  onSnapshot,
  query as liveQuery,
  where as liveWhere,
} from 'firebase/firestore'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore/lite'
import { db, liteDb } from '../firebase.js'
import { MARIA_REMINDER_COLOR } from '../portalConfig.js'

const REMINDERS_COLLECTION = 'reminders'
const SAVE_TIMEOUT_MS = 10000
const MARIA_PORTAL_SOURCE = 'maria_portal'

const remindersCollection = liveCollection(db, REMINDERS_COLLECTION)
const remindersWriteCollection = collection(liteDb, REMINDERS_COLLECTION)
const mariaPortalCollection = liveQuery(
  remindersCollection,
  liveWhere('source', '==', MARIA_PORTAL_SOURCE),
)
const mariaPortalWriteCollection = query(
  remindersWriteCollection,
  where('source', '==', MARIA_PORTAL_SOURCE),
)

function normalizeReminder(snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    title: data.title ?? '',
    notes: data.notes ?? '',
    date: data.date ?? '',
    time: data.time ?? '',
    datetime: data.datetime ?? '',
    category: data.category ?? 'Personal',
    priority: data.priority ?? 'Media',
    repeat: data.repeat ?? 'none',
    alertMinutes: Number(data.alertMinutes ?? 10),
    completed: Boolean(data.completed),
    icon: data.icon ?? 'file',
    color: data.color ?? '#2F80ED',
    createdBy: data.createdBy ?? '',
    assignedTo: data.assignedTo ?? '',
    source: data.source ?? '',
    createdAt: data.createdAt?.toMillis?.() ?? null,
    updatedAt: data.updatedAt?.toMillis?.() ?? null,
  }
}

function buildReminderPayload(reminder) {
  const timestamp = Date.now()
  const title = String(reminder.title ?? '').trim()
  const notes = String(reminder.notes ?? '').trim()
  const date = reminder.date ?? ''
  const time = reminder.time ?? ''
  const datetime =
    reminder.datetime ??
    (date && time ? `${date}T${time}` : '')

  return {
    title,
    notes,
    date,
    time,
    datetime,
    category: reminder.category ?? 'Personal',
    priority: reminder.priority ?? 'Media',
    repeat: reminder.repeat ?? 'none',
    alertMinutes: Number(reminder.alertMinutes ?? 10),
    completed: reminder.completed === true,
    icon: reminder.icon ?? 'file',
    color: reminder.color ?? '#2F80ED',
    createdBy: reminder.createdBy ?? '',
    assignedTo: reminder.assignedTo ?? '',
    source: reminder.source ?? '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function toFirestoreDocument(payload) {
  return {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

async function persistReminder(payload, logs = {}) {
  const { onStart, onSuccess, onError } = logs

  onStart?.(payload)

  try {
    const docRef = await withTimeout(
      addDoc(remindersWriteCollection, toFirestoreDocument(payload)),
    )

    onSuccess?.(docRef.id, payload)

    return {
      id: docRef.id,
      ...payload,
    }
  } catch (error) {
    onError?.(error, payload)
    throw toUserFacingError(error)
  }
}

function createTimeoutError() {
  const error = new Error('save-timeout')
  error.code = 'deadline-exceeded'
  return error
}

async function withTimeout(promise, timeoutMs = SAVE_TIMEOUT_MS) {
  let timeoutId

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(createTimeoutError()), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timeoutId)
  }
}

function toUserFacingError(error) {
  const message = String(error?.message ?? '')

  if (
    error?.code === 'permission-denied' &&
    message.includes('Cloud Firestore API has not been used')
  ) {
    return new Error(
      'Firestore no esta habilitado en rememberapp-f0a70. Activalo en Firebase o Google Cloud y vuelve a intentar.',
    )
  }

  if (error?.code === 'deadline-exceeded') {
    return new Error(
      'La conexion con Firestore tardo demasiado. Intenta nuevamente en unos segundos.',
    )
  }

  return new Error('No se pudo guardar el recordatorio.')
}

export function subscribeToReminders(onData, onError) {
  return onSnapshot(
    remindersCollection,
    (snapshot) => {
      onData(snapshot.docs.map(normalizeReminder))
    },
    onError,
  )
}

export function subscribeToMariaPortalReminders(onData, onError) {
  return onSnapshot(
    mariaPortalCollection,
    (snapshot) => {
      onData(snapshot.docs.map(normalizeReminder))
    },
    onError,
  )
}

export async function fetchReminders() {
  const snapshot = await withTimeout(getDocs(remindersWriteCollection))
  return snapshot.docs.map(normalizeReminder)
}

export async function fetchMariaPortalReminders() {
  const snapshot = await withTimeout(getDocs(mariaPortalWriteCollection))
  return snapshot.docs.map(normalizeReminder)
}

export async function createReminder(reminder) {
  const payload = buildReminderPayload(reminder)

  return persistReminder(payload, {
    onStart: (currentPayload) => {
      console.info('Saving reminder payload:', currentPayload)
    },
    onSuccess: (reminderId) => {
      console.info('Reminder saved with id:', reminderId)
    },
    onError: (error) => {
      console.error('Error saving reminder:', error)
    },
  })
}

export async function createMariaPortalReminder(reminder) {
  const payload = buildReminderPayload({
    ...reminder,
    category: reminder.category ?? 'Personal',
    priority: 'Alta',
    repeat: reminder.repeat ?? 'none',
    alertMinutes: reminder.alertMinutes ?? 10,
    color: reminder.color ?? MARIA_REMINDER_COLOR,
    createdBy: 'maria',
    assignedTo: 'gaston',
    source: MARIA_PORTAL_SOURCE,
  })

  return persistReminder(payload, {
    onStart: (currentPayload) => {
      console.info('Creating Maria reminder with high priority:', currentPayload)
    },
    onSuccess: (reminderId) => {
      console.info('Maria reminder created:', reminderId)
    },
    onError: (error) => {
      console.error('Error creating Maria reminder:', error)
    },
  })
}

export async function toggleReminderCompleted(reminderId, completed) {
  const reminderRef = doc(liteDb, REMINDERS_COLLECTION, reminderId)

  return withTimeout(
    updateDoc(reminderRef, {
      completed,
      updatedAt: serverTimestamp(),
    }),
  )
}
