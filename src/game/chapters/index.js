// The story of Mira, in six acts and twenty chapters.
// Each chapter module exports { title, pages }.

import ch01 from './ch01.js'
import ch02 from './ch02.js'
import ch03 from './ch03.js'
import ch04 from './ch04.js'
import ch05 from './ch05.js'
import ch06 from './ch06.js'
import ch07 from './ch07.js'
import ch08 from './ch08.js'
import ch09 from './ch09.js'
import ch10 from './ch10.js'
import ch11 from './ch11.js'
import ch12 from './ch12.js'
import ch13 from './ch13.js'
import ch14 from './ch14.js'
import ch15 from './ch15.js'
import ch16 from './ch16.js'
import ch17 from './ch17.js'
import ch18 from './ch18.js'
import ch19 from './ch19.js'
import ch20 from './ch20.js'

export const ACTS = [
  { name: 'Act I · Grey', chapters: [ch01, ch02, ch03, ch04] },
  { name: 'Act II · Music', chapters: [ch05, ch06, ch07, ch08] },
  { name: 'Act III · Together', chapters: [ch09, ch10, ch11, ch12] },
  { name: 'Act IV · Static', chapters: [ch13, ch14, ch15] },
  { name: 'Act V · Letting Go', chapters: [ch16, ch17, ch18] },
  { name: 'Act VI · Colour', chapters: [ch19, ch20] },
]

// Flat list: [{ number, act, title, pages }]
export const CHAPTERS = ACTS.flatMap((act) =>
  act.chapters.map((ch) => ({ ...ch, act: act.name })),
).map((ch, i) => ({ ...ch, number: i + 1 }))
