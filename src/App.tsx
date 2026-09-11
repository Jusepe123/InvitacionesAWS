import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InvitationPreview } from './components/InvitationPreview'
import { readAgentRequest, type AgentRequest } from './lib/agent'
import { addManyToHistory, addToHistory, clearHistory, loadHistory } from './lib/history'
import { fromMarkdown, normalizeInvitation, toMarkdown } from './lib/markdown'
import { EMPTY_INVITATION, type HistoryEntry, type Invitation } from './types'

type Notice = { kind: 'success' | 'error'; message: string } | null

export default function App() {
  const agentRequest = useMemo<AgentRequest | null>(() => readAgentRequest(window.location.search), [])
  const initialInvitation = agentRequest?.invitations[0] ?? EMPTY_INVITATION
  const [invitation, setInvitation] = useState<Invitation>(initialInvitation)
  const [markdown, setMarkdown] = useState(() => toMarkdown(initialInvitation))
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'form' | 'markdown' | 'excel'>('form')
  const excelInput = useRef<HTMLInputElement>(null)
  const autoGenerationStarted = useRef(false)
  const title = useMemo(() => invitation.recipient || invitation.institution || 'Nueva invitación', [invitation])

  function update<K extends keyof Invitation>(key: K, value: Invitation[K]) {
    setInvitation((current) => {
      const next = { ...current, [key]: value }
      setMarkdown(toMarkdown(next))
      return next
    })
  }

  const generate = useCallback(async (invitationToUse = invitation, saveHistory = true) => {
    const normalized = normalizeInvitation(invitationToUse)
    if (!normalized.recipient && !normalized.institution) {
      throw new Error('Debes indicar un destinatario o una institución.')
    }
    const { createInvitationPdf, downloadBlob, pdfFilename } = await import('./lib/pdf')
    const blob = await createInvitationPdf(normalized)
    downloadBlob(blob, pdfFilename(normalized))
    if (saveHistory) setHistory(addToHistory(normalized))
  }, [invitation])

  async function generateBatch(invitations: Invitation[]) {
    const [{ default: JSZip }, { createInvitationPdf, downloadBlob, pdfFilename }] =
      await Promise.all([import('jszip'), import('./lib/pdf')])
    const zip = new JSZip()
    const filenameCounts = new Map<string, number>()
    for (const item of invitations) {
      const pdf = await createInvitationPdf(item)
      const baseFilename = pdfFilename(item)
      const duplicateCount = filenameCounts.get(baseFilename) ?? 0
      filenameCounts.set(baseFilename, duplicateCount + 1)
      const filename = duplicateCount === 0 ? baseFilename : baseFilename.replace(/\.pdf$/, '-' + (duplicateCount + 1) + '.pdf')
      zip.file(filename, pdf)
    }
    setHistory(addManyToHistory(invitations))
    downloadBlob(await zip.generateAsync({ type: 'blob' }), `invitaciones-scd-${invitations.length}.zip`)
  }

  useEffect(() => {
    if (!agentRequest || autoGenerationStarted.current) return
    autoGenerationStarted.current = true
    if (agentRequest.error) {
      setNotice({ kind: 'error', message: `Entrada de agente: ${agentRequest.error}` })
      return
    }
    if (!agentRequest.autoGenerate) {
      setNotice({ kind: 'success', message: 'Entrada de agente cargada. Revisa la vista previa y genera el PDF.' })
      return
    }
    setBusy(true)
    void (async () => {
      try {
        if (agentRequest.invitations.length === 1) {
          await generate(agentRequest.invitations[0])
          setNotice({ kind: 'success', message: 'PDF generado desde la entrada del agente.' })
        } else {
          await generateBatch(agentRequest.invitations)
          setNotice({ kind: 'success', message: `${agentRequest.invitations.length} PDFs generados en un ZIP desde la entrada del agente.` })
        }
      } catch (error) {
        setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'No se pudo generar la entrada del agente.' })
      } finally {
        setBusy(false)
      }
    })()
  }, [agentRequest, generate])

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
      const [{ parseWorkbook }] = await Promise.all([import('./lib/excel')])
      const invitations = await parseWorkbook(file)
      await generateBatch(invitations)
      setNotice({ kind: 'success', message: `${invitations.length} invitación(es) generadas en un ZIP.` })
      if (excelInput.current) excelInput.current.value = ''
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'No se pudo procesar el Excel.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleDownloadExcelTemplate() {
    setNotice(null)
    try {
      const { downloadExcelTemplate } = await import('./lib/excel')
      await downloadExcelTemplate()
    } catch {
      setNotice({ kind: 'error', message: 'No se pudo descargar la plantilla de Excel.' })
    }
  }
  function restore(entry: HistoryEntry) {
    const next: Invitation = { institution: entry.institution, recipient: entry.recipient, role: entry.role, greeting: entry.greeting, body: entry.body }
    setInvitation(next)
    setMarkdown(entry.markdown)
    setTab('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main data-agent-ready="true" data-agent-input={agentRequest ? 'url' : 'form'}>
      <header className="app-header">
        <div className="brand-mark"><img src="/assets/logo-white.png" alt="" /></div>
        <div><span>Generador de invitaciones</span><h1>SCD Bolivia 2026</h1></div>
        <a href="https://luma.com/r65j1ukn" target="_blank" rel="noreferrer">Ver registro ↗</a>
      </header>

      <section className="workspace">
        <aside className="editor-card">
          <div className="editor-heading"><div><span className="eyebrow">INVITACIÓN ACTUAL</span><h2>{title}</h2></div><span className="status-dot">Vista previa activa</span></div>
          <nav className="tabs" aria-label="Método de entrada" data-agent-control="input-method">
            <button className={tab === 'form' ? 'active' : ''} onClick={() => setTab('form')}>Formulario</button>
            <button className={tab === 'markdown' ? 'active' : ''} onClick={() => setTab('markdown')}>Markdown</button>
            <button className={tab === 'excel' ? 'active' : ''} onClick={() => setTab('excel')}>Excel masivo</button>
          </nav>

          {tab === 'form' && <div className="form-grid">
            <label>Institución <span className="optional">Opcional para personas</span><input id="institution" data-agent-field="institution" value={invitation.institution} onChange={(event) => update('institution', event.target.value)} placeholder="Universidad o empresa" /></label>
            <label>Destinatario <span className="optional">Opcional para instituciones</span><input id="recipient" data-agent-field="recipient" value={invitation.recipient} onChange={(event) => update('recipient', event.target.value)} placeholder="Ing. Valeria Fernández" /></label>
            <label>Cargo <span className="optional">Opcional</span><input id="role" data-agent-field="role" value={invitation.role} onChange={(event) => update('role', event.target.value)} placeholder="Directora de Innovación" /></label>
            <label>Saludo <input id="greeting" data-agent-field="greeting" value={invitation.greeting} onChange={(event) => update('greeting', event.target.value)} placeholder="De nuestra mayor consideración:" /></label>
            <label className="body-field">Cuerpo personalizado <span className="optional">Opcional; un párrafo por línea en blanco</span><textarea id="body" data-agent-field="body" value={invitation.body} onChange={(event) => update('body', event.target.value)} placeholder="Escribe aquí el texto personalizado de la invitación." rows={6} /></label>
            <p className="form-hint">Indica al menos una institución o un destinatario.</p>
          </div>}

          {tab === 'markdown' && <div className="markdown-panel"><p>Pega un archivo con metadatos YAML. Usa <code>cuerpo:</code> para reemplazar el texto del evento; separa párrafos con <code>\\n</code>.</p><textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} spellCheck={false} /><button className="secondary" onClick={applyMarkdown}>Aplicar Markdown</button></div>}

          {tab === 'excel' && <div className="excel-panel"><div className="drop-zone" onClick={() => excelInput.current?.click()}><strong>Importar invitaciones desde Excel</strong><span>Columnas: institucion, destinatario, cargo, saludo y cuerpo. Cada fila debe incluir institución o destinatario.</span><button className="secondary" type="button">Seleccionar .xlsx</button><input ref={excelInput} type="file" accept=".xlsx" onChange={(event) => void handleExcel(event.target.files?.[0])} hidden /></div><button className="link-button" onClick={() => void handleDownloadExcelTemplate()}>↓ Descargar plantilla de Excel</button></div>}

          {notice && <div className={`notice ${notice.kind}`} role="status" aria-live="polite" data-agent-status>{notice.message}</div>}
          <button className="primary" data-agent-action="generate-pdf" disabled={busy} onClick={() => void handleGenerate()}>{busy ? 'Generando…' : 'Generar PDF'} <span>→</span></button>
          <p className="privacy-note">Todo se procesa en este navegador. No se envían datos personales a un servidor.</p>
        </aside>

        <section className="preview-panel"><div className="preview-toolbar"><div><span className="eyebrow">VISTA PREVIA</span><b>Documento A4 · 1 página</b></div><span>210 × 297 mm</span></div><div className="paper-stage"><InvitationPreview invitation={invitation} /></div></section>
      </section>

      <section className="history-section">
        <div className="section-title"><div><span className="eyebrow">EN ESTE DISPOSITIVO</span><h2>Invitaciones recientes</h2></div>{history.length > 0 && <button className="link-button danger" onClick={() => { clearHistory(); setHistory([]) }}>Borrar historial</button>}</div>
        {history.length === 0 ? <div className="empty-state">Las invitaciones generadas aparecerán aquí para poder recuperar sus datos.</div> : <div className="history-grid">{history.map((entry) => <article key={entry.id}><span>{entry.recipient ? 'PERSONALIZADA' : 'INSTITUCIONAL'}</span><h3>{entry.recipient || entry.institution}</h3>{entry.recipient && entry.institution && <p>{entry.institution}</p>}<time>{new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</time><div><button onClick={() => restore(entry)}>Editar</button><button onClick={() => void generate(entry, false)}>PDF</button></div></article>)}</div>}
      </section>
    </main>
  )
}
