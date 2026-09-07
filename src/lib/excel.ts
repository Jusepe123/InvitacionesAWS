import { readSheet } from 'read-excel-file/browser'
import writeXlsxFile, { type SheetData } from 'write-excel-file/browser'
import type { Invitation } from '../types'
import { normalizeInvitation } from './markdown'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_ROWS = 100

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function read(row: unknown[], headers: string[], ...keys: string[]): string {
  const index = headers.findIndex((header) => keys.includes(header))
  return index >= 0 ? text(row[index]) : ''
}

export async function parseWorkbook(file: File): Promise<Invitation[]> {
  if (file.size > MAX_FILE_SIZE) throw new Error('El archivo Excel no debe superar 5 MB.')

  const [headerRow = [], ...rows] = await readSheet(file)
  const headers = headerRow.map((value) => text(value).toLowerCase())
  if (rows.length > MAX_ROWS) throw new Error(`El archivo admite un máximo de ${MAX_ROWS} invitaciones.`)

  const invitations = rows
    .map((row) => {
      const recipient = read(row, headers, 'destinatario', 'nombre', 'recipient')
      return normalizeInvitation({
        institution: read(row, headers, 'institucion', 'institución', 'empresa', 'institution'),
        recipient,
        role: read(row, headers, 'cargo', 'role'),
        greeting: read(row, headers, 'saludo', 'greeting'),
      })
    })
    .filter((invitation) => invitation.institution || invitation.recipient)

  if (!invitations.length) {
    throw new Error('No se encontraron filas con una institución o un destinatario.')
  }
  return invitations
}

export async function downloadExcelTemplate(): Promise<void> {
  const data: SheetData = [
    [
      { value: 'institucion', fontWeight: 'bold', backgroundColor: '#DCE8F5' },
      { value: 'destinatario', fontWeight: 'bold', backgroundColor: '#DCE8F5' },
      { value: 'cargo', fontWeight: 'bold', backgroundColor: '#DCE8F5' },
      { value: 'saludo', fontWeight: 'bold', backgroundColor: '#DCE8F5' },
    ],
    ['Universidad Ejemplo', '', '', 'De nuestra mayor consideración:'],
    ['', 'Dra. María Pérez', 'Líder de comunidad', 'Estimada Dra. Pérez:'],
  ]

  await writeXlsxFile(data, {
    columns: [{ width: 30 }, { width: 25 }, { width: 22 }, { width: 28 }],
  }).toFile('plantilla-invitaciones-scd.xlsx')
}
