import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SchoolCard from '../components/SchoolCard'
import { rankSchools } from '../lib/matching'
import { hasDiagnosis, loadOrEmpty } from '../lib/storage'
import type { Chance } from '../types'

export default function Results() {
  const profile = loadOrEmpty()
  const [chance, setChance] = useState<Chance | 'すべて'>('すべて')
  const [q, setQ] = useState('')
  const ranked = useMemo(() => rankSchools(profile), [profile])
  const shown = ranked.filter((m) => {
    if (chance !== 'すべて' && m.chance !== chance) return false
    if (q && !`${m.school.name}${m.school.course}${m.school.city}`.includes(q)) return false
    return true
  })

  if (!hasDiagnosis()) {
    return (
      <div className="panel">
        <h1>まだ診断がありません</h1>
        <p className="lead">3分の質問で、合う高校の順番が変わります。</p>
        <Link className="btn btn-primary" to="/shindan">診断をはじめる</Link>
      </div>
    )
  }

  return (
    <div>
      <h1>あなたに合う高校</h1>
      <p className="lead">{profile.prefecture}・{profile.grade}　偏差値{profile.hensachi}　内申{profile.naishin}　片道{profile.commuteMax}分まで</p>
      <div className="filters">
        {(['すべて', '安全', '適正', 'チャレンジ', '厳しい'] as const).map((c) => (
          <button key={c} className={`btn btn-small ${chance === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setChance(c)}>{c}</button>
        ))}
      </div>
      <label className="field">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="校名・学科・市で探す" />
      </label>
      <p className="tiny">{shown.length}校　／ フィット点は「合格できそう」だけでなく「通って幸せそう」を含みます。</p>
      <div className="cards">
        {shown.slice(0, 24).map((m) => <SchoolCard key={m.school.id} match={m} />)}
      </div>
      <p className="disclaimer">上位にモデル校が出ることがあります。実在校の最新情報は必ず公式に当たってください。</p>
    </div>
  )
}
