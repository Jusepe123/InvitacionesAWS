import type { Invitation } from '../types'

const KEY_MAP: Record<string, keyof Invitation> = {
  institucion: 'institution',
  institución: 'institution',
  institution: 'institution',
  destinatario: 'recipient',
  recipient: 'recipient',
  cargo: 'role',
  role: 'role',
  saludo: 'greeting',
  greeting: 'greeting',
}

export function toMarkdown(invitation: Invitation): string {
  return [
    '---',
    `institucion: ${invitation.institution}`,
    `destinatario: ${invitation.recipient}`,
    `cargo: ${invitation.role}`,
    `saludo: ${invitation.greeting}`,
    '---',
  ].join('\n')
}

export function fromMarkdown(markdown: string, fallback: Invitation): Invitation {
  const result = { ...fallback }
  const block = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)
  const source = block?.[1] ?? markdown

  source.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(':')
    if (separator < 0) return
    const rawKey = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    const key = KEY_MAP[rawKey]
    if (key) result[key] = value
  })

  if (!result.institution.trim()) throw new Error('El Markdown debe incluir “institucion”.')
  return normalizeInvitation(result)
}

export function normalizeInvitation(invitation: Invitation): Invitation {
  const recipient = invitation.recipient.trim()
  const institution = invitation.institution.trim()
  return {
    institution,
    recipient,
    role: invitation.role.trim(),
    greeting:
      invitation.greeting.trim() ||
      (recipient ? `Estimada/o ${recipient}:` : 'De nuestra mayor consideración:'),
  }
}
