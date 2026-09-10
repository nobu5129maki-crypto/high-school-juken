import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DataFreshness from '../components/DataFreshness'
import SchoolLinks from '../components/SchoolLinks'
import { DATA_UPDATED_AT, getSchool } from '../data/schools'
import { checkClub, clubLabel, matchSchool } from '../lib/matching'
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

  const club = clubLabel(profile.club)
  const clubCheck = checkClub(school, club)

  return (
    <div>
      <p className="tiny"><Link to="/kekka">結果へ戻る</Link></p>
      <div className="detail-hero">
        <div>
          <div className="tiny">{school.prefecture} {school.city}　{school.kind}　{school.gender}</div>
          <h1>{school.name}</h1>
          <p className="lead">{school.description}</p>
          {school.model ? <p className="tiny">このカードは地域の中堅・実業を合成したモデル校です。</p> : null}
          <div className="tags">
            {school.dorm ? <span className="tag dorm-tag">寮あり</span> : null}
            {club ? (
              clubCheck === '確認済み' ? <span className="tag ok-tag">{club}部 確認済み</span> : <span className="tag warn-tag">{club}部 未確認</span>
            ) : null}
          </div>
          <SchoolLinks school={school} profile={profile} size="normal" />
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
          <b>偏差値目安</b><span>{school.hensachi}<span className="tiny">　（{DATA_UPDATED_AT}時点の調べ。年度で変わります）</span></span>
          <b>内申目安</b><span>{school.naishin} / 45</span>
          <b>最寄り駅</b>
          <span>
            {school.station ? `${school.station}駅から約${school.stationMin}分` : '公式サイトのアクセス案内で確認してください'}
            {profile.homeStation.trim() ? '　（上の「乗換検索」で自宅の最寄り駅からの所要時間を実測できます）' : '　（診断で自宅の最寄り駅を入れると乗換検索リンクが出ます）'}
          </span>
          <b>通学目安</b><span>約{school.commuteMin}分（県庁所在地付近からの目安）</span>
          <b>寮</b>
          <span>
            {school.dorm ? `あり。${school.dormNote ?? ''} 費用・対象は募集要項で確認。` : '掲載データでは確認できていません（公式サイトで確認）'}
          </span>
          <b>学費</b><span>{school.tuition}</span>
          <b>入試</b><span>{school.examStyle}　{school.examSeason}</span>
          <b>進学・進路</b><span>{school.university}</span>
          <b>部活動（確認済み）</b>
          <span>
            {school.clubs.join('、')}
            <span className="tiny" style={{ display: 'block' }}>{DATA_UPDATED_AT}時点の確認。掲載は一部です。ここに無い部活は「なし」ではなく「未確認」。全一覧は公式サイトで。</span>
          </span>
          <b>校風</b><span>{school.atmosphere.join('／')}</span>
        </div>
      </section>

      <div style={{ marginTop: 14 }}>
        <DataFreshness compact />
      </div>

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
