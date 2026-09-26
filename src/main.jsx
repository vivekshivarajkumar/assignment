import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/patrick-hand/latin-400.css'
import '@fontsource/gaegu/latin-300.css'
import '@fontsource/andika/latin-400.css'
import '@fontsource/andika/latin-700.css'
import '@fontsource/josefin-slab/latin-600.css'
import '@fontsource/noto-sans-tc/400.css'
import '@fontsource/montserrat/latin-400.css'
import '@fontsource/montserrat/latin-500.css'
import '@fontsource/montserrat/latin-600.css'
import './index.css'
import App from './App.jsx'
import { fontsLoaded } from './game/fonts.js'

// nothing is drawn until the fonts are in, so no text ever changes face
fontsLoaded().then(() =>
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
