import type { MouseEvent } from 'react'
import { siteStatus } from '../data/schools'
import { clubLabel, routeUrl, searchUrl } from '../lib/matching'
import type { Profile, School } from '../types'

/**
 * 学校カード・詳細で共通に使う外部リンク群。
 * - 公式サイト（到達確認の結果つき）
 * - 自宅の最寄り駅からの乗換検索
 * - 部活動の確認（希望部活があるとき）
 */
export default function SchoolLinks({ school, profile, size = 'small' }: { school: School; profile: Profile; size?: 'small' | 'normal' }) {
  const status = siteStatus(school.id)
  const route = routeUrl(school, profile.homeStation)
  const club = clubLabel(profile.club)
  const cls = `btn btn-ghost ${size === 'small' ? 'btn-small' : ''}`
  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <div className="links" onClick={stop}>
      {school.model ? (
        <span className="tiny">モデル校のため公式サイトはありません</span>
      ) : school.website ? (
        <a className={cls} href={school.website} target="_blank" rel="noopener noreferrer" title={status ? `到達確認 ${status.ok ? 'OK' : 'NG'}（HTTP ${status.status}）` : '未確認'}>
          公式サイト ↗{status && !status.ok ? '（要確認）' : ''}
        </a>
      ) : (
        <a className={cls} href={searchUrl(school)} target="_blank" rel="noopener noreferrer">公式サイトを検索 ↗</a>
      )}
      {route ? (
        <a className={cls} href={route} target="_blank" rel="noopener noreferrer">
          {profile.homeStation.trim()}から乗換検索 ↗
        </a>
      ) : null}
      {club && !school.model ? (
        <a className={cls} href={searchUrl(school, `${club}部`)} target="_blank" rel="noopener noreferrer">
          {club}部を確認 ↗
        </a>
      ) : null}
    </div>
  )
}
