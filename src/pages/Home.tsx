import { Link } from 'react-router-dom'
import { hasDiagnosis } from '../lib/storage'

export default function Home() {
  const started = hasDiagnosis()
  return (
    <div>
      <p className="kicker">JUNIOR HIGH × FAMILY</p>
      <section className="hero">
        <div>
          <h1>あなたに<em>合う</em>高等学校が、<br />見つかる。</h1>
          <p className="lead">
            偏差値だけで決めると、入学後に苦しくなります。内申、通学、校風、部活、学費、将来のぼんやりした希望まで含めて、親子で「通う3年間」を選べるようにしました。
          </p>
          <div className="row">
            <Link className="btn btn-primary" to="/shindan">{started ? '診断を見直す' : '3分で診断をはじめる'}</Link>
            <Link className="btn btn-ghost" to={started ? '/kekka' : '/calendar'}>{started ? '結果を見る' : '中3カレンダー'}</Link>
          </div>
        </div>
        <div className="hero-mark" aria-hidden>合</div>
      </section>

      <section className="grid-3">
        <article className="panel">
          <h2>1. 親子で答える</h2>
          <p className="muted">本人の希望と保護者の希望を分けて取るので、「なんでその高校？」が可視化されます。</p>
        </article>
        <article className="panel">
          <h2>2. 合う理由が出る</h2>
          <p className="muted">合格可能性だけでなく、フィット点と注意点。チャレンジ校の置き方も塾講師目線で出します。</p>
        </article>
        <article className="panel">
          <h2>3. 併願まで一気に</h2>
          <p className="muted">本命・適正・安全・挑戦。日程の重なりと、次の一週間にやることを具体化します。</p>
        </article>
      </section>

      <h2 style={{ marginTop: 36 }}>専門家の合議</h2>
      <div className="voices">
        <article className="voice"><b>進路指導</b>偏差値は道具です。通ったあとに伸びる環境かどうかが本命の条件です。</article>
        <article className="voice"><b>中学校教師</b>内申は提出物と授業です。2学期期末が、多くの地域で最後の勝負になります。</article>
        <article className="voice"><b>塾講師</b>挑戦は1校。安全校は「行きたくない学校」にしない。これが崩れない併願です。</article>
        <article className="voice"><b>中3</b>校則と部活と駅からの距離。パンフレットより、実際に歩いた感じが大事です。</article>
      </div>

      <div className="row" style={{ marginTop: 24 }}>
        <Link className="btn btn-ghost" to="/calendar">年間カレンダー</Link>
        <Link className="btn btn-ghost" to="/hikaku">比較表</Link>
      </div>

      <p className="disclaimer">
        掲載の偏差値・内申・日程は教材用の目安です。年度・模試主催者・学科・都道府県の選抜制度で変わります。必ず募集要項と在籍中学校の先生の指導を確認してください。一部は地域の中堅校・実業校を合成したモデル校です。
      </p>
    </div>
  )
}
