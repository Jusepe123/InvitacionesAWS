export type Invitation = {
  institution: string
  recipient: string
  role: string
  greeting: string
  body: string
}

export type HistoryEntry = Invitation & {
  id: string
  createdAt: string
  markdown: string
}

export const EMPTY_INVITATION: Invitation = {
  institution: 'Nova Tech Bolivia S.R.L.',
  recipient: '',
  role: '',
  greeting: 'De nuestra mayor consideración:',
  body: '',
}
