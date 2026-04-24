const COMPLETE_SOUND_URL = `${import.meta.env.BASE_URL}sounds/complete.mp3`

let completionSoundAvailable = null
let completionSoundAvailabilityPromise = null

async function resolveCompletionSoundAvailability() {
  if (completionSoundAvailable !== null) {
    return completionSoundAvailable
  }

  if (!completionSoundAvailabilityPromise) {
    completionSoundAvailabilityPromise = fetch(COMPLETE_SOUND_URL, {
      method: 'HEAD',
      cache: 'no-store',
    })
      .then((response) => {
        completionSoundAvailable = response.ok
        return completionSoundAvailable
      })
      .catch(() => {
        completionSoundAvailable = false
        return false
      })
  }

  return completionSoundAvailabilityPromise
}

export async function playCompletionSound() {
  const canPlaySound = await resolveCompletionSoundAvailability()

  if (!canPlaySound) {
    return
  }

  try {
    const audio = new Audio(COMPLETE_SOUND_URL)
    audio.volume = 0.35
    audio.preload = 'none'
    await audio.play()
  } catch {
    // Ignore blocked or unsupported playback so completion UX stays smooth.
  }
}
