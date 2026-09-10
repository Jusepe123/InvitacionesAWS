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

- Formulario: institución o destinatario; para invitaciones personales la institución y el cargo son opcionales.
- Markdown: metadatos `institucion`, `destinatario`, `cargo` y `saludo`.
- Excel: archivo `.xlsx` de hasta 5 MB y 100 filas. La aplicación ofrece una plantilla descargable con las columnas correctas.

Una invitación se considera personal cuando incluye destinatario, aunque no tenga institución. Si no incluye destinatario, debe indicar una institución.

La carga masiva descarga un ZIP con un PDF por invitación. El historial se guarda únicamente en `localStorage` del dispositivo.

## Integración con agentes (Hermes)

La aplicación tiene un contrato URL para que un agente de navegador pueda cargar datos sin localizar controles por posición. Todos los valores deben ir codificados con `encodeURIComponent`.

Para una invitación:

```text
https://main.d3k95upxnl3mtv.amplifyapp.com/?institution=Universidad%20Ejemplo&recipient=Dra.%20Mar%C3%ADa%20P%C3%A9rez&role=Directora%20de%20Innovaci%C3%B3n&generate=1
```

También acepta JSON en `input`, como objeto único o como arreglo de hasta 100 objetos. Los nombres preferidos son `institution`, `recipient`, `role` y `greeting`; también se aceptan sus equivalentes en español.

```js
const input = encodeURIComponent(JSON.stringify([
  { institution: 'Universidad Ejemplo', recipient: 'Dra. María Pérez', role: 'Directora de Innovación' },
  { institution: 'Empresa Ejemplo' },
]))
const url = `https://main.d3k95upxnl3mtv.amplifyapp.com/?input=${input}&generate=1`
```

`generate=1` descarga automáticamente un PDF para una invitación o un ZIP para un lote. Sin `generate=1`, los datos se cargan en la vista previa para que el agente pueda revisarlos antes de pulsar `button[data-agent-action="generate-pdf"]`. Hermes puede esperar `[data-agent-status]` y comprobar `main[data-agent-ready="true"]` para confirmar el resultado.

Los datos incluidos en la URL pueden quedar registrados en el historial del navegador y en logs del agente; para datos personales sensibles, usar la carga local de Excel o Markdown.

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
