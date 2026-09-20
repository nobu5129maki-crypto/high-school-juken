import { Link } from 'react-router-dom'
import { rankSchools } from '../lib/matching'
import { hasDiagnosis, loadExamList, loadOrEmpty, saveExamList } from '../lib/storage'
import { buildPlan } from '../lib/strategy'
import { useMemo, useState } from 'react'

export default function Strategy() {
  const [profile] = useState(loadOrEmpty)
  const matches = useMemo(() => rankSchools(profile), [profile])
  const { plan, warnings, next } = useMemo(() => buildPlan(matches, profile), [matches, profile])
  const planIds = plan.map((p) => p.match.school.id)
  // 保存済みの併願プランと今の提案が同じなら「保存済み」を出す
  const [saved, setSaved] = useState(() => {
    const cur = loadExamList()
    return planIds.length > 0 && cur.length === planIds.length && planIds.every((id) => cur.includes(id))
  })

  if (!hasDiagnosis()) {
    return (
      <div className="panel">
        <h1>併願戦略</h1>
        <p className="lead">診断後に、本命・安全・挑戦のセットを自動で組みます。</p>
        <Link className="btn btn-primary" to="/shindan">先に診断</Link>
      </div>
    )
  }

  if (plan.length === 0) {
    return (
      <div className="panel">
        <h1>併願の組み方</h1>
        <p className="lead">この条件に合う学校が見つからず、併願を組めませんでした。</p>
        <p className="muted">診断で「候補に含める範囲」を広げる、寮の希望や部活の条件を緩めると候補が出ます。</p>
        <Link className="btn btn-primary" to="/shindan">診断を見直す</Link>
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
            <p className="muted">
              {p.match.school.kind}　{p.match.school.examSeason}　
              {p.match.school.dorm ? '寮あり' : `通学約${p.match.school.commuteMin}分`}
              {p.match.school.website ? <>　<a href={p.match.school.website} target="_blank" rel="noopener noreferrer" className="compare-link">公式サイト ↗</a></> : null}
            </p>
            <p>{p.match.reasons[0]}</p>
          </article>
        ))}
      </div>
      <div className="row">
        <button
          className={`btn ${saved ? 'btn-ghost' : 'btn-primary'}`}
          disabled={saved}
          onClick={() => {
            saveExamList(planIds)
            setSaved(true)
          }}
        >
          {saved ? `この${plan.length}校を保存済み ✓` : `この${plan.length}校を保存`}
        </button>
        <Link className="btn btn-ghost" to="/hikaku">比較表で見る</Link>
      </div>
      {saved ? <p className="tiny">保存した学校は、結果・学校詳細に「併願候補」の印が付きます。</p> : null}
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
