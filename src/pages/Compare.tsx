import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSchool } from '../data/schools'
import { matchSchool } from '../lib/matching'
import { loadCompare, loadOrEmpty, toggleCompare } from '../lib/storage'

export default function Compare() {
  const profile = loadOrEmpty()
  const [rev, setRev] = useState(0)
  const ids = useMemo(() => loadCompare(), [rev])
  const schools = ids.map((id) => getSchool(id)).filter((s) => Boolean(s))

  if (schools.length === 0) {
    return (
      <div className="panel">
        <h1>比較表</h1>
        <p className="lead">学校詳細から最大3校を入れてください。偏差値だけでなく、通う理由を並べます。</p>
        <Link className="btn btn-primary" to="/kekka">結果から選ぶ</Link>
      </div>
    )
  }

  const rows = [
    { label: 'フィット', get: (id: string) => String(matchSchool(getSchool(id)!, profile)?.score ?? '—') },
    { label: '合格帯', get: (id: string) => matchSchool(getSchool(id)!, profile)?.chance ?? '—' },
    { label: '設置', get: (id: string) => `${getSchool(id)!.kind} ${getSchool(id)!.gender}` },
    { label: '学科', get: (id: string) => getSchool(id)!.course },
    { label: '偏差値', get: (id: string) => String(getSchool(id)!.hensachi) },
    { label: '内申目安', get: (id: string) => String(getSchool(id)!.naishin) },
    { label: '通学', get: (id: string) => `約${getSchool(id)!.commuteMin}分` },
    { label: '学費', get: (id: string) => getSchool(id)!.tuition },
    { label: '入試時期', get: (id: string) => getSchool(id)!.examSeason },
    { label: '校風', get: (id: string) => getSchool(id)!.atmosphere.join('／') },
    { label: '部活例', get: (id: string) => getSchool(id)!.clubs.join('、') },
  ]

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
                <th key={s!.id}>
                  <Link to={`/school/${s!.id}`}>{s!.name}</Link>
                  <div>
                    <button className="btn btn-small btn-ghost" onClick={() => { toggleCompare(s!.id); setRev((n) => n + 1) }}>外す</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th>{r.label}</th>
                {ids.map((id) => <td key={id}>{r.get(id)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
