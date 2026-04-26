const COMPLETE_SOUND_URLS = [`${import.meta.env.BASE_URL}sounds/complete.mp3`]
const REMINDER_ALERT_SOUND_URLS = [
  `${import.meta.env.BASE_URL}sounds/reminder-alert.mp3`,
  `${import.meta.env.BASE_URL}sounds/reminder-alert.wav`,
  `${import.meta.env.BASE_URL}sounds/maria-alert.mp3`,
  `${import.meta.env.BASE_URL}sounds/maria-alert.wav`,
]

const soundAvailabilityCache = new Map()
const soundAvailabilityPromiseCache = new Map()

let reminderAlertAudio = null
let reminderAlertPreviewTimeoutId = null

async function resolveAvailableSoundUrl(urls) {
  const cacheKey = urls.join('|')

  if (soundAvailabilityCache.has(cacheKey)) {
    return soundAvailabilityCache.get(cacheKey)
  }

  if (!soundAvailabilityPromiseCache.has(cacheKey)) {
    soundAvailabilityPromiseCache.set(
      cacheKey,
      (async () => {
        for (const url of urls) {
          try {
            const response = await fetch(url, {
              method: 'HEAD',
              cache: 'no-store',
            })

            if (response.ok) {
              soundAvailabilityCache.set(cacheKey, url)
              return url
            }
          } catch {
            // Try the next fallback sound asset.
          }
        }

        soundAvailabilityCache.set(cacheKey, null)
        return null
      })(),
    )
  }

  return soundAvailabilityPromiseCache.get(cacheKey)
}

async function playSoundUrl(url, { volume = 0.35 } = {}) {
  const audio = new Audio(url)
  audio.volume = volume
  audio.preload = 'none'
  await audio.play()
}

async function getReminderAlertAudio() {
  if (reminderAlertAudio) {
    return reminderAlertAudio
  }

  const soundUrl = await resolveAvailableSoundUrl(REMINDER_ALERT_SOUND_URLS)

  if (!soundUrl) {
    return null
  }

  reminderAlertAudio = new Audio(soundUrl)
  reminderAlertAudio.preload = 'auto'

  return reminderAlertAudio
}

export async function playCompletionSound() {
  const soundUrl = await resolveAvailableSoundUrl(COMPLETE_SOUND_URLS)

  if (!soundUrl) {
    return
  }

  try {
    await playSoundUrl(soundUrl, { volume: 0.35 })
  } catch {
    // Ignore blocked or unsupported playback so completion UX stays smooth.
  }
}

export async function enableReminderAlertAudio() {
  const audio = await getReminderAlertAudio()

  if (!audio) {
    return false
  }

  try {
    if (reminderAlertPreviewTimeoutId) {
      window.clearTimeout(reminderAlertPreviewTimeoutId)
      reminderAlertPreviewTimeoutId = null
    }

    audio.pause()
    audio.currentTime = 0
    audio.volume = 0.25

    await audio.play()

    reminderAlertPreviewTimeoutId = window.setTimeout(() => {
      audio.pause()
      audio.currentTime = 0
      reminderAlertPreviewTimeoutId = null
    }, 220)

    return true
  } catch (error) {
    console.log('Could not play reminder alert sound:', error)
    return false
  }
}

export async function playReminderAlertSound() {
  const audio = await getReminderAlertAudio()

  if (!audio) {
    return false
  }

  try {
    if (reminderAlertPreviewTimeoutId) {
      window.clearTimeout(reminderAlertPreviewTimeoutId)
      reminderAlertPreviewTimeoutId = null
    }

    console.info('Playing reminder alert sound')
    audio.pause()
    audio.currentTime = 0
    audio.volume = 0.45
    await audio.play()
    return true
  } catch (error) {
    console.log('Could not play reminder alert sound:', error)
    return false
  }
}
