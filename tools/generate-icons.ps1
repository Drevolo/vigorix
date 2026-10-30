# Gera os icones do PWA (rodar da raiz do projeto)
Add-Type -AssemblyName System.Drawing

function New-Icon {
  param([int]$Size, [string]$Path, [bool]$Maskable)

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.ColorTranslator]::FromHtml('#7c3fff'),
    [System.Drawing.ColorTranslator]::FromHtml('#22d3ee'),
    45.0
  )

  if ($Maskable) {
    $g.FillRectangle($brush, $rect)
  } else {
    $radius = [int]($Size * 0.22)
    $d = $radius * 2
    $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $gp.AddArc(0, 0, $d, $d, 180, 90)
    $gp.AddArc($Size - $d, 0, $d, $d, 270, 90)
    $gp.AddArc($Size - $d, $Size - $d, $d, $d, 0, 90)
    $gp.AddArc(0, $Size - $d, $d, $d, 90, 90)
    $gp.CloseFigure()
    $g.FillPath($brush, $gp)
    $gp.Dispose()
  }

  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [float]($Size * 0.105))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $cx = $Size / 2.0
  $top = $Size * 0.33
  $bottom = $Size * 0.69
  $half = $Size * 0.17

  $g.DrawLine($pen, [float]($cx - $half), [float]$top, [float]$cx, [float]$bottom)
  $g.DrawLine($pen, [float]$cx, [float]$bottom, [float]($cx + $half), [float]$top)

  $pen.Dispose()
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

if (-not (Test-Path 'assets/icons')) { New-Item -ItemType Directory -Path 'assets/icons' | Out-Null }

New-Icon -Size 512 -Path 'assets/icons/icon-512.png' -Maskable $false
New-Icon -Size 192 -Path 'assets/icons/icon-192.png' -Maskable $false
New-Icon -Size 512 -Path 'assets/icons/icon-maskable-512.png' -Maskable $true

Get-ChildItem 'assets/icons' | Select-Object Name, Length
