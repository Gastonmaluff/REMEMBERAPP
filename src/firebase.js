import { getApps, initializeApp } from 'firebase/app'
import { getFirestore, setLogLevel } from 'firebase/firestore'
import { getFirestore as getLiteFirestore } from 'firebase/firestore/lite'

const firebaseConfig = {
  apiKey: 'AIzaSyB9qh6f7iyYRr4CZll35l-j_gm6uCuJe7Q',
  authDomain: 'rememberapp-f0a70.firebaseapp.com',
  projectId: 'rememberapp-f0a70',
  storageBucket: 'rememberapp-f0a70.firebasestorage.app',
  messagingSenderId: '758091428377',
  appId: '1:758091428377:web:0c11b5371161035399f088',
  measurementId: 'G-4DQJ0KLVW5',
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)

setLogLevel('silent')

export const db = getFirestore(app)
export const liteDb = getLiteFirestore(app)

export default app
