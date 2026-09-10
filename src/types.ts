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

/** 候補に含める地域の範囲 */
export type AreaScope = '同じ都道府県' | '隣接県も含む' | '全国'
/** 寮の希望 */
export type DormPref = 'こだわらない' | '寮ありを優先' | '寮ありのみ'

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
  /** 県庁所在地付近からの通学目安（分）。寮利用時は参考値 */
  commuteMin: number
  /** 最寄り駅（分かる場合のみ） */
  station?: string
  /** 最寄り駅からの徒歩・バス分（分かる場合のみ） */
  stationMin?: number
  /** 公式サイトURL（未設定なら検索リンクに切替） */
  website?: string
  /** 寮の有無 */
  dorm?: boolean
  /** 寮の補足（対象・条件など） */
  dormNote?: string
  tuition: TuitionBand
  /** 公式サイト等で存在を確認できた部活動（一部のみ掲載） */
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
  /** 候補に含める地域の範囲 */
  areaScope: AreaScope
  /** 自宅の最寄り駅（乗換検索リンクに使用） */
  homeStation: string
  grade: Grade
  naishin: number
  hensachi: number
  /** 片道の通学時間上限（分）。0 は制限なし */
  commuteMax: number
  /** 寮の希望 */
  dorm: DormPref
  kind: KindPref
  gender: GenderPref
  priorities: Priority[]
  parentPriorities: Priority[]
  future: Future
  lifestyle: LifeStyle
  club: string
}

export type ClubCheck = '確認済み' | '未確認' | '希望なし'

export type MatchResult = {
  school: School
  score: number
  chance: Chance
  gap: number
  reasons: string[]
  cautions: string[]
  /** 希望した部活動が掲載データで確認できたか */
  clubCheck: ClubCheck
}

export const AREA_SCOPES: AreaScope[] = ['同じ都道府県', '隣接県も含む', '全国']
export const DORM_PREFS: DormPref[] = ['こだわらない', '寮ありを優先', '寮ありのみ']
/** 通学時間の選択肢（分）。0 は制限なし */
export const COMMUTE_OPTIONS = [30, 45, 60, 90, 120, 0] as const

/** 部活動の入力候補 */
export const CLUB_SUGGESTIONS = [
  '野球',
  'サッカー',
  'バスケットボール',
  'バレーボール',
  'テニス',
  '陸上',
  '卓球',
  'バドミントン',
  '剣道',
  '柔道',
  '弓道',
  'ラグビー',
  '水泳',
  'ダンス',
  '吹奏楽',
  '合唱',
  '美術',
  '書道',
  '演劇',
  '軽音',
  '科学',
  'ロボコン',
]

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
  areaScope: '隣接県も含む',
  homeStation: '',
  grade: '中3',
  naishin: 32,
  hensachi: 55,
  commuteMax: 60,
  dorm: 'こだわらない',
  kind: 'どちらも',
  gender: 'こだわらない',
  priorities: ['校風', '通学'],
  parentPriorities: ['学費', '通学'],
  future: 'まだ決めていない',
  lifestyle: 'こだわらない',
  club: '',
}
