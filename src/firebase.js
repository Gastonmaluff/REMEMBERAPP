import { getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

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

export const db = getFirestore(app)

export default app
