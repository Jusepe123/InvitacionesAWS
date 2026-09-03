import type { Invitation } from '../types'

export function InvitationPreview({ invitation }: { invitation: Invitation }) {
  const personalized = Boolean(invitation.recipient.trim())
  const displayName = personalized ? invitation.recipient : invitation.institution
  const subtitle = personalized
    ? [invitation.role, invitation.institution].filter(Boolean).join(' · ')
    : 'A quien corresponda'

  return (
    <article className="paper" aria-label="Vista previa de la invitación">
      <header className="paper-hero">
        <img className="paper-logo" src="/assets/logo-white.png" alt="AWS Student Builder Group UPB Cbba" />
        <div className="paper-brand"><strong>AWS STUDENT BUILDER GROUP</strong><span>UPB COCHABAMBA</span></div>
        <div className="paper-type">I N V I T A C I Ó N&nbsp;&nbsp; {personalized ? 'P E R S O N A L I Z A D A' : 'I N S T I T U C I O N A L'}</div>
      </header>
      <div className="paper-body">
        <section className="paper-recipient">
          <span>{personalized ? 'INVITACIÓN PERSONALIZADA' : 'INVITACIÓN DIRIGIDA A'}</span>
          <h2>{displayName}</h2>
          <p>{subtitle}</p>
        </section>
        <section className="paper-copy">
          <p>{invitation.greeting}</p>
          <p>El <strong>AWS Student Builder Group UPB Cbba</strong> tiene el agrado de invitarle al <strong>AWS Student Community Day (SCD) Bolivia 2026</strong>, una jornada creada para reunir a estudiantes interesados en tecnología y computación en la nube.</p>
          <p>Durante la jornada, los asistentes podrán ampliar su perspectiva sobre el ecosistema tecnológico, descubrir nuevas posibilidades de la nube y conectar con estudiantes que comparten el interés por aprender, crear y transformar ideas en proyectos. Nos encantaría contar con la participación de su institución.</p>
        </section>
        <section className="event-card">
          <div><small>SÁBADO</small><strong>10 OCT</strong><span>2026</span></div>
          <div><small>HORARIO</small><b>09:00 – 17:30</b><small>LUGAR</small><span>UPB Cochabamba<br />Campus Julio León Prado</span></div>
          <div className="qr-placeholder"><span>QR</span><small>ESCANEA PARA REGISTRARTE</small></div>
        </section>
        <section className="paper-closing">
          <div><p>Agradecemos su atención y esperamos darle la bienvenida en esta jornada.</p><strong>Atentamente,</strong><b>AWS Student Builder Group UPB Cbba</b><span>Comité organizador</span><a href="mailto:sbgcbba@upb.edu">sbgcbba@upb.edu</a></div>
          <a className="registration-card" href="https://luma.com/r65j1ukn" target="_blank" rel="noreferrer"><small>INSCRIPCIONES ABIERTAS</small><strong>luma.com/r65j1ukn</strong></a>
        </section>
      </div>
      <footer><span>10 DE OCTUBRE DE 2026&nbsp;&nbsp; • &nbsp;&nbsp;COCHABAMBA</span><strong>STUDENT COMMUNITY DAY</strong></footer>
    </article>
  )
}
