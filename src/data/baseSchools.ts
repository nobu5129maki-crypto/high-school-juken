import baseMeta from './base-schools-meta.json'
import type { SchoolKind } from '../types'

/**
 * 文部科学省「学校コード一覧」から自動取得した全国の高等学校（基本情報のみ）。
 * scripts/fetch-schools.mjs が毎週生成する。偏差値・部活などは含まない。
 */
export type BaseSchool = {
  /** 文科省 学校コード */
  code: string
  name: string
  pref: string
  city: string
  kind: SchoolKind
  /** 分校 */
  branch?: boolean
}

export const BASE_META = baseMeta as {
  source: string
  sourceUrl: string
  /** 文科省側の更新日（例: 2026/5/20） */
  sourceDate: string
  /** スクリプトが最新版を確認した日時 */
  checkedAt: string
  total: number
  byKind: Record<string, number>
}

let cache: Promise<BaseSchool[]> | null = null

/** 本体（約4,900校）は大きいので、必要になった画面で初めて読み込む */
export function loadBaseSchools(): Promise<BaseSchool[]> {
  cache ??= import('./base-schools.json').then((m) => (m.default as { schools: BaseSchool[] }).schools)
  return cache
}

/**
 * 設置者を除いた校名（「東京都立日比谷高等学校」→「日比谷高等学校」、「北海道札幌南高等学校」→「札幌南高等学校」）。
 * 手入力データと文科省データの突き合わせに使う。
 */
export function coreName(name: string) {
  const n = name
    .replace(/\s+/g, '')
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
  const stripped = n
    // 「学校法人○○学園○○高等学校」→ 法人名を落とす（法人名と校名の先頭が一致する形、または 会/学園/学院/塾 で終わる法人名）
    .replace(/^学校法人(.{2,}?)(?:学園|学院|大学|会)?(?=\1)/, '')
    .replace(/^学校法人.+?(?:会|学園|学院|塾)(?=.+高等学校$)/, '')
    .replace(/^学校法人/, '')
    // 「東京都立」「市立」「○○市立」「○○組合立」
    .replace(/^.*?(?:都|道|府|県|市|区|町|村|組合)立/, '')
    // 北海道・宮城県は「立」を付けない（北海道札幌北高等学校／宮城県仙台第二高等学校）
    .replace(/^(?:北海道|宮城県)(?=.+高等学校$)/, '')
  // 「静岡市立高等学校」「浜松市立高等学校」のように設置者名そのものが校名の学校は削らない
  return /^高等学校/.test(stripped) ? n : stripped
}

export function baseKey(pref: string, name: string) {
  return `${pref}|${coreName(name)}`
}

function fullKey(pref: string, name: string) {
  return `${pref}|${name.replace(/\s+/g, '').replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))}`
}

export type CuratedRef = { id: string; name: string; prefecture: string; city: string }

/**
 * 手入力データの学校を文科省一覧の1校に対応づける（学校コード → id）。
 * 1) 正式名称が完全一致するものを優先（「船橋市立船橋高等学校」と「千葉県立船橋高等学校」を区別）
 * 2) 残りは設置者を除いた校名で照合。候補が複数あるときは 市区が一致するもの → 県立・都立・道立・府立 を優先し、1校だけに付ける
 */
export function matchCurated(base: BaseSchool[], curated: CuratedRef[]): Map<string, string> {
  const byFull = new Map<string, BaseSchool[]>()
  const byCore = new Map<string, BaseSchool[]>()
  for (const b of base) {
    const f = fullKey(b.pref, b.name)
    byFull.set(f, [...(byFull.get(f) ?? []), b])
    const k = baseKey(b.pref, b.name)
    byCore.set(k, [...(byCore.get(k) ?? []), b])
  }
  const result = new Map<string, string>()
  const taken = new Set<string>()
  const rest: CuratedRef[] = []
  for (const c of curated) {
    const hit = byFull.get(fullKey(c.prefecture, c.name))?.find((b) => !taken.has(b.code))
    if (hit) {
      result.set(hit.code, c.id)
      taken.add(hit.code)
    } else rest.push(c)
  }
  for (const c of rest) {
    const cands = (byCore.get(baseKey(c.prefecture, c.name)) ?? []).filter((b) => !taken.has(b.code))
    if (!cands.length) continue
    const pick =
      cands.length === 1
        ? cands[0]
        : (cands.find((b) => b.city === c.city && /(?:都|道|府|県)立/.test(b.name)) ??
          cands.find((b) => b.city === c.city) ??
          cands.find((b) => /(?:都|道|府|県)立/.test(b.name)) ??
          cands[0])
    result.set(pick.code, c.id)
    taken.add(pick.code)
  }
  return result
}
