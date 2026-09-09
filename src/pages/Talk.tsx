import { Link } from 'react-router-dom'
import { hasDiagnosis, loadOrEmpty } from '../lib/storage'
import type { Priority } from '../types'

const MEANING: Record<Priority, { student: string; parent: string }> = {
  進学実績: { student: 'いい大学に行きたい、周りも本気でいてほしい', parent: '将来の選択肢を狭めたくない' },
  部活動: { student: '高校でも続けたい・青春もほしい', parent: '勉強との両立が心配' },
  校風: { student: '校則や雰囲気が自分に合うかが一番', parent: 'トラブルなく通ってほしい' },
  通学: { student: '朝がつらい。友達と帰りたい', parent: '安全に帰れる時間・距離' },
  学費: { student: '親に負担をかけたくない気持ちもある', parent: '3年間の総額が見えないと怖い' },
  専門スキル: { student: '座学より作りたい・資格が欲しい', parent: '就職や専門の現実を知りたい' },
  '国際・英語': { student: '英語や海外に触れたい', parent: '費用と実力の見積もりが欲しい' },
  面倒見: { student: '置いていかれるのが不安', parent: '放任校より、見てくれる学校が安心' },
}

export default function Talk() {
  const profile = loadOrEmpty()
  if (!hasDiagnosis()) {
    return (
      <div className="panel">
        <h1>親子の相談シート</h1>
        <p className="lead">診断のあと、本人と保護者のズレが一枚になります。</p>
        <Link className="btn btn-primary" to="/shindan">診断してはじめる</Link>
      </div>
    )
  }

  const onlyStudent = profile.priorities.filter((p) => !profile.parentPriorities.includes(p))
  const onlyParent = profile.parentPriorities.filter((p) => !profile.priorities.includes(p))
  const both = profile.priorities.filter((p) => profile.parentPriorities.includes(p))

  return (
    <div>
      <h1>今夜の話し合い</h1>
      <p className="lead">正解を出す場ではありません。相手の言葉を、否定せずに繰り返すだけで十分です。</p>
      <div className="talk">
        <article className="panel side">
          <h3>中学生</h3>
          <p>{profile.priorities.join('・') || '未選択'}</p>
          <p className="muted">学年 {profile.grade}　将来は「{profile.future}」</p>
        </article>
        <article className="panel side">
          <h3>保護者</h3>
          <p>{profile.parentPriorities.join('・') || '未選択'}</p>
          <p className="muted">通学 {profile.commuteMax}分　{profile.kind}</p>
        </article>
      </div>

      <section className="panel" style={{ marginTop: 14 }}>
        <h3>一致していること</h3>
        {both.length ? <p>{both.join('、')}</p> : <p className="muted">まだ重なりがありません。どちらかが諦める必要はなく、順番を決めるだけです。</p>}
        <h3 style={{ marginTop: 16 }}>ズレ（ここを話す）</h3>
        <ul className="gap-list">
          {onlyStudent.map((p) => (
            <li key={p}><b>{p}</b> — 本人：「{MEANING[p].student}」／ 保護者に伝えたいこと：頭ごなしに偏差値へ戻さない</li>
          ))}
          {onlyParent.map((p) => (
            <li key={p}><b>{p}</b> — 保護者：「{MEANING[p].parent}」／ 本人に伝えたいこと：心配の中身を数字か具体例にする</li>
          ))}
          {!onlyStudent.length && !onlyParent.length ? <li>大きなズレはありません。あとは学校を見に行くだけです。</li> : null}
        </ul>
      </section>

      <section className="advice" style={{ marginTop: 14 }}>
        <article><b>先生からの進行</b>「行きたい理由を1分」「行ってほしくない理由を1分」「共通の条件を1つ」。タイマーを置いてください。延長戦は翌日です。</article>
        <article><b>塾からの進行</b>話が平行線なら、挑戦・本命・安全の3枚に分けてください。全部を本命にしようとすると壊れます。</article>
        <article><b>中3からの本音</b>「将来のため」より「その学校の1日が想像できるか」の方が、通い始めてからの後悔が少ないです。</article>
      </section>
    </div>
  )
}
