import { useEffect, useMemo, useState } from 'react'
import Stage from './game/Stage.jsx'
import { titleCard } from './game/engine.js'
import splash from './game/splash.js'
import { CHAPTERS, ACTS } from './game/chapters/index.js'
import titleScreen from './game/titleScreen.js'
import { isMuted, setMuted, startMusic, stopMusic } from './game/sound.js'
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

// Every page of every chapter in order, each chapter's card first: the debug
// list, and the ◀ ▶ that step through them.
const ALL_PAGES = CHAPTERS.flatMap((c) => [c.title, ...c.pages].map((_, page) => ({ chapter: c.number, page })))

// a page's number, and its function's name where it has one while developing
// (a production build minifies names away)
function pageName(chapter, page) {
  if (page === 0) return 'card'
  const name = CHAPTERS[chapter - 1].pages[page - 1].name
  return import.meta.env.DEV && name ? `${page} ${name}` : String(page)
}

// the screens that make up the home menu, where the music plays
const HOME = ['title', 'chapters', 'about', 'settings', 'debug']

// ?debug opens the list of every page; with ?ch=5&p=2 it opens that page with
// the debug bar
const debugFromUrl = () => new URLSearchParams(location.search).has('debug')

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
  const [screen, setScreen] = useState(() => (startFromUrl() ? 'play' : debugFromUrl() ? 'debug' : 'splash'))
  const [pos, setPos] = useState(() => startFromUrl() ?? { chapter: 1, page: 0 })
  const [unlocked, setUnlocked] = useState(loadProgress)
  const [muted, setMutedState] = useState(isMuted())
  const [confirmHome, setConfirmHome] = useState(false)
  const [debug, setDebug] = useState(debugFromUrl)

  useEffect(() => {
    if (HOME.includes(screen)) startMusic()
    else stopMusic()
  }, [screen])

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
    if (muted) startMusic()
  }

  // open any page directly, with the debug bar
  const openPage = (chapter, page) => {
    setDebug(true)
    setPos({ chapter, page })
    setScreen('play')
  }
  const step = (d) => {
    const i = ALL_PAGES.findIndex((p) => p.chapter === pos.chapter && p.page === pos.page)
    const to = ALL_PAGES[Math.max(0, Math.min(ALL_PAGES.length - 1, i + d))]
    setPos({ chapter: to.chapter, page: to.page })
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
            <Stage
              key={`${pos.chapter}-${pos.page}`}
              page={pages[pos.page]}
              onDone={next}
              paused={confirmHome}
            />
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
                        setDebug(false)
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
            {debug && (
              <div className="debug-bar">
                <button onClick={() => setScreen('debug')}>pages</button>
                <button aria-label="Previous page" onClick={() => step(-1)}>
                  ◀
                </button>
                <span>
                  {pos.chapter} · {pageName(pos.chapter, pos.page)}
                </span>
                <button aria-label="Next page" onClick={() => step(1)}>
                  ▶
                </button>
              </div>
            )}
          </>
        )}
        {screen === 'debug' && (
          <nav className="page">
            {back}
            <h1>debug</h1>
            <p className="small">Every page of every chapter, locked or not. Opens with ◀ ▶ to step through.</p>
            {ACTS.map((act) => (
              <section key={act.name}>
                <h2>{act.name}</h2>
                <ol className="debug-pages">
                  {CHAPTERS.filter((c) => c.act === act.name).map((c) => (
                    <li key={c.number}>
                      <span className="num">{c.number}</span>
                      {c.title.toLowerCase()}
                      <div>
                        {[c.title, ...c.pages].map((_, page) => (
                          <button key={page} onClick={() => openPage(c.number, page)}>
                            {pageName(c.number, page)}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </nav>
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
            <button className="setting" onClick={() => setScreen('debug')}>
              debug: <strong>every page</strong>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
