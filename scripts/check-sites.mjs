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
const RETRY_TIMEOUT_MS = 30000
const UA = 'Mozilla/5.0 (compatible; au-koukou-link-check/1.0; +https://high-school-juken.vercel.app)'

async function fetchOnce(url, timeoutMs) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } })
    // 本文は使わない。残すと、相手が接続を切った瞬間に undici が
    // AssertionError (assert(!this.paused)) を投げてプロセスごと落ちる。
    try {
      await res.body?.cancel()
    } catch {
      /* 本文の破棄失敗は到達判定に影響しない */
    }
    // 401/403 はサイト自体は存在するが自動アクセスを拒否しているケース。到達扱いにする
    const ok = res.ok || res.status === 401 || res.status === 403
    return { ok, status: res.status, finalUrl: res.url }
  } catch (e) {
    return { ok: false, status: 0, error: String(e?.cause?.code ?? e?.name ?? e) }
  } finally {
    clearTimeout(timer)
  }
}

// 接続そのものができなかった（タイムアウト・接続拒否）エラーか
function isNetworkError(r) {
  return r.status === 0 && /TIMEOUT|ECONNRESET|ECONNREFUSED|AbortError|EHOSTUNREACH|ENETUNREACH/i.test(r.error ?? '')
}

// 証明書チェーンの不備など、Node の fetch では失敗するがブラウザでは開けるTLSエラーか
// （中間証明書の未配信・古い鍵長・古いTLS再交渉設定など。サイト自体は存在し、ブラウザは補完して表示できる）
function isTlsChainError(r) {
  return r.status === 0 && /UNABLE_TO_VERIFY_LEAF_SIGNATURE|DH_KEY_TOO_SMALL|ALTNAME_INVALID|UNABLE_TO_GET_ISSUER_CERT|UNSAFE_LEGACY_RENEGOTIATION/i.test(r.error ?? '')
}

async function probe(url, previous) {
  let r = await fetchOnce(url, TIMEOUT_MS)
  if (isNetworkError(r)) {
    // 一時的な不調の可能性があるので、時間を延ばして1回だけ再試行
    r = await fetchOnce(url, RETRY_TIMEOUT_MS)
  }
  if (isTlsChainError(r)) {
    return { ok: true, status: 0, error: r.error, note: 'tls-chain' }
  }
  // 503 など一時的なサーバエラーで「リンク切れ」にしない。前回到達できていれば維持する
  if (r.status >= 500 && previous?.ok) {
    return { ok: true, status: r.status, note: 'http-5xx-kept' }
  }
  if (isNetworkError(r) && previous?.ok) {
    // 海外の実行環境（GitHub Actions）からの接続を遮断している学校サイトがある。
    // DNS 不在や 404 のような「壊れた」証拠ではないので、前回 OK なら OK を維持し、状態だけ記録する
    return { ok: true, status: 0, error: r.error, note: 'timeout-kept' }
  }
  return r
}

// 一部の学校サイトは応答の途中で接続を切る。そのとき undici が Promise の外で
// AssertionError を投げ、週次ジョブ全体が落ちて更新日が止まった（2026-09 以降）。
// 1件の失敗では止めず、記録して残りの学校を確認する。
process.on('uncaughtException', (err) => {
  console.error('未処理エラーを記録して続行:', err?.code || err?.name || err?.message || err)
})
process.on('unhandledRejection', (err) => {
  const message = err && typeof err === 'object' && 'message' in err ? err.message : err
  console.error('未処理の拒否を記録して続行:', message)
})

async function main() {
  const websites = JSON.parse(await readFile(websitesPath, 'utf8'))
  const ids = Object.keys(websites)
  const previous = await readFile(outPath, 'utf8').then((t) => JSON.parse(t).results ?? {}).catch(() => ({}))
  const results = {}
  // サーバーに負荷をかけないよう少しずつ並列に
  const CONCURRENCY = 6
  let i = 0
  async function worker() {
    while (i < ids.length) {
      const id = ids[i++]
      const url = websites[id]
      let r
      try {
        r = await probe(url, previous[id])
      } catch (e) {
        r = { ok: false, status: 0, error: String(e?.message ?? e) }
      }
      results[id] = r
      const mark = r.note ? 'OK*' : r.ok ? 'OK ' : 'NG '
      const noteText = r.note === 'timeout-kept' ? '  （接続タイムアウト。前回OKのため維持）' : r.note === 'tls-chain' ? '  （証明書チェーン不備。ブラウザでは表示可のためOK扱い）' : r.note === 'http-5xx-kept' ? '  （一時的なサーバエラー。前回OKのため維持）' : ''
      console.log(`${mark} ${String(r.status).padStart(3)}  ${id}  ${url}${r.finalUrl && r.finalUrl !== url ? '  -> ' + r.finalUrl : ''}${r.error ? '  ' + r.error : ''}${noteText}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  const okCount = Object.values(results).filter((r) => r.ok).length
  const checkedAt = new Date().toISOString()
  const out = {
    checkedAt,
    total: ids.length,
    ok: okCount,
    results: Object.fromEntries(
      ids.map((id) => {
        const row = results[id] ?? { ok: false, status: 0 }
        return [id, { ok: Boolean(row.ok), status: row.status ?? 0, ...(row.note ? { note: row.note } : {}) }]
      }),
    ),
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
