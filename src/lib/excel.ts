import * as XLSX from 'xlsx'
import type { Invitation } from '../types'
import { normalizeInvitation } from './markdown'

type RawRow = Record<string, unknown>

function read(row: RawRow, ...keys: string[]): string {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value ?? '').trim()]),
  )
  return keys.map((key) => normalized[key]).find(Boolean) ?? ''
}

export async function parseWorkbook(file: File): Promise<Invitation[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' })
  const invitations = rows
    .map((row) => {
      const recipient = read(row, 'destinatario', 'nombre', 'recipient')
      return normalizeInvitation({
        institution: read(row, 'institucion', 'institución', 'empresa', 'institution'),
        recipient,
        role: read(row, 'cargo', 'role'),
        greeting: read(row, 'saludo', 'greeting'),
      })
    })
    .filter((invitation) => invitation.institution)

  if (!invitations.length) throw new Error('No se encontraron filas con la columna “institucion”.')
  return invitations
}

export function downloadExcelTemplate(): void {
  const sheet = XLSX.utils.json_to_sheet([
    {
      institucion: 'Universidad Ejemplo',
      destinatario: 'Dra. María Pérez',
      cargo: 'Rectora',
      saludo: 'Estimada Dra. Pérez:',
    },
  ])
  sheet['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 22 }, { wch: 28 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Invitaciones')
  XLSX.writeFile(workbook, 'plantilla-invitaciones-scd.xlsx')
}
