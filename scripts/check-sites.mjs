// 公式サイトURLの到達確認スクリプト。
// src/data/websites.json の各URLへアクセスし、結果を src/data/site-check.json に書き出す。
// GitHub Actions で毎週自動実行し、アプリ側で「最終確認日」として表示する。
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const websitesPath = resolve(here, '../src/data/websites.json')
const outPath = resolve(here, '../src/data/site-check.json')

const TIMEOUT_MS = 15000
const UA = 'Mozilla/5.0 (compatible; au-koukou-link-check/1.0; +https://high-school-juken.vercel.app)'

async function probe(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } })
    // 401/403 はサイト自体は存在するが自動アクセスを拒否しているケース。到達扱いにする
    const ok = res.ok || res.status === 401 || res.status === 403
    return { ok, status: res.status, finalUrl: res.url }
  } catch (e) {
    return { ok: false, status: 0, error: String(e?.cause?.code ?? e?.name ?? e) }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const websites = JSON.parse(await readFile(websitesPath, 'utf8'))
  const ids = Object.keys(websites)
  const results = {}
  // サーバーに負荷をかけないよう少しずつ並列に
  const CONCURRENCY = 6
  let i = 0
  async function worker() {
    while (i < ids.length) {
      const id = ids[i++]
      const url = websites[id]
      const r = await probe(url)
      results[id] = r
      const mark = r.ok ? 'OK ' : 'NG '
      console.log(`${mark} ${String(r.status).padStart(3)}  ${id}  ${url}${r.finalUrl && r.finalUrl !== url ? '  -> ' + r.finalUrl : ''}${r.error ? '  ' + r.error : ''}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  const okCount = Object.values(results).filter((r) => r.ok).length
  const checkedAt = new Date().toISOString()
  const out = {
    checkedAt,
    total: ids.length,
    ok: okCount,
    results: Object.fromEntries(ids.map((id) => [id, { ok: results[id].ok, status: results[id].status }])),
  }
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log(`\n${okCount}/${ids.length} reachable. Written to ${outPath}`)
  const strict = process.argv.includes('--strict')
  if (strict && okCount !== ids.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
