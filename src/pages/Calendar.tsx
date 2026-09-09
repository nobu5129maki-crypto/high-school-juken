import { monthAdvice, YEAR } from '../data/calendar'
import { loadOrEmpty } from '../lib/storage'

export default function CalendarPage() {
  const profile = loadOrEmpty()
  const now = new Date().getMonth() + 1
  return (
    <div>
      <h1>中3の一年</h1>
      <p className="lead">{monthAdvice(profile.prefecture)}</p>
      <div className="timeline">
        {YEAR.map((m) => (
          <article key={m.month} className={`panel month-card ${m.month === now ? 'now' : ''}`}>
            <div className="month-num">{m.month}月 {m.month === now ? '・いま' : ''}</div>
            <h3>{m.title}</h3>
            <div className="advice" style={{ marginTop: 10 }}>
              <article><b>中学生</b>{m.student}</article>
              <article><b>保護者</b>{m.parent}</article>
              <article><b>先生</b>{m.teacher}</article>
              <article><b>塾</b>{m.juku}</article>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
