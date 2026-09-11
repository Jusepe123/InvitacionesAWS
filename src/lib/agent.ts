import { normalizeInvitation } from './markdown'
import type { Invitation } from '../types'

export type AgentRequest = {
  invitations: Invitation[]
  autoGenerate: boolean
  error?: string
}

const MAX_BATCH_SIZE = 100

function value(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const candidate = source[key]
    if (typeof candidate === 'string') return candidate
  }
  return ''
}

function toInvitation(source: unknown): Invitation {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Cada invitación debe ser un objeto JSON.')
  const item = source as Record<string, unknown>
  return normalizeInvitation({
    institution: value(item, 'institution', 'institucion', 'institución'),
    recipient: value(item, 'recipient', 'destinatario', 'name', 'nombre'),
    role: value(item, 'role', 'cargo'),
    greeting: value(item, 'greeting', 'saludo'),
    body: value(item, 'body', 'cuerpo', 'cuerpo_personalizado'),
  })
}

function parsePayload(raw: string): Invitation[] {
  const parsed: unknown = JSON.parse(raw)
  const items = Array.isArray(parsed) ? parsed : [parsed]
  if (items.length === 0 || items.length > MAX_BATCH_SIZE) throw new Error(`El lote debe contener entre 1 y ${MAX_BATCH_SIZE} invitaciones.`)
  const invitations = items.map(toInvitation).filter((item) => item.institution || item.recipient)
  if (invitations.length !== items.length) throw new Error('Cada invitación debe incluir institution o recipient.')
  return invitations
}

/** URL contract for browser agents: input is one object or an array, URI encoded. */
export function readAgentRequest(search: string): AgentRequest | null {
  const params = new URLSearchParams(search)
  const payload = params.get('input') ?? params.get('batch')
  const autoGenerate = ['1', 'true', 'yes'].includes((params.get('generate') ?? '').toLowerCase())
  if (payload) {
    try { return { invitations: parsePayload(payload), autoGenerate } } catch (error) {
      return { invitations: [], autoGenerate: false, error: error instanceof Error ? error.message : 'Input JSON no válido.' }
    }
  }

  const hasSimpleInput = ['institution', 'institucion', 'recipient', 'destinatario', 'role', 'cargo', 'greeting', 'saludo', 'body', 'cuerpo', 'cuerpo_personalizado'].some((key) => params.has(key))
  if (!hasSimpleInput) return null
  try {
    const invitation = toInvitation({
      institution: params.get('institution') ?? params.get('institucion'),
      recipient: params.get('recipient') ?? params.get('destinatario'),
      role: params.get('role') ?? params.get('cargo'),
      greeting: params.get('greeting') ?? params.get('saludo'),
      body: params.get('body') ?? params.get('cuerpo') ?? params.get('cuerpo_personalizado'),
    })
    if (!invitation.institution && !invitation.recipient) throw new Error('La URL debe incluir institution o recipient.')
    return { invitations: [invitation], autoGenerate }
  } catch (error) {
    return { invitations: [], autoGenerate: false, error: error instanceof Error ? error.message : 'Parámetros no válidos.' }
  }
}
