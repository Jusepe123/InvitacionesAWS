import { useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { InvitationPreview } from './components/InvitationPreview'
import { downloadExcelTemplate, parseWorkbook } from './lib/excel'
import { addToHistory, clearHistory, loadHistory } from './lib/history'
import { fromMarkdown, normalizeInvitation, toMarkdown } from './lib/markdown'
import { createInvitationPdf, downloadBlob, pdfFilename } from './lib/pdf'
import { EMPTY_INVITATION, type HistoryEntry, type Invitation } from './types'

type Notice = { kind: 'success' | 'error'; message: string } | null

export default function App() {
  const [invitation, setInvitation] = useState<Invitation>(EMPTY_INVITATION)
  const [markdown, setMarkdown] = useState(() => toMarkdown(EMPTY_INVITATION))
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'form' | 'markdown' | 'excel'>('form')
  const excelInput = useRef<HTMLInputElement>(null)
  const title = useMemo(() => invitation.recipient || invitation.institution || 'Nueva invitación', [invitation])

  function update<K extends keyof Invitation>(key: K, value: Invitation[K]) {
    setInvitation((current) => {
      const next = { ...current, [key]: value }
      setMarkdown(toMarkdown(next))
      return next
    })
  }

  async function generate(invitationToUse = invitation, saveHistory = true) {
    const normalized = normalizeInvitation(invitationToUse)
    if (!normalized.institution) throw new Error('Debes indicar el nombre de la institución.')
    const blob = await createInvitationPdf(normalized)
    downloadBlob(blob, pdfFilename(normalized))
    if (saveHistory) setHistory(addToHistory(normalized))
  }

  async function handleGenerate() {
    setBusy(true)
    setNotice(null)
    try {
      await generate()
      setNotice({ kind: 'success', message: 'PDF generado correctamente.' })
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'No se pudo generar el PDF.' })
    } finally {
      setBusy(false)
    }
  }

  function applyMarkdown() {
    try {
      const next = fromMarkdown(markdown, invitation)
      setInvitation(next)
      setMarkdown(toMarkdown(next))
      setNotice({ kind: 'success', message: 'Markdown aplicado a la vista previa.' })
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Markdown no válido.' })
    }
  }

  async function handleExcel(file?: File) {
    if (!file) return
    setBusy(true)
    setNotice(null)
    try {
      const invitations = await parseWorkbook(file)
      const zip = new JSZip()
      for (const item of invitations) {
        const pdf = await createInvitationPdf(item)
        zip.file(pdfFilename(item), pdf)
        setHistory(addToHistory(item))
      }
      downloadBlob(await zip.generateAsync({ type: 'blob' }), `invitaciones-scd-${invitations.length}.zip`)
      setNotice({ kind: 'success', message: `${invitations.length} invitación(es) generadas en un ZIP.` })
      if (excelInput.current) excelInput.current.value = ''
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'No se pudo procesar el Excel.' })
    } finally {
      setBusy(false)
    }
  }

  function restore(entry: HistoryEntry) {
    const next: Invitation = { institution: entry.institution, recipient: entry.recipient, role: entry.role, greeting: entry.greeting }
    setInvitation(next)
    setMarkdown(entry.markdown)
    setTab('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main>
      <header className="app-header">
        <div className="brand-mark"><img src="/assets/logo-white.png" alt="" /></div>
        <div><span>Generador de invitaciones</span><h1>SCD Bolivia 2026</h1></div>
        <a href="https://luma.com/r65j1ukn" target="_blank" rel="noreferrer">Ver registro ↗</a>
      </header>

      <section className="workspace">
        <aside className="editor-card">
          <div className="editor-heading"><div><span className="eyebrow">INVITACIÓN ACTUAL</span><h2>{title}</h2></div><span className="status-dot">Vista previa activa</span></div>
          <nav className="tabs" aria-label="Método de entrada">
            <button className={tab === 'form' ? 'active' : ''} onClick={() => setTab('form')}>Formulario</button>
            <button className={tab === 'markdown' ? 'active' : ''} onClick={() => setTab('markdown')}>Markdown</button>
            <button className={tab === 'excel' ? 'active' : ''} onClick={() => setTab('excel')}>Excel masivo</button>
          </nav>

          {tab === 'form' && <div className="form-grid">
            <label>Institución <input value={invitation.institution} onChange={(event) => update('institution', event.target.value)} placeholder="Universidad o empresa" /></label>
            <label>Destinatario <span className="optional">Opcional</span><input value={invitation.recipient} onChange={(event) => update('recipient', event.target.value)} placeholder="Ing. Valeria Fernández" /></label>
            <label>Cargo <span className="optional">Opcional</span><input value={invitation.role} onChange={(event) => update('role', event.target.value)} placeholder="Directora de Innovación" /></label>
            <label>Saludo <input value={invitation.greeting} onChange={(event) => update('greeting', event.target.value)} placeholder="De nuestra mayor consideración:" /></label>
          </div>}

          {tab === 'markdown' && <div className="markdown-panel"><p>Pega un archivo con metadatos YAML. El texto del evento permanece protegido por la plantilla.</p><textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} spellCheck={false} /><button className="secondary" onClick={applyMarkdown}>Aplicar Markdown</button></div>}

          {tab === 'excel' && <div className="excel-panel"><div className="drop-zone" onClick={() => excelInput.current?.click()}><strong>Importar invitaciones desde Excel</strong><span>Columnas: institucion, destinatario, cargo y saludo</span><button className="secondary" type="button">Seleccionar .xlsx</button><input ref={excelInput} type="file" accept=".xlsx,.xls" onChange={(event) => void handleExcel(event.target.files?.[0])} hidden /></div><button className="link-button" onClick={downloadExcelTemplate}>↓ Descargar plantilla de Excel</button></div>}

          {notice && <div className={`notice ${notice.kind}`}>{notice.message}</div>}
          <button className="primary" disabled={busy} onClick={() => void handleGenerate()}>{busy ? 'Generando…' : 'Generar PDF'} <span>→</span></button>
          <p className="privacy-note">Todo se procesa en este navegador. No se envían datos personales a un servidor.</p>
        </aside>

        <section className="preview-panel"><div className="preview-toolbar"><div><span className="eyebrow">VISTA PREVIA</span><b>Documento A4 · 1 página</b></div><span>210 × 297 mm</span></div><div className="paper-stage"><InvitationPreview invitation={invitation} /></div></section>
      </section>

      <section className="history-section">
        <div className="section-title"><div><span className="eyebrow">EN ESTE DISPOSITIVO</span><h2>Invitaciones recientes</h2></div>{history.length > 0 && <button className="link-button danger" onClick={() => { clearHistory(); setHistory([]) }}>Borrar historial</button>}</div>
        {history.length === 0 ? <div className="empty-state">Las invitaciones generadas aparecerán aquí para poder recuperar sus datos.</div> : <div className="history-grid">{history.map((entry) => <article key={entry.id}><span>{entry.recipient ? 'PERSONALIZADA' : 'INSTITUCIONAL'}</span><h3>{entry.recipient || entry.institution}</h3>{entry.recipient && <p>{entry.institution}</p>}<time>{new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</time><div><button onClick={() => restore(entry)}>Editar</button><button onClick={() => void generate(entry, false)}>PDF</button></div></article>)}</div>}
      </section>
    </main>
  )
}
