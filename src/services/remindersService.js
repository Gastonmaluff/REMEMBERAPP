import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const remindersCollection = collection(db, 'reminders')

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

export function subscribeToReminders(onData, onError) {
  return onSnapshot(
    remindersCollection,
    (snapshot) => {
      onData(snapshot.docs.map(normalizeReminder))
    },
    onError,
  )
}

export async function createReminder(reminder) {
  return addDoc(remindersCollection, {
    ...reminder,
    title: reminder.title.trim(),
    notes: reminder.notes.trim(),
    alertMinutes: Number(reminder.alertMinutes),
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function toggleReminderCompleted(reminderId, completed) {
  const reminderRef = doc(db, 'reminders', reminderId)

  return updateDoc(reminderRef, {
    completed,
    updatedAt: serverTimestamp(),
  })
}
