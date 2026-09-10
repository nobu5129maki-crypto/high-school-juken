import { distance } from '../data/prefectures'
import { DATA_UPDATED_AT, SCHOOLS } from '../data/schools'
import type { Chance, ClubCheck, MatchResult, Profile, School } from '../types'

function chanceFromGap(gap: number): Chance {
  if (gap >= 6) return '安全'
  if (gap >= 0) return '適正'
  if (gap >= -5) return 'チャレンジ'
  return '厳しい'
}

function hensachiFit(gap: number) {
  if (gap > 12) return { pts: 48, note: '学力的には余裕があります。物足りなさを感じないか、見学で確認を。' }
  if (gap >= 6) return { pts: 78, note: '合格可能性は高め。通ったあとの自分を想像できるかが分かれ目です。' }
  if (gap >= 0) return { pts: 100, note: '偏差値が適正ゾーン。実力を伸ばしながら勝負できる帯です。' }
  if (gap >= -2) return { pts: 92, note: 'ほぼ適正。当日点で十分に届く距離です。' }
  if (gap >= -5) return { pts: 80, note: 'チャレンジ圏。弱点を潰せば届く位置です。' }
  if (gap >= -8) return { pts: 52, note: '距離があります。本命にするなら併願の安全校を先に固めて。' }
  return { pts: 28, note: '現時点では厳しい帯。今は基礎固めと、行ける学校の中の本命探しを。' }
}

/** 希望の部活が掲載データで確認できるか */
export function checkClub(school: School, club: string): ClubCheck {
  const want = normalizeClub(club)
  if (!want) return '希望なし'
  const hit = school.clubs.some((c) => {
    const have = normalizeClub(c)
    return have.includes(want) || want.includes(have)
  })
  return hit ? '確認済み' : '未確認'
}

/** 画面表示用の部活名（末尾の「部」を除いた形）。空なら '' */
export function clubLabel(club: string) {
  return club.trim().replace(/部$/, '')
}

/** 「野球部」「硬式野球」「バスケ」などの表記ゆれを吸収する */
function normalizeClub(s: string) {
  let v = s.trim().replace(/\s+/g, '').replace(/部$/, '')
  v = v.replace(/^硬式|^軟式|^男子|^女子/, '')
  const alias: Record<string, string> = {
    バスケ: 'バスケットボール',
    バレー: 'バレーボール',
    バド: 'バドミントン',
    ブラバン: '吹奏楽',
    ラグビーフットボール: 'ラグビー',
    陸上競技: '陸上',
    軟式野球: '野球',
  }
  return alias[v] ?? v
}

/** 寮を使う前提で見る学校か（寮があり、本人が寮を選択肢にしている） */
export function usesDorm(school: School, profile: Profile) {
  return Boolean(school.dorm) && profile.dorm !== 'こだわらない'
}

export function matchSchool(school: School, profile: Profile): MatchResult | null {
  const dist = distance(profile.prefecture, school.prefecture)
  const dormOk = usesDorm(school, profile)

  // 地域範囲。寮を使うなら距離の制限は外す
  if (!dormOk) {
    if (profile.areaScope === '同じ都道府県' && dist !== 'same') return null
    if (profile.areaScope === '隣接県も含む' && dist === 'far') return null
  }
  if (school.model && dist !== 'same') return null

  if (profile.dorm === '寮ありのみ' && !school.dorm) return null

  if (profile.gender !== 'こだわらない' && school.gender !== '共学' && school.gender !== profile.gender) {
    return null
  }
  if (profile.kind !== 'どちらも' && school.kind !== '国立' && school.kind !== profile.kind) {
    return null
  }
  if (profile.lifestyle === '毎日登校' && school.lifestyle === 'フレックス') return null

  const reasons: string[] = []
  const cautions: string[] = []
  let score = 0

  if (dist === 'same') {
    score += 24
    reasons.push(`${school.prefecture}の学校で、生活圏に合っています。`)
  } else if (dormOk) {
    score += 12
    reasons.push(`${school.prefecture}の学校ですが寮があり、全国から通えます。`)
  } else if (dist === 'near') {
    score -= 6
    cautions.push('隣接地域の学校です。通学定期と帰宅時間を必ず実測してください。')
  } else {
    score -= 14
    cautions.push('遠方の学校です。通学は現実的か、寮・下宿・転居の有無を家族で確認してください。')
  }

  if (school.dorm && profile.dorm !== 'こだわらない') {
    if (profile.dorm === '寮ありを優先') score += 10
    const note = (school.dormNote ?? '詳細は公式サイトで確認').replace(/。$/, '')
    reasons.push(`寮があります（${note}）。`)
  }

  const gap = profile.hensachi - school.hensachi
  const h = hensachiFit(gap)
  score += Math.round(h.pts * 0.42)
  if (gap >= 0) reasons.push(h.note)
  else cautions.push(h.note)

  const nGap = profile.naishin - school.naishin
  if (nGap >= 0) {
    score += 16
    reasons.push(`内申の目安（${school.naishin}）に対して、今の評定で戦えそうです。`)
  } else if (nGap >= -3) {
    score += 10
    cautions.push('内申はもう一声。提出物・実技4科・授業態度が残り時間の勝負です。')
  } else {
    score += 4
    cautions.push('内申が目安より低め。推薦や内申比重の高い方式は慎重に。')
  }

  if (dormOk) {
    score += 12
    reasons.push('寮を使えば通学時間の制約はありません。帰省の頻度と費用を先に確認して。')
  } else if (profile.commuteMax === 0) {
    score += 9
    reasons.push('通学時間は制限なしで探しています。乗換案内で実測を。')
  } else if (school.commuteMin <= profile.commuteMax - 10) {
    score += 14
    reasons.push(`通学目安${school.commuteMin}分で、希望時間に余裕があります。`)
  } else if (school.commuteMin <= profile.commuteMax) {
    score += 9
    reasons.push(`通学は希望の上限内（約${school.commuteMin}分）です。`)
  } else {
    score -= 8
    cautions.push(`通学が希望より長め（約${school.commuteMin}分）。部活後の帰宅を想像して。`)
  }

  if (profile.kind === 'どちらも' && school.kind === '公立') {
    score += 4
    reasons.push('学費が公立水準で、家計の負担を抑えやすい選択です。')
  }
  if (school.kind === '私立' && profile.parentPriorities.includes('学費')) {
    cautions.push('私立は学費が上がります。3年間と塾代の上限を保護者と数字で共有して。')
  }

  const overlap = school.tags.filter((t) => profile.priorities.includes(t))
  score += overlap.length * 7
  if (overlap.length) reasons.push(`大切にしたいこと（${overlap.join('・')}）と学校の強みが重なります。`)

  const parentHit = school.tags.filter((t) => profile.parentPriorities.includes(t))
  if (parentHit.length) score += parentHit.length * 3

  if (profile.future === '大学' && school.tags.includes('進学実績')) {
    score += 6
    reasons.push('大学進学を見据えた実績・指導があります。')
  }
  if (profile.future === '専門・就職' && school.tags.includes('専門スキル')) {
    score += 10
    reasons.push('資格・実習・就職の道がはっきりしている点が、将来像と合います。')
  }
  if (profile.future === 'まだ決めていない' && school.course.includes('総合')) {
    score += 8
    reasons.push('総合学科は、高校に入ってから選べる幅が残ります。')
  }

  if (profile.lifestyle === '柔軟さ重視' && school.lifestyle !== '標準') {
    score += 12
    reasons.push('単位制・フレックスなど、通い方の柔軟さがあります。')
  } else if (school.lifestyle === 'フレックス' && profile.lifestyle !== '柔軟さ重視') {
    score -= 18
    cautions.push('通い方が特殊です。全日制が合う人には、まず通常の学校を見てください。')
  }

  const clubCheck = checkClub(school, profile.club)
  const cl = clubLabel(profile.club)
  if (clubCheck === '確認済み') {
    score += 10
    reasons.push(`${cl}部の存在を公式情報で確認済みです（${DATA_UPDATED_AT}時点）。`)
  } else if (clubCheck === '未確認') {
    score -= 6
    cautions.push(`${cl}部があるかは未確認です。公式サイトの部活動一覧で必ず確認を。`)
  }

  const wantsVocational =
    profile.priorities.includes('専門スキル') || profile.future === '専門・就職'
  if (school.tags.includes('専門スキル') && !wantsVocational) {
    score -= 14
  }
  if (/音楽|美術|舞台|農業|工業|実業/.test(school.course) && !wantsVocational) {
    score -= 10
  }
  if (school.course.includes('普通科') && !wantsVocational) score += 6
  if (school.model) score -= 12

  score = Math.max(8, Math.min(100, Math.round(score)))

  return {
    school,
    score,
    chance: chanceFromGap(gap),
    gap,
    reasons: reasons.slice(0, 4),
    cautions: cautions.slice(0, 3),
    clubCheck,
  }
}

/**
 * 自宅の最寄り駅から学校までの乗換検索リンク（Google マップ・公共交通）。
 * 学校側の最寄り駅が分かっていればそこを目的地に、無ければ学校名で検索する。
 */
/** リンク生成に必要な最小限の学校情報（詳細データ校・基本情報のみの校のどちらでも使える） */
export type LinkTarget = { name: string; prefecture: string; city: string; station?: string }

export function routeUrl(school: LinkTarget, homeStation: string) {
  const origin = homeStation.trim()
  if (!origin) return null
  const originQ = /駅$/.test(origin) ? origin : `${origin}駅`
  const dest = school.station ? `${school.station.split('・')[0]}駅 ${school.prefecture}` : `${school.name} ${school.prefecture}${school.city}`
  const p = new URLSearchParams({ api: '1', origin: originQ, destination: dest, travelmode: 'transit' })
  return `https://www.google.com/maps/dir/?${p.toString()}`
}

/** 公式サイトが未登録の学校向けの検索リンク */
export function searchUrl(school: LinkTarget, extra = '公式サイト') {
  return `https://www.google.com/search?q=${encodeURIComponent(`${school.name} ${school.prefecture} ${extra}`)}`
}

export function rankSchools(profile: Profile): MatchResult[] {
  return SCHOOLS.map((s) => matchSchool(s, profile))
    .filter((m): m is MatchResult => Boolean(m))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const aHome = a.school.prefecture === profile.prefecture ? 1 : 0
      const bHome = b.school.prefecture === profile.prefecture ? 1 : 0
      if (bHome !== aHome) return bHome - aHome
      if (Number(a.school.model) !== Number(b.school.model)) return Number(a.school.model) - Number(b.school.model)
      return Math.abs(a.gap) - Math.abs(b.gap)
    })
}