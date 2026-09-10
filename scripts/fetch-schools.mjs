// 文部科学省「学校コード一覧」から全国の高等学校（D1）の基本情報を取り込み、
// src/data/base-schools.json を生成する。GitHub Actions で毎週自動実行する。
//
// 取得できるのは「校名・所在地・設置区分」だけなので、偏差値や部活は含まない。
// アプリ側では「基本情報のみの学校」として、公式サイト検索・乗換検索のリンク付きで一覧表示する。
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(here, '../src/data/base-schools.json')
const metaPath = resolve(here, '../src/data/base-schools-meta.json')

const PAGE = 'https://www.mext.go.jp/b_menu/toukei/mext_01087.html'
const UA = 'Mozilla/5.0 (compatible; au-koukou-school-fetch/1.0; +https://high-school-juken.vercel.app)'

const PREFS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
  '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県',
  '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

async function get(url, as = 'text') {
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer())
}

/** 文科省ページから最新公表分（同じ日付プレフィックス）の CSV リンクを取り出す */
function latestCsvLinks(html) {
  const links = [...html.matchAll(/href="(\/content\/(\d{8})-[^"]+\.csv)"/g)].map((m) => ({ path: m[1], date: m[2] }))
  if (links.length === 0) throw new Error('CSV リンクが見つかりません（ページ構成が変わった可能性）')
  const newest = links.map((l) => l.date).sort().at(-1)
  return links.filter((l) => l.date === newest).map((l) => 'https://www.mext.go.jp' + l.path)
}

/** RFC4180 風の CSV パーサ（引用符内の改行・カンマに対応） */
function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); if (row.some((c) => c !== '')) rows.push(row) }
  return rows
}

/** 住所から市区町村を取り出す（東京23区は区、郡部は郡＋町村、それ以外は市） */
function cityOf(address, pref) {
  let a = address.replace(/\s+/g, '')
  if (a.startsWith(pref)) a = a.slice(pref.length)
  // 郡部（市・区より前に「郡」が来る）→ 郡＋町村
  const gun = a.match(/^([^市区郡]*?郡[^市区]*?[町村])/)
  if (gun) return gun[1]
  // 市 または 東京23区。政令市は「〇〇市△△区」まで含める
  // （四日市・廿日市・市原・市川は名前に「市」を含むため先に固定で拾う）
  const shi = a.match(/^((?:四日市|廿日市|市原|市川|.+?)[市区](?:[^市区町村郡0-9０-９]{1,4}区)?)/)
  if (shi) return shi[1]
  const cho = a.match(/^(.+?[町村])/)
  return cho ? cho[1] : ''
}

function kindOf(code) {
  // 設置区分: 1(国) 2(公) 3(私)
  if (code.startsWith('1')) return '国立'
  if (code.startsWith('3')) return '私立'
  return '公立'
}

/** 全角英数・空白を正規化（検索用の表示名は元のまま保持） */
function normalizeName(name) {
  return name.replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\s+/g, '').trim()
}

async function main() {
  const html = await get(PAGE)
  const csvUrls = latestCsvLinks(html)
  console.log(`最新CSV ${csvUrls.length} 件:`)
  csvUrls.forEach((u) => console.log('  ' + u))

  let sourceDate = ''
  const schools = []
  for (const url of csvUrls) {
    const buf = await get(url, 'buffer')
    // UTF-8 BOM 付き
    const text = buf.toString('utf8').replace(/^\uFEFF/, '')
    const rows = parseCsv(text)
    // 先頭行に「更新日：2026/5/20」のような表記がある
    const head = rows[0]?.join(',') ?? ''
    const dm = head.match(/(\d{4}\/\d{1,2}\/\d{1,2})/)
    if (dm && !sourceDate) sourceDate = dm[1]
    let count = 0
    for (const r of rows) {
      const [code, type, prefCol, setKind, honbun, name, address, , , abolished] = r
      if (!code || !/^D1/.test(type ?? '')) continue // 高等学校のみ
      if (abolished && abolished.trim()) continue // 廃止済み
      const prefNo = Number((prefCol ?? '').slice(0, 2))
      const pref = PREFS[prefNo - 1]
      if (!pref) continue
      const branch = /^2/.test(honbun ?? '') // 2(分) は分校
      schools.push({
        code,
        name: normalizeName(name ?? ''),
        pref,
        city: cityOf(address ?? '', pref),
        kind: kindOf(setKind ?? ''),
        ...(branch ? { branch: true } : {}),
      })
      count++
    }
    console.log(`  ${count} 校（高等学校）を読み取り`)
  }

  // 学校コードで重複排除し、都道府県→名前で安定ソート
  const seen = new Set()
  const list = schools.filter((s) => (seen.has(s.code) ? false : (seen.add(s.code), true)))
  list.sort((a, b) => PREFS.indexOf(a.pref) - PREFS.indexOf(b.pref) || a.name.localeCompare(b.name, 'ja'))

  const byKind = list.reduce((m, s) => ((m[s.kind] = (m[s.kind] ?? 0) + 1), m), {})

  // 本体（大きい）は内容が変わったときだけ書き換え、確認日などのメタ情報は毎回小さなファイルに書く。
  // こうすると毎週の自動コミットが数行の差分で済み、リポジトリが肥大化しない。
  const body = { schools: list }
  let bodyChanged = true
  try {
    const prev = JSON.parse(await readFile(outPath, 'utf8'))
    bodyChanged = JSON.stringify(prev.schools) !== JSON.stringify(list)
  } catch {
    /* 初回 */
  }
  if (bodyChanged || process.argv.includes('--force')) {
    await writeFile(outPath, JSON.stringify(body) + '\n', 'utf8')
    console.log(`\n${list.length} 校を書き出しました: ${JSON.stringify(byKind)}`)
  } else {
    console.log(`\n学校一覧に変更なし（${list.length} 校）。本体ファイルは更新しません。`)
  }
  const meta = {
    source: '文部科学省 学校コード一覧',
    sourceUrl: PAGE,
    sourceDate, // 文科省側の更新日
    checkedAt: new Date().toISOString(), // このスクリプトが最新版を確認した日時
    total: list.length,
    byKind,
  }
  await writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8')
  console.log(`メタ情報を書き出しました（文科省更新日 ${sourceDate}）`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
