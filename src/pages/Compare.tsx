import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSchool } from '../data/schools'
import { checkClub, clubLabel, matchSchool } from '../lib/matching'
import { loadCompare, loadOrEmpty, toggleCompare } from '../lib/storage'
import type { School } from '../types'

export default function Compare() {
  const profile = loadOrEmpty()
  const [rev, setRev] = useState(0)
  const ids = useMemo(() => loadCompare(), [rev])
  // 削除済み・不明な id が保存されていても落ちないよう、見つかった学校だけを使う
  const schools = ids.map((id) => getSchool(id)).filter((s): s is School => Boolean(s))

  if (schools.length === 0) {
    return (
      <div className="panel">
        <h1>比較表</h1>
        <p className="lead">学校詳細から最大3校を入れてください。偏差値だけでなく、通う理由を並べます。</p>
        <Link className="btn btn-primary" to="/kekka">結果から選ぶ</Link>
      </div>
    )
  }

  const rows: { label: string; get: (s: School) => string }[] = [
    { label: 'フィット', get: (s) => String(matchSchool(s, profile)?.score ?? '—') },
    { label: '合格帯', get: (s) => matchSchool(s, profile)?.chance ?? '—' },
    { label: '設置', get: (s) => `${s.kind} ${s.gender}` },
    { label: '学科', get: (s) => s.course },
    { label: '偏差値', get: (s) => String(s.hensachi) },
    { label: '内申目安', get: (s) => String(s.naishin) },
    { label: '最寄り駅', get: (s) => (s.station ? `${s.station}駅 ${s.stationMin}分` : '公式サイトで確認') },
    { label: '通学目安', get: (s) => `約${s.commuteMin}分` },
    { label: '寮', get: (s) => (s.dorm ? `あり（${(s.dormNote ?? '').replace(/。$/, '')}）` : '未確認') },
    { label: '学費', get: (s) => s.tuition },
    { label: '入試時期', get: (s) => s.examSeason },
    { label: '校風', get: (s) => s.atmosphere.join('／') },
    { label: '部活（確認済み）', get: (s) => s.clubs.join('、') },
  ]
  const club = clubLabel(profile.club)
  if (club) {
    rows.push({ label: `${club}部`, get: (s) => (checkClub(s, club) === '確認済み' ? '確認済み' : '未確認') })
  }

  return (
    <div>
      <h1>比較表</h1>
      <p className="lead">数字が近い学校ほど、校風と通学で決めてください。</p>
      <div className="compare">
        <table>
          <thead>
            <tr>
              <th>項目</th>
              {schools.map((s) => (
                <th key={s.id}>
                  <Link to={`/school/${s.id}`}>{s.name}</Link>
                  {s.website ? (
                    <div><a className="compare-link" href={s.website} target="_blank" rel="noopener noreferrer">公式サイト ↗</a></div>
                  ) : null}
                  <div>
                    <button className="btn btn-small btn-ghost" onClick={() => { toggleCompare(s.id); setRev((n) => n + 1) }}>外す</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th>{r.label}</th>
                {schools.map((s) => <td key={s.id}>{r.get(s)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
