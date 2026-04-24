import { collection as liveCollection, onSnapshot } from 'firebase/firestore'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore/lite'
import { db, liteDb } from '../firebase'

const REMINDERS_COLLECTION = 'reminders'
const SAVE_TIMEOUT_MS = 10000

const remindersCollection = liveCollection(db, REMINDERS_COLLECTION)
const remindersWriteCollection = collection(liteDb, REMINDERS_COLLECTION)

function normalizeReminder(snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    title: data.title ?? '',
    notes: data.notes ?? '',
    date: data.date ?? '',
    time: data.time ?? '',
    category: data.category ?? 'Personal',
    priority: data.priority ?? 'Media',
    repeat: data.repeat ?? 'none',
    alertMinutes: Number(data.alertMinutes ?? 10),
    completed: Boolean(data.completed),
    icon: data.icon ?? 'file',
    color: data.color ?? '#2F80ED',
    createdAt: data.createdAt?.toMillis?.() ?? null,
    updatedAt: data.updatedAt?.toMillis?.() ?? null,
  }
}

function buildReminderPayload(reminder) {
  const timestamp = Date.now()

  return {
    title: reminder.title.trim(),
    notes: reminder.notes.trim(),
    date: reminder.date,
    time: reminder.time,
    category: reminder.category,
    priority: reminder.priority,
    repeat: reminder.repeat,
    alertMinutes: Number(reminder.alertMinutes),
    completed: false,
    icon: reminder.icon ?? 'file',
    color: reminder.color ?? '#2F80ED',
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

export async function fetchReminders() {
  const snapshot = await withTimeout(getDocs(remindersWriteCollection))
  return snapshot.docs.map(normalizeReminder)
}

export async function createReminder(reminder) {
  const payload = buildReminderPayload(reminder)

  console.info('Saving reminder payload:', payload)

  try {
    const docRef = await withTimeout(
      addDoc(remindersWriteCollection, toFirestoreDocument(payload)),
    )

    console.info('Reminder saved with id:', docRef.id)

    return {
      id: docRef.id,
      ...payload,
    }
  } catch (error) {
    console.error('Error saving reminder:', error)
    throw toUserFacingError(error)
  }
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
