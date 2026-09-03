import type { HistoryEntry, Invitation } from '../types'
import { toMarkdown } from './markdown'

const STORAGE_KEY = 'scd-invitation-history-v1'

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as HistoryEntry[]
  } catch {
    return []
  }
}

export function addToHistory(invitation: Invitation): HistoryEntry[] {
  const entry: HistoryEntry = {
    ...invitation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    markdown: toMarkdown(invitation),
  }
  const next = [entry, ...loadHistory()].slice(0, 50)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
