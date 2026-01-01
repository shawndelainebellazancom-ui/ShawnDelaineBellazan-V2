$ErrorActionPreference = 'Stop'

$root = Get-Location
$files = Get-ChildItem -File -Filter '*.html' | Sort-Object Name

function Get-LinksFromHtml([string]$html) {
  $links = New-Object System.Collections.Generic.List[string]

  foreach ($m in [regex]::Matches($html, '(?is)\b(?:href|src)\s*=\s*"([^"]*)"')) {
    $links.Add($m.Groups[1].Value)
  }

  foreach ($m in [regex]::Matches($html, "(?is)\b(?:href|src)\s*=\s*'([^']*)'")) {
    $links.Add($m.Groups[1].Value)
  }

  return $links | Where-Object { $_ -and $_.Trim() -ne '' }
}

function Has-Id([string]$html, [string]$id) {
  if ([string]::IsNullOrWhiteSpace($id)) { return $false }
  $safe = [regex]::Escape($id)
  return [regex]::IsMatch($html, "(?is)\bid\s*=\s*`"$safe`"") -or [regex]::IsMatch($html, "(?is)\bid\s*=\s*'$safe'")
}

$issues = New-Object System.Collections.Generic.List[object]

foreach ($f in $files) {
  $html = Get-Content -Raw -LiteralPath $f.FullName
  $links = Get-LinksFromHtml $html

  foreach ($hrefRaw in $links) {
    $href = ($hrefRaw ?? '').Trim()
    if (-not $href) { continue }

    if ($href.StartsWith('http://') -or $href.StartsWith('https://') -or $href.StartsWith('mailto:') -or $href.StartsWith('tel:') -or $href.StartsWith('javascript:')) { continue }

    # In-page anchors
    if ($href.StartsWith('#')) {
      $id = $href.Substring(1)
      if ($id -and -not (Has-Id $html $id)) {
        $issues.Add([pscustomobject]@{ file = $f.Name; type = 'missing_anchor'; link = $href; detail = "id='$id' not found in file" })
      }
      continue
    }

    # Split file and fragment
    $parts = $href.Split('#', 2)
    $path = $parts[0]
    $frag = if ($parts.Count -gt 1) { $parts[1] } else { $null }

    # ignore query string for file existence check
    $pathNoQuery = ($path -split '\?', 2)[0]
    if ([string]::IsNullOrWhiteSpace($pathNoQuery)) { continue }

    $targetPath = Join-Path $root $pathNoQuery
    if (-not (Test-Path -LiteralPath $targetPath)) {
      $issues.Add([pscustomobject]@{ file = $f.Name; type = 'missing_file'; link = $href; detail = "target '$pathNoQuery' not found" })
      continue
    }

    if ($frag -and $pathNoQuery.ToLower().EndsWith('.html')) {
      $targetHtml = Get-Content -Raw -LiteralPath $targetPath
      if (-not (Has-Id $targetHtml $frag)) {
        $issues.Add([pscustomobject]@{ file = $f.Name; type = 'missing_target_anchor'; link = $href; detail = "target '$pathNoQuery' missing id='$frag'" })
      }
    }
  }
}

$issues | Sort-Object file, type | Format-Table -AutoSize
Write-Host ""
Write-Host "TOTAL_ISSUES: $($issues.Count)"
Write-Host "FILES_SCANNED: $($files.Count)"


