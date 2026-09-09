export type Role = 'student' | 'parent' | 'together'
export type Grade = '中1' | '中2' | '中3'
export type SchoolKind = '公立' | '私立' | '国立'
export type KindPref = '公立' | '私立' | 'どちらも'
export type Gender = '共学' | '男子' | '女子'
export type GenderPref = Gender | 'こだわらない'
export type TuitionBand = '公立水準' | '私立標準' | '私立高め'
export type LifeStyle = '毎日登校' | '柔軟さ重視' | 'こだわらない'
export type Future = '大学' | '専門・就職' | 'まだ決めていない'

export type Priority =
  | '進学実績'
  | '部活動'
  | '校風'
  | '通学'
  | '学費'
  | '専門スキル'
  | '国際・英語'
  | '面倒見'

export type Chance = '安全' | '適正' | 'チャレンジ' | '厳しい'

export type School = {
  id: string
  name: string
  prefecture: string
  city: string
  kind: SchoolKind
  gender: Gender
  course: string
  hensachi: number
  naishin: number
  commuteMin: number
  tuition: TuitionBand
  clubs: string[]
  features: string[]
  atmosphere: string[]
  tags: Priority[]
  university: string
  examStyle: string
  examSeason: string
  dateKey: string
  lifestyle: '標準' | '単位制' | 'フレックス'
  description: string
  teacherNote: string
  jukuNote: string
  studentNote: string
  model?: boolean
}

export type Profile = {
  role: Role
  prefecture: string
  grade: Grade
  naishin: number
  hensachi: number
  commuteMax: number
  kind: KindPref
  gender: GenderPref
  priorities: Priority[]
  parentPriorities: Priority[]
  future: Future
  lifestyle: LifeStyle
  club: string
}

export type MatchResult = {
  school: School
  score: number
  chance: Chance
  gap: number
  reasons: string[]
  cautions: string[]
}

export const PRIORITIES: Priority[] = [
  '進学実績',
  '部活動',
  '校風',
  '通学',
  '学費',
  '専門スキル',
  '国際・英語',
  '面倒見',
]

export const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
] as const

export const EMPTY_PROFILE: Profile = {
  role: 'together',
  prefecture: '東京都',
  grade: '中3',
  naishin: 32,
  hensachi: 55,
  commuteMax: 60,
  kind: 'どちらも',
  gender: 'こだわらない',
  priorities: ['校風', '通学'],
  parentPriorities: ['学費', '通学'],
  future: 'まだ決めていない',
  lifestyle: 'こだわらない',
  club: '',
}
