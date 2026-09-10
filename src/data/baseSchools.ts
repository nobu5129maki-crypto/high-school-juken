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
  return name
    .replace(/\s+/g, '')
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/^.+?(?:都|道|府|県|市|区|町|村|組合)立/, '')
    .replace(/^北海道(?=.+高等学校$)/, '')
}

export function baseKey(pref: string, name: string) {
  return `${pref}|${coreName(name)}`
}
