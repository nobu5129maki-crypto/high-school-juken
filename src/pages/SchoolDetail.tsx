import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSchool } from '../data/schools'
import { matchSchool } from '../lib/matching'
import { loadCompare, loadFavorites, loadOrEmpty, toggleCompare, toggleFavorite } from '../lib/storage'

export default function SchoolDetail() {
  const { id } = useParams()
  const school = getSchool(id ?? '')
  const profile = loadOrEmpty()
  const match = school ? matchSchool(school, profile) : null
  const [rev, setRev] = useState(0)
  const fav = useMemo(() => loadFavorites(), [id, rev])
  const cmp = useMemo(() => loadCompare(), [id, rev])

  if (!school) return <p>学校が見つかりません。</p>

  return (
    <div>
      <p className="tiny"><Link to="/kekka">結果へ戻る</Link></p>
      <div className="detail-hero">
        <div>
          <div className="tiny">{school.prefecture} {school.city}　{school.kind}　{school.gender}</div>
          <h1>{school.name}</h1>
          <p className="lead">{school.description}</p>
          {school.model ? <p className="tiny">このカードは地域の中堅・実業を合成したモデル校です。</p> : null}
        </div>
        {match ? (
          <div className="score-mark">
            <div>
              <b>{match.score}</b>
              <small>{match.chance}</small>
            </div>
          </div>
        ) : null}
      </div>

      <div className="row">
        <button className="btn btn-ghost" onClick={() => { toggleFavorite(school.id); setRev((n) => n + 1) }}>
          {fav.includes(school.id) ? 'お気に入り済' : 'お気に入り'}
        </button>
        <button className="btn btn-ghost" onClick={() => { toggleCompare(school.id); setRev((n) => n + 1) }}>
          {cmp.includes(school.id) ? '比較から外す' : '比較に入れる'}
        </button>
        <Link className="btn btn-primary" to="/heigan">併願に使う</Link>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="kv">
          <b>学科</b><span>{school.course}</span>
          <b>偏差値目安</b><span>{school.hensachi}</span>
          <b>内申目安</b><span>{school.naishin} / 45</span>
          <b>通学</b><span>約{school.commuteMin}分（県庁所在地付近からの目安）</span>
          <b>学費</b><span>{school.tuition}</span>
          <b>入試</b><span>{school.examStyle}　{school.examSeason}</span>
          <b>進学・進路</b><span>{school.university}</span>
          <b>部活動例</b><span>{school.clubs.join('、')}</span>
          <b>校風</b><span>{school.atmosphere.join('／')}</span>
        </div>
      </section>

      {match ? (
        <section className="grid-2" style={{ marginTop: 14 }}>
          <article className="panel">
            <h3>合う理由</h3>
            <ul>{match.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </article>
          <article className="panel">
            <h3>確認してほしいこと</h3>
            {match.cautions.length ? <ul>{match.cautions.map((r) => <li key={r}>{r}</li>)}</ul> : <p className="muted">大きな警告はありません。見学で空気を確認してください。</p>}
          </article>
        </section>
      ) : <p className="muted">診断すると、この学校とのフィットが出ます。</p>}

      <section className="advice" style={{ marginTop: 16 }}>
        <article><b>中学校の先生</b>{school.teacherNote}</article>
        <article><b>塾講師</b>{school.jukuNote}</article>
        <article><b>中3の声</b>{school.studentNote}</article>
      </section>
    </div>
  )
}
