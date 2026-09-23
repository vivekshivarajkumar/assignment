// Tiny WebAudio synth for the few sounds the story needs.
// Browsers only allow audio after a user gesture, which every sound here follows.

let ac = null
let muted = false

function audio() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)()
  if (ac.state === 'suspended') ac.resume()
  return ac
}

export function setMuted(m) {
  muted = m
}
export function isMuted() {
  return muted
}

// A soft bowed tone, used for Arun's violin.
export function tone(freq, dur = 0.6, { type = 'triangle', gain = 0.12 } = {}) {
  if (muted) return
  const a = audio()
  const o = a.createOscillator()
  const g = a.createGain()
  const vib = a.createOscillator()
  const vibGain = a.createGain()
  o.type = type
  o.frequency.value = freq
  vib.frequency.value = 5.5
  vibGain.gain.value = freq * 0.006
  vib.connect(vibGain).connect(o.frequency)
  const now = a.currentTime
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(gain, now + 0.08)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  o.connect(g).connect(a.destination)
  o.start(now)
  vib.start(now)
  o.stop(now + dur + 0.05)
  vib.stop(now + dur + 0.05)
}

// Short click/pop for UI feedback (snaps, taps, stamps).
export function pop(freq = 520) {
  tone(freq, 0.12, { type: 'sine', gain: 0.08 })
}

// Notes of the melody Arun plays; chapters step through it.
export const MELODY = [392, 440, 494, 587, 523, 494, 440, 392, 330, 392, 440, 392]
