$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repo = 'C:\Users\calli\Desktop\ScamScanned'
$site = 'C:\Users\calli\Desktop\ScamScanned Website files'
New-Item -ItemType Directory -Force -Path "$repo\icons", "$repo\brand", "$site\assets" | Out-Null

$bg     = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)     # #0F172A tile surface
$bgDeep = [System.Drawing.Color]::FromArgb(255, 2, 6, 23)       # #020617 site background
$green  = [System.Drawing.Color]::FromArgb(255, 16, 185, 129)   # #10B981 site accent
$white  = [System.Drawing.Color]::White
$dim    = [System.Drawing.Color]::FromArgb(255, 148, 163, 184)  # #94A3B8 muted slate

function Draw-BrandIcon {
    param([System.Drawing.Graphics]$g, [int]$size)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Rounded dark tile (works on light AND dark toolbars)
    $r = 0.21 * $size
    $tile = New-Object System.Drawing.Drawing2D.GraphicsPath
    $tile.AddArc(0, 0, $r, $r, 180, 90)
    $tile.AddArc(($size - $r), 0, $r, $r, 270, 90)
    $tile.AddArc(($size - $r), ($size - $r), $r, $r, 0, 90)
    $tile.AddArc(0, ($size - $r), $r, $r, 90, 90)
    $tile.CloseFigure()
    $tileBrush = New-Object System.Drawing.SolidBrush($bg)
    $g.FillPath($tileBrush, $tile)

    # Shield (filled green), classic badge silhouette
    $cx = 0.50 * $size; $top = 0.235 * $size; $tip = 0.805 * $size; $hw = 0.285 * $size
    $p0  = New-Object System.Drawing.PointF(($cx - $hw), $top)
    $p1  = New-Object System.Drawing.PointF(($cx + $hw), $top)
    $tipP = New-Object System.Drawing.PointF($cx, $tip)
    $shield = New-Object System.Drawing.Drawing2D.GraphicsPath
    $shield.AddBezier($p0,
        (New-Object System.Drawing.PointF(($cx - 0.18 * $hw), ($top - 0.035 * $size))),
        (New-Object System.Drawing.PointF(($cx + 0.18 * $hw), ($top - 0.035 * $size))),
        $p1)
    $shield.AddBezier($p1,
        (New-Object System.Drawing.PointF(($cx + 0.99 * $hw), ($top + 0.30 * $size))),
        (New-Object System.Drawing.PointF(($cx + 0.55 * $hw), ($tip - 0.28 * $size))),
        $tipP)
    $shield.AddBezier($tipP,
        (New-Object System.Drawing.PointF(($cx - 0.55 * $hw), ($tip - 0.28 * $size))),
        (New-Object System.Drawing.PointF(($cx - 0.99 * $hw), ($top + 0.30 * $size))),
        $p0)
    $shield.CloseFigure()
    $shieldBrush = New-Object System.Drawing.SolidBrush($green)
    $g.FillPath($shieldBrush, $shield)

    # Check mark, knocked out in tile color
    $pts = @(
        (New-Object System.Drawing.PointF((0.362 * $size), (0.512 * $size))),
        (New-Object System.Drawing.PointF((0.462 * $size), (0.616 * $size))),
        (New-Object System.Drawing.PointF((0.665 * $size), (0.392 * $size)))
    )
    $check = New-Object System.Drawing.Pen($bg, [float](0.088 * $size))
    $check.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $check.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round
    $check.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawLines($check, $pts)
    $check.Dispose()
}

function New-IconFile {
    param([string]$path, [int]$size)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    Draw-BrandIcon -g $g -size $size
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

# Extension icon suite (scales directly to each size for crisp strokes)
New-IconFile "$repo\icons\icon16.png"  16
New-IconFile "$repo\icons\icon32.png"  32
New-IconFile "$repo\icons\icon48.png"  48
New-IconFile "$repo\icons\icon128.png" 128
New-IconFile "$repo\brand\scamscanned-icon-master.png" 1024

# Social share card 1200x630 (ASCII-only strings: PS 5.1 reads files as ANSI)
$card = New-Object System.Drawing.Bitmap(1200, 630)
$g = [System.Drawing.Graphics]::FromImage($card)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear($bgDeep)
$g.FillRectangle((New-Object System.Drawing.SolidBrush($green)), 0, 0, 1200, 6)

# Icon tile on the left, rendered at 300
$tmp = New-Object System.Drawing.Bitmap(300, 300)
$gt = [System.Drawing.Graphics]::FromImage($tmp)
Draw-BrandIcon -g $gt -size 300
$gt.Dispose()
$g.DrawImage($tmp, 96, 165, 300, 300)
$tmp.Dispose()

# Shrink-to-fit helper: never let a line cross the right margin
function Draw-FitLine {
    param([System.Drawing.Graphics]$g, [string]$text, [System.Drawing.FontStyle]$style, [double]$startPt,
          [System.Drawing.Brush]$brush, [double]$x, [double]$y, [double]$maxW)
    $fs = $startPt
    while ($fs -gt 16) {
        $probe = New-Object System.Drawing.Font('Segoe UI', $fs, $style)
        $w = $g.MeasureString($text, $probe).Width
        $probe.Dispose()
        if ($w -le $maxW) { break }
        $fs -= 2
    }
    Draw-StringHelper -g $g -text $text -pt $fs -style $style -brush $brush -x $x -y $y
}
function Draw-StringHelper {
    param([System.Drawing.Graphics]$g, [string]$text, [double]$pt, [System.Drawing.FontStyle]$style,
          [System.Drawing.Brush]$brush, [double]$x, [double]$y)
    $f = New-Object System.Drawing.Font('Segoe UI', $pt, $style)
    $g.DrawString($text, $f, $brush, $x, $y)
    $f.Dispose()
}

# Text column: x=440, budget to right margin = 1200 - 440 - 36
$textX = 440; $budget = 1200 - $textX - 36
$title = 'ScamScanned'
Draw-FitLine -g $g -text $title -style ([System.Drawing.FontStyle]::Bold) -startPt 88 -brush (New-Object System.Drawing.SolidBrush($white)) -x $textX -y 170 -maxW $budget
Draw-FitLine -g $g -text 'Warns about risky listings before you buy.' -style ([System.Drawing.FontStyle]::Regular) -startPt 34 -brush (New-Object System.Drawing.SolidBrush($dim)) -x $textX -y 315 -maxW $budget
Draw-FitLine -g $g -text 'Amazon | Walmart | eBay | Etsy | Local trade' -style ([System.Drawing.FontStyle]::Regular) -startPt 30 -brush (New-Object System.Drawing.SolidBrush($green)) -x $textX -y 405 -maxW $budget
$g.Dispose()
$card.Save("$site\assets\scamscanned-og.png", [System.Drawing.Imaging.ImageFormat]::Png)
$card.Save("$repo\brand\scamscanned-og.png", [System.Drawing.Imaging.ImageFormat]::Png)
$card.Dispose()

# Verify
Get-ChildItem "$repo\icons\*.png", "$repo\brand\*.png", "$site\assets\scamscanned-og.png" | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    Write-Output ("{0}  {1}x{2}  {3} bytes" -f $_.Name, $img.Width, $img.Height, $_.Length)
    $img.Dispose()
}
