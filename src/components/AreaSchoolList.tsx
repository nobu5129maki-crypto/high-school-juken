import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BASE_META, loadBaseSchools, matchCurated, type BaseSchool } from '../data/baseSchools'
import { NEIGHBORS } from '../data/prefectures'
import { SCHOOLS } from '../data/schools'
import { clubLabel, routeUrl, searchUrl } from '../lib/matching'
import type { Profile, SchoolKind } from '../types'

const PAGE = 40

function fmt(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

/** 手入力の詳細データがある学校（モデル校を除く） */
const CURATED_REFS = SCHOOLS.filter((s) => !s.model).map((s) => ({ id: s.id, name: s.name, prefecture: s.prefecture, city: s.city }))

/**
 * 文部科学省の学校コード一覧に基づく「この地域のすべての高校」。
 * 詳細データ（偏差値・部活）がない学校も、名前・所在地・設置区分と検索リンクで漏れなく出す。
 */
export default function AreaSchoolList({ profile }: { profile: Profile }) {
  const [all, setAll] = useState<BaseSchool[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<SchoolKind | 'すべて'>('すべて')
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => {
    let alive = true
    loadBaseSchools().then((l) => alive && setAll(l)).catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])

  const prefs = useMemo(() => {
    if (profile.areaScope === '全国') return null
    if (profile.areaScope === '隣接県も含む') return new Set([profile.prefecture, ...(NEIGHBORS[profile.prefecture] ?? [])])
    return new Set([profile.prefecture])
  }, [profile.areaScope, profile.prefecture])

  const inScope = useMemo(() => (all ?? []).filter((s) => !prefs || prefs.has(s.pref)), [all, prefs])
  /** 学校コード → 詳細データの id（文科省一覧の1校につき最大1件） */
  const curatedByCode = useMemo(() => (all ? matchCurated(all, CURATED_REFS) : new Map<string, string>()), [all])
  const club = clubLabel(profile.club)
  const home = profile.homeStation.trim()

  const shown = useMemo(() => {
    const needle = q.trim()
    return inScope.filter((s) => (kind === 'すべて' || s.kind === kind) && (!needle || `${s.name}${s.city}${s.pref}`.includes(needle)))
  }, [inScope, kind, q])

  const curatedCount = inScope.filter((s) => curatedByCode.has(s.code)).length
  const scopeLabel = profile.areaScope === '全国' ? '全国' : profile.areaScope === '隣接県も含む' ? `${profile.prefecture}と隣接県` : profile.prefecture

  return (
    <section className="area-list" aria-label="この地域のすべての高校">
      <h2>
        {scopeLabel}のすべての高校
        {all ? <span className="muted">（{inScope.length}校）</span> : null}
      </h2>
      <p className="tiny">
        文部科学省「学校コード一覧」（{BASE_META.sourceDate}時点）から自動取得。校名・所在地・設置区分のみで、偏差値・部活は未収録です。
        上の「合う高校」に出ていない学校もここから公式サイトで確かめられます。
        {all ? `　うち${curatedCount}校は詳細データあり。` : ''}
      </p>

      {failed ? <p className="muted">一覧の読み込みに失敗しました。通信状態を確認して再読み込みしてください。</p> : null}
      {!all && !failed ? <p className="muted">一覧を読み込んでいます…</p> : null}

      {all ? (
        <>
          <div className="filters">
            {(['すべて', '公立', '私立', '国立'] as const).map((k) => (
              <button key={k} className={`btn btn-small ${kind === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setKind(k); setLimit(PAGE) }}>{k}</button>
            ))}
          </div>
          <label className="field">
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }}
              placeholder={profile.areaScope === '全国' ? '校名・市区町村・都道府県で探す（全国約4,900校）' : '校名・市区町村で探す'}
            />
          </label>
          <p className="tiny">{shown.length}校</p>
          <ul className="area-items">
            {shown.slice(0, limit).map((s) => {
              const curatedId = curatedByCode.get(s.code)
              const target = { name: s.name, prefecture: s.pref, city: s.city }
              const route = home ? routeUrl(target, home) : null
              return (
                <li key={s.code} className="area-item">
                  <div className="area-main">
                    <div className="tiny muted">
                      {s.pref} {s.city} ／ {s.kind}{s.branch ? '（分校）' : ''}
                    </div>
                    <div className="area-name">
                      {curatedId ? <Link to={`/school/${curatedId}`}>{s.name}</Link> : s.name}
                      {curatedId ? <span className="tag ok-tag">詳細データあり</span> : <span className="tag">基本情報のみ</span>}
                    </div>
                  </div>
                  <div className="links">
                    <a className="btn btn-small btn-ghost" href={searchUrl(target)} target="_blank" rel="noopener noreferrer">公式サイトを検索 ↗</a>
                    {route ? <a className="btn btn-small btn-ghost" href={route} target="_blank" rel="noopener noreferrer">{home}から乗換検索 ↗</a> : null}
                    {club ? <a className="btn btn-small btn-ghost" href={searchUrl(target, `${club}部`)} target="_blank" rel="noopener noreferrer">{club}部を確認 ↗</a> : null}
                  </div>
                </li>
              )
            })}
          </ul>
          {shown.length > limit ? (
            <button className="btn btn-ghost" onClick={() => setLimit((n) => n + PAGE)}>さらに{Math.min(PAGE, shown.length - limit)}校を表示（残り{shown.length - limit}校）</button>
          ) : null}
          <p className="tiny muted">
            出典: {BASE_META.source}（{BASE_META.sourceDate}公表分）　最終自動確認 {fmt(BASE_META.checkedAt)}　全国{BASE_META.total.toLocaleString()}校
          </p>
        </>
      ) : null}
    </section>
  )
}
