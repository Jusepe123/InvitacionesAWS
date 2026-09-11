import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { Invitation } from '../types'

export function InvitationPreview({ invitation }: { invitation: Invitation }) {
  const [qrCode, setQrCode] = useState('')
  const personalized = Boolean(invitation.recipient.trim())
  const displayName = personalized ? invitation.recipient : invitation.institution
  const subtitle = personalized
    ? [invitation.role, invitation.institution].filter(Boolean).join(' · ')
    : 'A quien corresponda'
  const participationClosing = personalized
    ? 'Nos encantaría contar con su participación.'
    : 'Nos encantaría contar con la participación de su institución.'
  const defaultBody = [
    'El AWS Student Builder Group UPB Cbba tiene el agrado de invitarle al AWS Student Community Day (SCD) Bolivia 2026, el primer evento internacional de la comunidad estudiantil de Amazon en Bolivia, será una jornada creada para reunir a estudiantes interesados en tecnología y computación en la nube.',
    `Durante la jornada, los asistentes podrán ampliar su perspectiva sobre el ecosistema tecnológico, descubrir nuevas posibilidades de la nube y conectar con estudiantes que comparten el interés por aprender, crear y transformar ideas en proyectos. ${participationClosing}`,
  ]
  const bodyParagraphs = invitation.body.trim() ? invitation.body.trim().split(/\r?\n\s*\r?\n/) : defaultBody

  useEffect(() => {
    let active = true
    void QRCode.toDataURL('https://luma.com/r65j1ukn', { margin: 0, width: 180, errorCorrectionLevel: 'M' }).then((dataUrl) => {
      if (active) setQrCode(dataUrl)
    })
    return () => { active = false }
  }, [])

  return (
    <article className="paper" aria-label="Vista previa de la invitación">
      <header className="paper-hero">
        <img className="paper-logo" src="/assets/logo-white.png" alt="AWS Student Builder Group UPB Cbba" />
        <div className="paper-brand"><strong>AWS STUDENT BUILDER GROUP</strong><span>UPB COCHABAMBA</span></div>
      </header>
      <div className="paper-body">
        <section className="paper-recipient"><h2>{displayName}</h2>{subtitle && <p>{subtitle}</p>}</section>
        <section className="paper-copy"><p>{invitation.greeting}</p>{bodyParagraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>)}</section>
        <section className="event-card">
          <div><small>SÁBADO</small><strong>10 OCT</strong><span>2026</span></div>
          <div><small>HORARIO</small><b>09:00 – 17:30</b><small>LUGAR</small><span>UPB Cochabamba<br />Campus Julio León Prado</span></div>
          <div className="qr-placeholder">{qrCode && <img src={qrCode} alt="Código QR para el registro en Luma" />}<small>ESCANEA PARA REGISTRARTE</small></div>
        </section>
        <section className="paper-closing"><div><p>Agradecemos su atención y esperamos sea parte de esta iniciativa.</p><strong>Atentamente,</strong><b>AWS Student Builder Group UPB Cbba</b><span>Comité organizador</span><a href="mailto:sbgcbba@upb.edu">sbgcbba@upb.edu</a></div><a className="registration-card" href="https://bolivia.studentcommunity.day/" target="_blank" rel="noreferrer"><small>PARA MÁS INFORMACIÓN</small><strong>bolivia.studentcommunity.day</strong></a></section>
      </div>
      <footer><span>10 DE OCTUBRE DE 2026&nbsp;&nbsp; • &nbsp;&nbsp;COCHABAMBA</span><strong>STUDENT COMMUNITY DAY</strong></footer>
    </article>
  )
}
