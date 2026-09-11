import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { Invitation } from '../types'

const COLORS = {
  navy: '#002653',
  deepNavy: '#000B21',
  blue: '#021A46',
  cyan: '#00E7FB',
  ink: '#000B21',
  muted: '#002653',
  paper: '#FFFFFF',
  line: '#C6E6EB',
}

let headerPromise: Promise<string> | undefined
let logoPromise: Promise<string> | undefined

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar ${url}`))
    image.src = url
  })
}

async function cropHeader(): Promise<string> {
  if (!headerPromise) {
    headerPromise = (async () => {
      const image = await loadImage('/assets/indice.png')
      const canvas = document.createElement('canvas')
      const cropHeight = Math.round(image.width * (73 / 210))
      canvas.width = image.width
      canvas.height = cropHeight
      canvas.getContext('2d')!.drawImage(image, 0, 0, image.width, cropHeight, 0, 0, image.width, cropHeight)
      return canvas.toDataURL('image/jpeg', 0.9)
    })()
  }
  return headerPromise
}

async function assetData(url: string): Promise<string> {
  if (!logoPromise) {
    logoPromise = (async () => {
      const response = await fetch(url)
      const blob = await response.blob()
      return await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.readAsDataURL(blob)
      })
    })()
  }
  return logoPromise
}

function safeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function richTextRuns(text: string, boldPhrases: string[]): Array<{ text: string; bold: boolean }> {
  if (boldPhrases.length === 0) return [{ text, bold: false }]

  const pattern = new RegExp(`(${boldPhrases.map(escapeRegExp).join('|')})`, 'g')
  return text.split(pattern).filter(Boolean).map((part) => ({
    text: part,
    bold: boldPhrases.includes(part),
  }))
}

function drawRichText(
  doc: jsPDF,
  text: string,
  boldPhrases: string[],
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  let cursorX = x
  let cursorY = y
  let hasSpace = false

  for (const run of richTextRuns(text, boldPhrases)) {
    doc.setFont('helvetica', run.bold ? 'bold' : 'normal')
    for (const token of run.text.match(/\S+|\s+/g) ?? []) {
      if (/\s/.test(token)) {
        if (token.includes('\n')) {
          cursorX = x
          cursorY += lineHeight
          hasSpace = false
        } else {
          hasSpace = cursorX !== x
        }
        continue
      }

      const prefix = hasSpace && cursorX !== x ? ' ' : ''
      const segment = `${prefix}${token}`
      if (cursorX !== x && cursorX + doc.getTextWidth(segment) > x + maxWidth) {
        cursorX = x
        cursorY += lineHeight
      }
      const rendered = cursorX === x ? token : segment
      doc.text(rendered, cursorX, cursorY)
      cursorX += doc.getTextWidth(rendered)
      hasSpace = true
    }
  }

  return cursorY + lineHeight
}

export function pdfFilename(invitation: Invitation): string {
  return `Invitacion-SCD-${safeName(invitation.recipient || invitation.institution || 'Bolivia-2026')}.pdf`
}

export async function createInvitationPdf(invitation: Invitation): Promise<Blob> {
  const personalized = Boolean(invitation.recipient.trim())
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  doc.setProperties({
    title: 'Invitación AWS Student Community Day Bolivia 2026',
    subject: 'Invitación al SCD Bolivia 2026',
    author: 'AWS Student Builder Group UPB Cbba',
    creator: 'Generador de invitaciones SCD Bolivia 2026',
  })
  const [header, logo, qr] = await Promise.all([
    cropHeader(),
    assetData('/assets/logo-white.png'),
    QRCode.toDataURL('https://luma.com/r65j1ukn', { margin: 0, width: 512, errorCorrectionLevel: 'M' }),
  ])

  doc.setFillColor(COLORS.paper)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setDrawColor(COLORS.line)
  doc.setLineWidth(0.05)
  for (let x = 0; x <= 210; x += 10) doc.line(x, 73, x, 277)
  for (let y = 73; y <= 277; y += 10) doc.line(0, y, 210, y)

  doc.addImage(header, 'JPEG', 0, 0, 210, 73)
  doc.setFillColor(COLORS.deepNavy)
  doc.setGState(doc.GState({ opacity: 0.8 }))
  doc.rect(0, 57, 210, 16, 'F')
  doc.setGState(doc.GState({ opacity: 1 }))
  doc.addImage(logo, 'PNG', 13, 8, 24, 24)
  doc.setTextColor('#FFFFFF')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('AWS STUDENT BUILDER GROUP', 197, 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('UPB COCHABAMBA', 197, 18, { align: 'right' })
  doc.setDrawColor(COLORS.cyan)
  doc.setLineWidth(0.45)
  doc.line(149, 23, 197, 23)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.ink)
  doc.setFontSize(15)
  doc.text(invitation.recipient || invitation.institution, 18, 90, { maxWidth: 174 })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.muted)
  doc.setFontSize(9)
  const subtitle = personalized
    ? [invitation.role, invitation.institution].filter(Boolean).join(' · ')
    : 'A quien corresponda'
  if (subtitle) doc.text(subtitle, 18, 99, { maxWidth: 174 })
  doc.setDrawColor(COLORS.blue)
  doc.setLineWidth(0.3)
  doc.line(18, 108, 52, 108)

  doc.setTextColor(COLORS.ink)
  doc.setFontSize(10)
  doc.text(invitation.greeting, 18, 119)
  const defaultBody = [
    'El AWS Student Builder Group UPB Cbba tiene el agrado de invitarle al AWS Student Community Day (SCD) Bolivia 2026, el primer evento internacional de la comunidad estudiantil de Amazon en Bolivia, será una jornada creada para reunir a estudiantes interesados en tecnología y computación en la nube.',
    `Durante la jornada, los asistentes podrán ampliar su perspectiva sobre el ecosistema tecnológico, descubrir nuevas posibilidades de la nube y conectar con estudiantes que comparten el interés por aprender, crear y transformar ideas en proyectos. ${personalized ? 'Nos encantaría contar con su participación.' : 'Nos encantaría contar con la participación de su institución.'}`,
  ]
  const bodyParagraphs = invitation.body.trim() ? invitation.body.trim().split(/\r?\n\s*\r?\n/) : defaultBody
  doc.setFontSize(9.5)
  const lineHeight = 4.5
  let bodyEnd = 128
  for (const paragraph of bodyParagraphs) {
    bodyEnd = drawRichText(doc, paragraph, [
      'AWS Student Builder Group UPB Cbba',
      'AWS Student Community Day (SCD) Bolivia 2026',
    ], 18, bodyEnd, 174, lineHeight)
    bodyEnd += 1.5
  }
  if (bodyEnd > 177) throw new Error('El cuerpo personalizado es demasiado largo para una página.')


  doc.setFillColor('#FFFFFF')
  doc.setDrawColor(COLORS.line)
  doc.roundedRect(18, 179, 174, 41, 2, 2, 'FD')
  doc.setFillColor(COLORS.blue)
  doc.roundedRect(18, 179, 4, 41, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.ink)
  doc.setFontSize(8)
  doc.text('SÁBADO', 29, 191)
  doc.setTextColor(COLORS.navy)
  doc.setFontSize(19)
  doc.text('10 OCT', 29, 202)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.muted)
  doc.setFontSize(8)
  doc.text('2026', 29, 213)
  doc.setDrawColor(COLORS.line)
  doc.line(70, 185, 70, 213)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.blue)
  doc.setFontSize(7)
  doc.text('HORARIO', 79, 190)
  doc.setTextColor(COLORS.ink)
  doc.setFontSize(11)
  doc.text('09:00 – 17:30', 79, 199)
  doc.setTextColor(COLORS.blue)
  doc.setFontSize(7)
  doc.text('LUGAR', 79, 207)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.ink)
  doc.setFontSize(7.5)
  doc.text(['UPB Cochabamba', 'Campus Julio León Prado'], 79, 213, { lineHeightFactor: 1.15 })
  doc.addImage(qr, 'PNG', 162, 185, 25, 25)
  doc.setTextColor(COLORS.muted)
  doc.setFontSize(5.5)
  doc.text('ESCANEA PARA REGISTRARTE', 174.5, 215, { align: 'center' })

  doc.setTextColor(COLORS.ink)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Agradecemos su atención y esperamos sea parte de esta iniciativa.', 18, 234)
  doc.setFont('helvetica', 'bold')
  doc.text('Atentamente,', 18, 244)
  doc.text('AWS Student Builder Group UPB Cbba', 18, 252)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.muted)
  doc.text('Comité organizador', 18, 257)
  doc.setTextColor(COLORS.blue)
  doc.textWithLink('sbgcbba@upb.edu', 18, 263, { url: 'mailto:sbgcbba@upb.edu' })

  doc.setFillColor(COLORS.navy)
  doc.roundedRect(143, 227, 49, 31, 1.5, 1.5, 'F')
  doc.setTextColor(COLORS.cyan)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text('PARA MÁS INFORMACIÓN', 167.5, 237, { align: 'center' })
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(6.5)
  doc.textWithLink('bolivia.studentcommunity.day', 167.5, 247, { url: 'https://bolivia.studentcommunity.day/', align: 'center' })

  doc.setFillColor(COLORS.cyan)
  doc.rect(0, 275.5, 210, 1.5, 'F')
  doc.setFillColor(COLORS.navy)
  doc.rect(0, 277, 210, 20, 'F')
  doc.setTextColor('#FFFFFF')
  doc.setFontSize(7)
  doc.text('10 DE OCTUBRE DE 2026   •   COCHABAMBA', 18, 288)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT COMMUNITY DAY', 192, 288, { align: 'right' })

  return doc.output('blob')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
