import { EMPTY_PROFILE, type Profile } from '../types'

const PROFILE = 'aukoukou.profile'
const FAVORITES = 'aukoukou.favorites'
const COMPARE = 'aukoukou.compare'
const EXAM = 'aukoukou.exam'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadProfile(): Profile | null {
  return readJson<Profile | null>(PROFILE, null)
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(PROFILE, JSON.stringify(profile))
}

export function loadOrEmpty(): Profile {
  return loadProfile() ?? EMPTY_PROFILE
}

export function loadFavorites(): string[] {
  return readJson<string[]>(FAVORITES, [])
}

export function toggleFavorite(id: string): string[] {
  const next = loadFavorites().includes(id)
    ? loadFavorites().filter((x) => x !== id)
    : [...loadFavorites(), id]
  localStorage.setItem(FAVORITES, JSON.stringify(next))
  return next
}

export function loadCompare(): string[] {
  return readJson<string[]>(COMPARE, [])
}

export function toggleCompare(id: string): string[] {
  const cur = loadCompare()
  let next: string[]
  if (cur.includes(id)) next = cur.filter((x) => x !== id)
  else if (cur.length >= 3) next = [...cur.slice(1), id]
  else next = [...cur, id]
  localStorage.setItem(COMPARE, JSON.stringify(next))
  return next
}

export function loadExamList(): string[] {
  return readJson<string[]>(EXAM, [])
}

export function saveExamList(ids: string[]) {
  localStorage.setItem(EXAM, JSON.stringify(ids))
}

export function hasDiagnosis() {
  return Boolean(loadProfile())
}
