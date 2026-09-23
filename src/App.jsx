import { useMemo, useState } from 'react'
import Stage from './game/Stage.jsx'
import { titleCard } from './game/engine.js'
import splash from './game/splash.js'
import { CHAPTERS, ACTS } from './game/chapters/index.js'
import titleScreen from './game/titleScreen.js'
import { isMuted, setMuted } from './game/sound.js'
import tokens from '../tokens.json'

const SAVE_KEY = 'mira-progress'

function loadProgress() {
  try {
    return Number(localStorage.getItem(SAVE_KEY)) || 1
  } catch {
    return 1
  }
}

function saveProgress(n) {
  try {
    localStorage.setItem(SAVE_KEY, String(n))
  } catch {
    // progress just won't be remembered
  }
}

// ?ch=5&p=2 opens chapter 5 at its second page (page 0 is the chapter card)
function startFromUrl() {
  const q = new URLSearchParams(location.search)
  const ch = Number(q.get('ch'))
  if (!ch || !CHAPTERS[ch - 1]) return null
  return { chapter: ch, page: Number(q.get('p')) || 0 }
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M4 11 12 4l8 7v9H4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export default function App() {
  const [screen, setScreen] = useState(() => (startFromUrl() ? 'play' : 'splash'))
  const [pos, setPos] = useState(() => startFromUrl() ?? { chapter: 1, page: 0 })
  const [unlocked, setUnlocked] = useState(loadProgress)
  const [muted, setMutedState] = useState(isMuted())
  const [confirmHome, setConfirmHome] = useState(false)

  const chapter = CHAPTERS[pos.chapter - 1]
  const pages = useMemo(
    () => [titleCard(chapter.act, chapter.number, chapter.title), ...chapter.pages],
    [chapter],
  )
  const hasSave = unlocked > 1
  const title = useMemo(() => titleScreen(hasSave), [hasSave])

  const play = (n) => {
    setPos({ chapter: n, page: 0 })
    setScreen('play')
  }

  const fromTitle = (key) => {
    if (key === 'new') play(1)
    else if (key === 'continue') play(Math.min(unlocked, CHAPTERS.length))
    else setScreen(key)
  }

  const next = () => {
    if (pos.page + 1 < pages.length) {
      setPos({ ...pos, page: pos.page + 1 })
      return
    }
    const n = pos.chapter + 1
    if (n > unlocked) {
      setUnlocked(n)
      saveProgress(n)
    }
    if (n > CHAPTERS.length) setScreen('title')
    else setPos({ chapter: n, page: 0 })
  }

  const toggleSound = () => {
    setMuted(!muted)
    setMutedState(!muted)
  }

  const back = (
    <button className="back" onClick={() => setScreen('title')}>
      ← back
    </button>
  )

  return (
    <div className="app">
      <div className="screen">
        {screen === 'splash' && <Stage page={splash} onDone={() => setScreen('title')} />}
        {screen === 'title' && <Stage page={title} onDone={fromTitle} />}
        {screen === 'play' && (
          <>
            <Stage key={`${pos.chapter}-${pos.page}`} page={pages[pos.page]} onDone={next} />
            <button className="home" aria-label="Main menu" onClick={() => setConfirmHome(true)}>
              <HomeIcon />
            </button>
            {confirmHome && (
              <div className="confirm">
                <div className="confirm-box">
                  <p>Would you like to return to the main menu?</p>
                  <div className="confirm-buttons">
                    <button
                      onClick={() => {
                        setConfirmHome(false)
                        setScreen('title')
                      }}
                    >
                      Yes
                    </button>
                    <button onClick={() => setConfirmHome(false)}>No</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {screen === 'chapters' && (
          <nav className="page">
            {back}
            <h1>chapters</h1>
            {ACTS.map((act) => (
              <section key={act.name}>
                <h2>{act.name}</h2>
                <ol>
                  {CHAPTERS.filter((c) => c.act === act.name).map((c) => (
                    <li key={c.number}>
                      <button disabled={c.number > unlocked} onClick={() => play(c.number)}>
                        <span className="num">{c.number}</span>
                        {c.title.toLowerCase()}
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </nav>
        )}
        {screen === 'about' && (
          <div className="page">
            {back}
            <h1>about</h1>
            <p>
              Mira is twenty-five, and every day looks the same. Then one evening her phone dies, and
              she hears a violin.
            </p>
            <p>
              A short story in twenty chapters, told through small things you do with your hands.
              There are no words in the conversations, only pictures.
            </p>
            <p className="small">Everything you see is painted live in code on an HTML canvas.</p>
            <h2>built with Claude</h2>
            <ul className="tokens">
              <li>input: {tokens.total.input_tokens.toLocaleString('en-US')}</li>
              <li>output: {tokens.total.output_tokens.toLocaleString('en-US')}</li>
              <li>cache write: {tokens.total.cache_write_tokens.toLocaleString('en-US')}</li>
              <li>cache read: {tokens.total.cache_read_tokens.toLocaleString('en-US')}</li>
              <li>
                <strong>total: {tokens.total.tokens.toLocaleString('en-US')} tokens</strong>
              </li>
            </ul>
          </div>
        )}
        {screen === 'settings' && (
          <div className="page">
            {back}
            <h1>settings</h1>
            <button className="setting" onClick={toggleSound}>
              sound: <strong>{muted ? 'off' : 'on'}</strong>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
