import { Link } from 'react-router-dom'
import { rankSchools } from '../lib/matching'
import { hasDiagnosis, loadOrEmpty, saveExamList } from '../lib/storage'
import { buildPlan } from '../lib/strategy'
import { useMemo } from 'react'

export default function Strategy() {
  const profile = loadOrEmpty()
  const matches = useMemo(() => rankSchools(profile), [profile])
  const { plan, warnings, next } = useMemo(() => buildPlan(matches, profile), [matches, profile])

  if (!hasDiagnosis()) {
    return (
      <div className="panel">
        <h1>併願戦略</h1>
        <p className="lead">診断後に、本命・安全・挑戦のセットを自動で組みます。</p>
        <Link className="btn btn-primary" to="/shindan">先に診断</Link>
      </div>
    )
  }

  return (
    <div>
      <h1>併願の組み方</h1>
      <p className="lead">塾講師の原則は「挑戦1・本命1・安全1」。欲張ると点が落ちます。</p>
      <div className="cards">
        {plan.map((p) => (
          <article className="panel" key={p.slot + p.match.school.id}>
            <div className="tiny">{p.slot}　{p.match.chance}　フィット{p.match.score}</div>
            <h3><Link to={`/school/${p.match.school.id}`}>{p.match.school.name}</Link></h3>
            <p className="muted">{p.match.school.kind}　{p.match.school.examSeason}　通学約{p.match.school.commuteMin}分</p>
            <p>{p.match.reasons[0]}</p>
          </article>
        ))}
      </div>
      <div className="row">
        <button className="btn btn-primary" onClick={() => saveExamList(plan.map((p) => p.match.school.id))}>この4枚を保存</button>
        <Link className="btn btn-ghost" to="/hikaku">比較表で見る</Link>
      </div>
      {warnings.length ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <h3>注意</h3>
          <ul>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </section>
      ) : null}
      <section className="panel" style={{ marginTop: 16 }}>
        <h3>今週やること</h3>
        <ol>{next.map((n) => <li key={n}>{n}</li>)}</ol>
      </section>
    </div>
  )
}
