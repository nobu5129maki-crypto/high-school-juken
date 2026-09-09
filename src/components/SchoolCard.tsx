import { Link } from 'react-router-dom'
import type { MatchResult } from '../types'

export default function SchoolCard({ match }: { match: MatchResult }) {
  const { school, score, chance } = match
  return (
    <Link to={`/school/${school.id}`} className="school-card">
      <div className="score-mark">
        <div>
          <b>{score}</b>
          <small>フィット</small>
        </div>
      </div>
      <div>
        <div className="tiny">{school.prefecture} {school.city} ／ {school.kind} {school.gender} ／ {school.course}</div>
        <h3>{school.name}</h3>
        <div className="tiny">偏差値目安 {school.hensachi}　内申目安 {school.naishin}　通学約{school.commuteMin}分</div>
        <div className="tags">
          {school.model ? <span className="tag model-tag">モデル校</span> : null}
          {school.tags.slice(0, 3).map((t) => (
            <span className="tag" key={t}>{t}</span>
          ))}
        </div>
      </div>
      <span className={`hanko ${chance}`}>{chance}</span>
    </Link>
  )
}
