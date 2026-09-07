# Generador de invitaciones SCD Bolivia 2026

Aplicación web estática para crear invitaciones institucionales y personalizadas del AWS Student Community Day Bolivia 2026. Genera PDF A4 en el navegador, admite carga masiva desde Excel y conserva un historial local sin enviar datos personales a un servidor.

## Desarrollo

Requiere Node.js 20 o superior.

```powershell
npm install
npm run dev
npm run check
```

`npm run check` ejecuta ESLint y construye la versión de producción en `dist/`. AWS Amplify usa `amplify.yml` para ejecutar `npm ci` y `npm run build`.

## Entradas admitidas

- Formulario: institución y, opcionalmente, destinatario y cargo.
- Markdown: metadatos `institucion`, `destinatario`, `cargo` y `saludo`.
- Excel: archivo `.xlsx` de hasta 5 MB y 100 filas. La aplicación ofrece una plantilla descargable con las columnas correctas.

La carga masiva descarga un ZIP con un PDF por invitación. El historial se guarda únicamente en `localStorage` del dispositivo.

## Muestras LaTeX

La plantilla de referencia está en `invitation-template.tex`. Para reconstruir las variantes visuales en `samples/`, instala MiKTeX y Poppler y ejecuta:

```powershell
npm run pdf:build
```

Los archivos `samples/Invitacion-SCD-institucion.pdf` y `samples/Invitacion-SCD-persona.pdf` permiten revisar el diseño sin iniciar la aplicación.

## Datos fijos del evento

- Fecha: 10 de octubre de 2026, 09:00–17:30
- Lugar: UPB Cochabamba, Campus Julio León Prado
- Registro: https://luma.com/r65j1ukn
- Contacto: sbgcbba@upb.edu
