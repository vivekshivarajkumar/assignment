// Recomputes the totals in tokens.json from its per-session entries.
// Usage: update or add a session in tokens.json, then `npm run tokens`.
import { readFileSync, writeFileSync } from 'node:fs'

const file = new URL('../tokens.json', import.meta.url)
const data = JSON.parse(readFileSync(file, 'utf8'))
const keys = ['input_tokens', 'output_tokens', 'cache_write_tokens', 'cache_read_tokens']

const total = Object.fromEntries(keys.map((k) => [k, data.sessions.reduce((sum, s) => sum + (s[k] ?? 0), 0)]))
total.tokens = keys.reduce((sum, k) => sum + total[k], 0)
total.cost_usd = Math.round(data.sessions.reduce((sum, s) => sum + (s.cost_usd ?? 0), 0) * 100) / 100

data.total = total
data.updated_at = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
console.log(`${total.tokens.toLocaleString('en-US')} tokens, $${total.cost_usd}`)
