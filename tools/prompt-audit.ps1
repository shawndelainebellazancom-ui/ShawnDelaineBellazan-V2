$ErrorActionPreference = 'Stop'

$html = Get-Content -Raw -LiteralPath 'pmcro-prompt-library.html'
$blocks = [regex]::Matches($html, '(?is)<pre><code[^>]*class="language-markdown"[^>]*>(.*?)</code></pre>')

$rows = New-Object System.Collections.Generic.List[object]

for ($i = 0; $i -lt $blocks.Count; $i++) {
  $b = $blocks[$i].Groups[1].Value
  $title = ($b -split "`n")[0].Trim()

  $rows.Add([pscustomobject]@{
    idx        = $i + 1
    title      = $title
    identity   = [regex]::IsMatch($b, '(?m)^#\s*IDENTITY:')
    meta       = [regex]::IsMatch($b, '(?m)^@meta\b')
    constraints= [regex]::IsMatch($b, '(?m)^@constraints\b')
    bip        = [regex]::IsMatch($b, '(?m)^@bip_logic\b')
    evidence   = [regex]::IsMatch($b, '(?is)Evidence\s*or\s*Disclaimer|No external validation performed')
    tool_gating= [regex]::IsMatch($b, '(?is)If\s+tools\s+unavailable|assume\s+NO\s+TOOLS|tooling_available')
  })
}

$rows | Format-Table -AutoSize
Write-Host ""
Write-Host ("TOTAL_PROMPTS: {0}" -f $rows.Count)
Write-Host ("MISSING_IDENTITY: {0}" -f (@($rows | Where-Object { -not $_.identity })).Count)
Write-Host ("MISSING_EVIDENCE_RULE: {0}" -f (@($rows | Where-Object { -not $_.evidence })).Count)
Write-Host ("MISSING_TOOL_GATING: {0}" -f (@($rows | Where-Object { -not $_.tool_gating })).Count)
Write-Host ("MISSING_BIP_LOGIC: {0}" -f (@($rows | Where-Object { -not $_.bip })).Count)


