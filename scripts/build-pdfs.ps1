$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$samplesPath = Join-Path $projectRoot 'samples'
New-Item -ItemType Directory -Path $samplesPath -Force | Out-Null

$variants = @(
  @{ Source = 'preview-institucion.tex'; Job = 'latex-build-institucion'; Output = 'Invitacion-SCD-institucion' },
  @{ Source = 'preview-persona.tex'; Job = 'latex-build-persona'; Output = 'Invitacion-SCD-persona' }
)

Push-Location $projectRoot
try {
  foreach ($variant in $variants) {
    1..2 | ForEach-Object {
      & pdflatex --disable-installer -interaction=nonstopmode -halt-on-error "-jobname=$($variant.Job)" $variant.Source
      if ($LASTEXITCODE -ne 0) {
        throw "La compilación falló para $($variant.Source)."
      }
    }

    $sourcePdf = Join-Path $projectRoot "$($variant.Job).pdf"
    $targetPdf = Join-Path $samplesPath "$($variant.Output).pdf"
    Move-Item -LiteralPath $sourcePdf -Destination $targetPdf -Force

    $previewBase = Join-Path $samplesPath $variant.Output
    & pdftoppm -png -f 1 -singlefile -r 120 $targetPdf $previewBase
    if ($LASTEXITCODE -ne 0) {
      throw "No se pudo crear la vista PNG para $($variant.Source)."
    }

    foreach ($extension in 'aux', 'log', 'out', 'synctex.gz') {
      $artifact = Join-Path $projectRoot "$($variant.Job).$extension"
      if (Test-Path -LiteralPath $artifact) {
        Remove-Item -LiteralPath $artifact -Force
      }
    }
  }
}
finally {
  Pop-Location
}

Write-Host 'Muestras PDF y PNG generadas en samples/.'
