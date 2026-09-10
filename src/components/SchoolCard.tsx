import { Link } from 'react-router-dom'
import { clubLabel } from '../lib/matching'
import type { MatchResult, Profile } from '../types'
import SchoolLinks from './SchoolLinks'

export default function SchoolCard({ match, profile }: { match: MatchResult; profile: Profile }) {
  const { school, score, chance, clubCheck } = match
  const club = clubLabel(profile.club)
  const farAway = school.prefecture !== profile.prefecture
  return (
    <article className="school-card">
      <Link to={`/school/${school.id}`} className="score-mark" aria-label={`${school.name}の詳細`}>
        <div>
          <b>{score}</b>
          <small>フィット</small>
        </div>
      </Link>
      <div className="school-card-body">
        <div className="tiny">
          {school.prefecture} {school.city} ／ {school.kind} {school.gender} ／ {school.course}
        </div>
        <h3><Link to={`/school/${school.id}`}>{school.name}</Link></h3>
        <div className="tiny">
          偏差値目安 {school.hensachi}　内申目安 {school.naishin}　
          {school.station ? `最寄り ${school.station}駅 ${school.stationMin}分` : `通学約${school.commuteMin}分`}
        </div>
        <div className="tags">
          {school.model ? <span className="tag model-tag">モデル校</span> : null}
          {school.dorm ? <span className="tag dorm-tag">寮あり</span> : null}
          {farAway && !school.dorm ? <span className="tag">他県</span> : null}
          {club ? (
            clubCheck === '確認済み' ? (
              <span className="tag ok-tag">{club}部 確認済み</span>
            ) : (
              <span className="tag warn-tag">{club}部 未確認</span>
            )
          ) : null}
          {school.tags.slice(0, 3).map((t) => (
            <span className="tag" key={t}>{t}</span>
          ))}
        </div>
        <SchoolLinks school={school} profile={profile} />
      </div>
      <span className={`hanko ${chance}`}>{chance}</span>
    </article>
  )
}
