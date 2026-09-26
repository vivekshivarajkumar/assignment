// Every face the game draws its Latin text with. Canvas text is repainted every
// frame, so a face that arrived late would swap in while the player watched;
// main.jsx holds the first frame until these are in. (The Chinese replies in
// the call with Mum load separately: see ch01-talk.js.)
const FACES = [
  "400 16px 'Patrick Hand'",
  "300 16px 'Gaegu'",
  "400 16px 'Andika'",
  "700 16px 'Andika'",
  "600 16px 'Josefin Slab'",
  "400 16px 'Montserrat'",
  "500 16px 'Montserrat'",
  "600 16px 'Montserrat'",
]

// Resolves once every face has loaded, or after a few seconds regardless, so a
// font server that is down can't keep the game from starting.
export function fontsLoaded() {
  if (!document.fonts) return Promise.resolve()
  const all = Promise.all(FACES.map((f) => document.fonts.load(f)))
  const giveUp = new Promise((resolve) => setTimeout(resolve, 5000))
  return Promise.race([all, giveUp]).catch(() => {})
}
