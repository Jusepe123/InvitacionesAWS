import type { HistoryEntry, Invitation } from '../types'
import { toMarkdown } from './markdown'

const STORAGE_KEY = 'scd-invitation-history-v1'
const HISTORY_LIMIT = 50

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<HistoryEntry>
  return ['id', 'createdAt', 'markdown', 'institution', 'recipient', 'role', 'greeting', 'body']
    .every((key) => typeof item[key as keyof HistoryEntry] === 'string')
}

export function loadHistory(): HistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry).slice(0, HISTORY_LIMIT) : []
  } catch {
    return []
  }
}

export function addToHistory(invitation: Invitation): HistoryEntry[] {
  return addManyToHistory([invitation])
}

export function addManyToHistory(invitations: Invitation[]): HistoryEntry[] {
  const createdAt = new Date().toISOString()
  const entries = invitations.map((invitation) => ({
    ...invitation,
    id: crypto.randomUUID(),
    createdAt,
    markdown: toMarkdown(invitation),
  }))
  const next = [...entries.reverse(), ...loadHistory()].slice(0, HISTORY_LIMIT)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}