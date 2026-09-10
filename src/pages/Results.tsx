import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DataFreshness from '../components/DataFreshness'
import SchoolCard from '../components/SchoolCard'
import { clubLabel, rankSchools } from '../lib/matching'
import { hasDiagnosis, loadOrEmpty } from '../lib/storage'
import type { Chance } from '../types'

export default function Results() {
  const profile = loadOrEmpty()
  const [chance, setChance] = useState<Chance | 'すべて'>('すべて')
  const [q, setQ] = useState('')
  const [onlyDorm, setOnlyDorm] = useState(profile.dorm === '寮ありのみ')
  const [showUnverifiedClub, setShowUnverifiedClub] = useState(false)
  const ranked = useMemo(() => rankSchools(profile), [profile])
  const club = clubLabel(profile.club)

  const shown = ranked.filter((m) => {
    if (chance !== 'すべて' && m.chance !== chance) return false
    if (onlyDorm && !m.school.dorm) return false
    if (club && !showUnverifiedClub && m.clubCheck !== '確認済み') return false
    if (q && !`${m.school.name}${m.school.course}${m.school.city}${m.school.prefecture}`.includes(q)) return false
    return true
  })
  const hiddenByClub = club && !showUnverifiedClub ? ranked.filter((m) => m.clubCheck !== '確認済み' && (chance === 'すべて' || m.chance === chance) && (!onlyDorm || m.school.dorm)).length : 0
  const dormCount = ranked.filter((m) => m.school.dorm).length

  if (!hasDiagnosis()) {
    return (
      <div className="panel">
        <h1>まだ診断がありません</h1>
        <p className="lead">3分の質問で、合う高校の順番が変わります。</p>
        <Link className="btn btn-primary" to="/shindan">診断をはじめる</Link>
      </div>
    )
  }

  const commuteLabel = profile.commuteMax === 0 ? '通学時間は制限なし' : `片道${profile.commuteMax}分まで`

  return (
    <div>
      <h1>あなたに合う高校</h1>
      <p className="lead">
        {profile.prefecture}（{profile.areaScope}）・{profile.grade}　偏差値{profile.hensachi}　内申{profile.naishin}　{commuteLabel}
        {profile.homeStation.trim() ? `　最寄り駅 ${profile.homeStation.trim()}` : ''}
        {profile.dorm !== 'こだわらない' ? `　寮：${profile.dorm}` : ''}
        {club ? `　部活：${club}` : ''}
      </p>

      <DataFreshness />

      <div className="filters">
        {(['すべて', '安全', '適正', 'チャレンジ', '厳しい'] as const).map((c) => (
          <button key={c} className={`btn btn-small ${chance === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setChance(c)}>{c}</button>
        ))}
        <button
          className={`btn btn-small ${onlyDorm ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setOnlyDorm((v) => !v)}
          title="寮のある学校だけを表示"
        >
          寮あり{dormCount ? `（${dormCount}）` : ''}
        </button>
        {club ? (
          <button
            className={`btn btn-small ${showUnverifiedClub ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowUnverifiedClub((v) => !v)}
            title="希望の部活が確認できていない学校も表示"
          >
            {showUnverifiedClub ? `${club}部 未確認も表示中` : `${club}部 確認済みのみ`}
          </button>
        ) : null}
      </div>
      <label className="field">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="校名・学科・市・都道府県で探す" />
      </label>
      <p className="tiny">
        {shown.length}校　／ フィット点は「合格できそう」だけでなく「通って幸せそう」を含みます。
        {hiddenByClub ? `　${club}部が未確認の${hiddenByClub}校は非表示（上のボタンで表示）。` : ''}
      </p>
      {club && shown.length === 0 ? (
        <div className="panel" style={{ marginBottom: 14 }}>
          <b>{club}部が確認できた学校が、この条件では見つかりません。</b>
          <p className="muted" style={{ marginTop: 6 }}>
            「{club}部 未確認も表示」に切り替えると、部活データが未確認の学校も出ます。その場合は各校の「{club}部を確認」リンクで公式サイトを見てください。
            地域範囲を「全国」にすると、寮のある野球強豪校なども候補になります。
          </p>
        </div>
      ) : null}
      <div className="cards">
        {shown.slice(0, 30).map((m) => <SchoolCard key={m.school.id} match={m} profile={profile} />)}
      </div>
      {shown.length > 30 ? <p className="tiny">上位30校を表示しています。絞り込みで残りを確認できます。</p> : null}
      <p className="disclaimer">
        上位にモデル校が出ることがあります。偏差値・内申は目安です。部活動は「確認済み」以外は存在を保証しません。実在校の最新情報は必ず公式サイトと募集要項で確認してください。
      </p>
    </div>
  )
}
