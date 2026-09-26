// Tiny WebAudio synth for the few sounds the story needs.
// Browsers only allow audio after a user gesture, which every sound here follows.

let ac = null
let muted = false

function audio() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)()
    // until the player first touches the page the browser keeps audio
    // suspended; wake it on that first touch
    const wake = () => ac.state === 'suspended' && ac.resume()
    for (const e of ['pointerdown', 'keydown']) window.addEventListener(e, wake, { once: true })
  }
  if (ac.state === 'suspended') ac.resume()
  return ac
}

export function setMuted(m) {
  muted = m
  if (m) stopMusic()
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

// ---------- a page turning ----------

// Paper turning over: a rustle that rises as the sheet lifts, crinkling
// unevenly as it goes, a low breath of air under it, and a flap as it lands.
// All of it is filtered noise.
let noiseBuffer = null
function noise(a) {
  if (!noiseBuffer) {
    noiseBuffer = a.createBuffer(1, a.sampleRate * 0.6, a.sampleRate)
    const d = noiseBuffer.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const n = a.createBufferSource()
  n.buffer = noiseBuffer
  return n
}

function noiseBand(a, at, len, type, from, to, q, shape) {
  const n = noise(a)
  const f = a.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(from, at)
  f.frequency.exponentialRampToValueAtTime(to, at + len)
  const g = a.createGain()
  shape(g.gain, at)
  n.connect(f).connect(g).connect(a.destination)
  n.start(at)
  n.stop(at + len + 0.05)
}

export function pageTurn() {
  if (muted) return
  const a = audio()
  const at = a.currentTime + 0.01
  // the rustle: its loudness jumps about a little every 12 ms, which is what
  // makes noise sound like paper rather than wind
  noiseBand(a, at, 0.26, 'bandpass', 700, 3200, 0.9, (g, t0) => {
    g.setValueAtTime(0, t0)
    for (let i = 1; i <= 20; i++) {
      const k = i / 20
      const swell = Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - k * 0.35)
      g.setValueAtTime(0.16 * swell * (0.55 + Math.random() * 0.45), t0 + k * 0.24)
    }
    g.linearRampToValueAtTime(0, t0 + 0.26)
  })
  // air moving under the sheet
  noiseBand(a, at, 0.3, 'lowpass', 500, 300, 0.7, (g, t0) => {
    g.setValueAtTime(0, t0)
    g.linearRampToValueAtTime(0.1, t0 + 0.09)
    g.exponentialRampToValueAtTime(0.0001, t0 + 0.3)
  })
  // the flap as it lands
  noiseBand(a, at + 0.21, 0.05, 'highpass', 2600, 2600, 0.7, (g, t0) => {
    g.setValueAtTime(0, t0)
    g.linearRampToValueAtTime(0.09, t0 + 0.004)
    g.exponentialRampToValueAtTime(0.0001, t0 + 0.05)
  })
}

// Notes of the melody Arun plays; chapters step through it.
export const MELODY = [392, 440, 494, 587, 523, 494, 440, 392, 330, 392, 440, 392]

// ---------- the alarm clock ----------

// A digital alarm clock: bursts of four short beeps, a second apart, getting
// louder over the first few like a real one. Each beep is two square waves a
// few hertz apart through a lowpass, for the buzz of a piezo speaker without
// its sharpest edge. Call ring() every frame while it rings: it books the next
// burst just ahead on the audio clock, so the rhythm is exact and it falls
// silent within a burst if the page stops calling. stop() cuts it at once.
export function alarmClock() {
  let out = null
  let next = 0
  let bursts = 0
  return {
    ring() {
      if (muted) return
      const a = audio()
      if (!out) {
        out = a.createGain()
        const soft = a.createBiquadFilter()
        soft.type = 'lowpass'
        soft.frequency.value = 4200
        out.connect(soft).connect(a.destination)
        next = a.currentTime + 0.05
      }
      while (next < a.currentTime + 0.3) {
        const level = 0.035 * Math.min(1, 0.55 + bursts * 0.15)
        for (let i = 0; i < 4; i++) beep(a, out, next + i * 0.13, level)
        next += 1.1
        bursts++
      }
    },
    stop() {
      if (!out) return
      const a = audio()
      out.gain.cancelScheduledValues(a.currentTime)
      out.gain.setTargetAtTime(0, a.currentTime, 0.01)
      const done = out
      setTimeout(() => done.disconnect(), 100)
      out = null
    },
  }
}

function beep(a, out, at, level) {
  const g = a.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(level, at + 0.004)
  g.gain.setValueAtTime(level, at + 0.07)
  g.gain.linearRampToValueAtTime(0, at + 0.078)
  g.connect(out)
  for (const f of [2048, 2054]) {
    const o = a.createOscillator()
    o.type = 'square'
    o.frequency.value = f
    o.connect(g)
    o.start(at)
    o.stop(at + 0.09)
  }
}

// ---------- music for the home screen ----------

// Arun's melody as a music box over a soft pad, looping: four bars of G, C,
// E minor and D at 76 bpm. Every other time round the melody goes up an octave.
const BEAT = 60 / 76
const THEME = [
  // [beat, note (Hz), beats long]
  [0, 392, 1], [1, 440, 1], [2, 494, 1], [3, 587, 1],
  [4, 523, 1], [5, 494, 1], [6, 440, 1], [7, 392, 1],
  [8, 330, 1], [9, 392, 1], [10, 440, 1], [11, 392, 1],
  [12, 370, 2], [14, 294, 2],
]
const CHORDS = [
  [98, 147, 247], // G
  [131, 196, 330], // C
  [82, 165, 247], // E minor
  [147, 220, 370], // D
]
const LOOP = 16 // beats

let music = null

export function startMusic() {
  if (muted || music) return
  const a = audio()
  const out = a.createGain()
  out.gain.setValueAtTime(0, a.currentTime)
  out.gain.linearRampToValueAtTime(1, a.currentTime + 2)
  out.connect(a.destination)
  let loopAt = a.currentTime + 0.1
  let round = 0
  let booked = 0 // how many beats of the current round are booked
  const book = () => {
    // book everything up to half a second ahead
    while (loopAt + booked * BEAT < a.currentTime + 0.5) {
      const beat = booked
      const at = loopAt + beat * BEAT
      if (beat % 4 === 0) pad(a, out, CHORDS[beat / 4], at, 4 * BEAT)
      for (const [b, f, len] of THEME) if (b === beat) musicBox(a, out, round % 2 ? f * 2 : f, at, len * BEAT, round % 2 ? 0.035 : 0.05)
      booked++
      if (booked === LOOP) {
        loopAt += LOOP * BEAT
        booked = 0
        round++
      }
    }
  }
  book()
  music = { out, timer: setInterval(book, 100) }
}

export function stopMusic() {
  if (!music) return
  const a = audio()
  clearInterval(music.timer)
  music.out.gain.cancelScheduledValues(a.currentTime)
  music.out.gain.setTargetAtTime(0, a.currentTime, 0.2)
  const done = music.out
  setTimeout(() => done.disconnect(), 1500)
  music = null
}

// A plucked, bell-like note: a sine and two quieter overtones, struck and
// left to ring away.
function musicBox(a, out, freq, at, len, level) {
  const g = a.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(level, at + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(1.2, len))
  g.connect(out)
  for (const [k, v] of [[1, 1], [2, 0.3], [3, 0.08]]) {
    const o = a.createOscillator()
    const og = a.createGain()
    o.type = 'sine'
    o.frequency.value = freq * k
    og.gain.value = v
    o.connect(og).connect(g)
    o.start(at)
    o.stop(at + Math.max(1.2, len) + 0.1)
  }
}

// A slow, dark chord under the melody.
function pad(a, out, notes, at, len) {
  const soft = a.createBiquadFilter()
  soft.type = 'lowpass'
  soft.frequency.value = 900
  const g = a.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.018, at + 0.8)
  g.gain.setValueAtTime(0.018, at + len - 0.4)
  g.gain.linearRampToValueAtTime(0, at + len + 0.6)
  soft.connect(g).connect(out)
  for (const f of notes) {
    for (const d of [-1.5, 1.5]) {
      const o = a.createOscillator()
      o.type = 'triangle'
      o.frequency.value = f + d
      o.connect(soft)
      o.start(at)
      o.stop(at + len + 0.7)
    }
  }
}
