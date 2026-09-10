import { DATA_UPDATED_AT, SITE_CHECK } from '../data/schools'

function fmt(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function daysAgo(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
}

/**
 * 「この結果はいつの情報か」「自動で更新されているか」を利用者に示すパネル。
 * - 学校データ（偏差値・部活・寮）：人の手で更新。更新日を表示
 * - 公式サイトリンク：スクリプトで毎週自動確認。最終確認日と到達数を表示
 */
export default function DataFreshness({ compact = false }: { compact?: boolean }) {
  const siteAgo = daysAgo(SITE_CHECK.checkedAt)
  const dataAgo = daysAgo(DATA_UPDATED_AT)
  const stale = (dataAgo ?? 0) > 180

  if (compact) {
    return (
      <p className="tiny fresh-compact">
        学校データ更新 {fmt(DATA_UPDATED_AT)}　／　公式サイト自動確認 {fmt(SITE_CHECK.checkedAt)}（{SITE_CHECK.ok}/{SITE_CHECK.total}校 到達）
      </p>
    )
  }

  return (
    <section className={`fresh ${stale ? 'stale' : ''}`} aria-label="情報の新しさ">
      <div className="fresh-row">
        <span className="fresh-dot manual" aria-hidden />
        <div>
          <b>学校データ（偏差値目安・部活動・寮・入試方式）</b>
          <div className="tiny">
            最終更新 {fmt(DATA_UPDATED_AT)}{dataAgo !== null ? `（${dataAgo}日前）` : ''}　・　人の手で見直して更新（自動ではありません）
          </div>
        </div>
      </div>
      <div className="fresh-row">
        <span className="fresh-dot auto" aria-hidden />
        <div>
          <b>公式サイトへのリンク</b>
          <div className="tiny">
            最終自動確認 {fmt(SITE_CHECK.checkedAt)}{siteAgo !== null ? `（${siteAgo}日前）` : ''}　・　毎週自動でリンク切れを点検　・　{SITE_CHECK.ok}/{SITE_CHECK.total}校に到達
          </div>
        </div>
      </div>
      <p className="tiny fresh-note">
        募集要項・部活動の最新は各校の公式サイトが正です。各カードの「公式サイト」から必ず確かめてください。
        {stale ? ' 学校データの更新から半年以上たっています。年度の変更に注意してください。' : ''}
      </p>
    </section>
  )
}
