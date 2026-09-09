import { SCHOOLS } from '../data/schools'
import type { Chance, MatchResult, Profile, School } from '../types'

const NEAR: Record<string, string[]> = {
  東京都: ['神奈川県', '埼玉県', '千葉県'],
  神奈川県: ['東京都'],
  埼玉県: ['東京都'],
  千葉県: ['東京都'],
  大阪府: ['兵庫県', '京都府', '奈良県'],
  兵庫県: ['大阪府', '京都府'],
  京都府: ['大阪府', '奈良県', '滋賀県'],
  奈良県: ['大阪府', '京都府'],
  愛知県: ['岐阜県', '三重県'],
  岐阜県: ['愛知県'],
  福岡県: ['佐賀県'],
}

function distance(profilePref: string, schoolPref: string) {
  if (profilePref === schoolPref) return 'same' as const
  if (NEAR[profilePref]?.includes(schoolPref)) return 'near' as const
  return 'far' as const
}

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

export function matchSchool(school: School, profile: Profile): MatchResult | null {
  const dist = distance(profile.prefecture, school.prefecture)
  if (dist === 'far') return null
  if (school.model && dist !== 'same') return null

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
  } else {
    score -= 6
    cautions.push('隣接地域の学校です。通学定期と帰宅時間を必ず実測してください。')
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

  if (school.commuteMin <= profile.commuteMax - 10) {
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

  if (profile.club) {
    const hit = school.clubs.some((c) => c.includes(profile.club) || profile.club.includes(c))
    if (hit) {
      score += 8
      reasons.push(`${profile.club}を続けられそうな部活動があります。`)
    }
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
  }
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