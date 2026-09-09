import type { MatchResult, Profile, School } from '../types'

export type Slot = '本命' | '適正' | '安全' | '挑戦'

export type ExamPlan = {
  slot: Slot
  match: MatchResult
}

function everyday(school: School, profile: Profile) {
  const wantsVoc = profile.priorities.includes('専門スキル') || profile.future === '専門・就職'
  if (!wantsVoc && school.tags.includes('専門スキル')) return false
  if (/音楽|美術|舞台|農業|工業|実業/.test(school.course) && !wantsVoc) return false
  if (school.lifestyle === 'フレックス' && profile.lifestyle !== '柔軟さ重視') return false
  if (school.model) return false
  return true
}

export function buildPlan(matches: MatchResult[], profile: Profile): {
  plan: ExamPlan[]
  warnings: string[]
  next: string[]
} {
  const warnings: string[] = []
  const used = new Set<string>()
  const plan: ExamPlan[] = []
  const prefer = matches.filter((m) => everyday(m.school, profile))
  const pool = prefer.length >= 3 ? prefer : matches

  const take = (slot: Slot, pred: (m: MatchResult) => boolean) => {
    const found = pool.find((m) => !used.has(m.school.id) && pred(m))
    if (found) {
      used.add(found.school.id)
      plan.push({ slot, match: found })
    }
  }

  take('本命', (m) => m.chance === '適正' || (m.chance === 'チャレンジ' && m.score >= 70))
  take('適正', (m) => m.chance === '適正' || (m.chance === 'チャレンジ' && m.score >= 65))
  take('安全', (m) => m.chance === '安全' || (m.gap >= 4 && m.school.course.includes('普通科')))
  take('挑戦', (m) => m.chance === 'チャレンジ' || m.chance === '厳しい')

  if (!plan.some((p) => p.slot === '安全')) {
    warnings.push('安全校が入っていません。合格発表まで心が折れる併願です。行きたい安全校を1校加えてください。')
  }
  if (plan.filter((p) => p.slot === '挑戦').length > 1) {
    warnings.push('挑戦校は1校まで。対策が分散すると本命の点が落ちます。')
  }

  const keys = plan.map((p) => p.match.school.dateKey)
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i)
  if (dup.length) {
    warnings.push('入試日程が重なりそうな組み合わせがあります。必ず募集要項の日付で再確認を。')
  }

  if (profile.kind === 'どちらも' && !plan.some((p) => p.match.school.kind === '私立')) {
    warnings.push('公立が本命なら、先に受験する私立を1校置くと心の保険になります。')
  }

  const next = [
    profile.grade === '中3' ? '今週、説明会か文化祭に1校行く。' : '今は内申と授業を最優先。志望は広く見ておく。',
    '安全校は「落ちたから行く学校」と呼ばない。本人が通う理由を一文で書く。',
    '学費と通学時間を、感想ではなく数字で親子のノートに残す。',
    '中学校の先生に、内申の見通しと入試相談の時期を聞く。',
  ]

  return { plan, warnings, next }
}
