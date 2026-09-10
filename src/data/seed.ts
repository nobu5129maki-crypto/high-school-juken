import type { Priority, School, SchoolKind, Gender, TuitionBand } from '../types'

/** 学校データの元（省略できる項目は toSchool で補完する） */
export type Seed = {
  id: string
  name: string
  prefecture: string
  city: string
  kind: SchoolKind
  gender?: Gender
  course: string
  hensachi: number
  commuteMin: number
  station?: string
  stationMin?: number
  dorm?: boolean
  dormNote?: string
  tuition?: TuitionBand
  clubs: string[]
  features: string[]
  atmosphere: string[]
  tags: Priority[]
  university: string
  examStyle: string
  examSeason: string
  dateKey: string
  lifestyle?: School['lifestyle']
  description: string
  teacherNote: string
  jukuNote: string
  studentNote: string
  model?: boolean
}
