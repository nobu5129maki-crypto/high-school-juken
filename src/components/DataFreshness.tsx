import { BASE_META } from '../data/baseSchools'
import { SITE_CHECK } from '../data/schools'

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
 * 「自動で最新化されている情報」だけを示すパネル。
 * - 全国の学校一覧（校名・所在地・設置区分）：文部科学省の学校コード一覧から毎週自動取得
 * - 公式サイトリンク：毎週自動でリンク切れを点検
 * 偏差値目安・部活などの手入力データは、各項目のそばに「時点」を表示する。
 */
export default function DataFreshness({ compact = false }: { compact?: boolean }) {
  const siteAgo = daysAgo(SITE_CHECK.checkedAt)
  const baseAgo = daysAgo(BASE_META.checkedAt)

  if (compact) {
    return (
      <p className="tiny fresh-compact">
        自動更新：学校一覧（文科省 {BASE_META.sourceDate}公表）確認 {fmt(BASE_META.checkedAt)}　／　公式サイト到達確認 {fmt(SITE_CHECK.checkedAt)}（{SITE_CHECK.ok}/{SITE_CHECK.total}校）
      </p>
    )
  }

  return (
    <section className="fresh" aria-label="自動更新される情報">
      <div className="fresh-head tiny">自動で最新に保たれている情報</div>
      <div className="fresh-row">
        <span className="fresh-dot auto" aria-hidden />
        <div>
          <b>全国の高校一覧（校名・所在地・公立/私立）</b>
          <div className="tiny">
            文部科学省「学校コード一覧」{BASE_META.sourceDate}公表分　・　最終自動確認 {fmt(BASE_META.checkedAt)}{baseAgo !== null ? `（${baseAgo}日前）` : ''}　・　毎週自動で最新版を取得　・　全国{BASE_META.total.toLocaleString()}校
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
        募集要項・部活動・偏差値の最新は各校の公式サイトと募集要項が正です。各カードの「公式サイト」から必ず確かめてください。
      </p>
    </section>
  )
}
