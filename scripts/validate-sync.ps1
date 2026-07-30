$ErrorActionPreference = 'Stop'

$config = Get-Content -Raw (Join-Path $PSScriptRoot '..\data\nur-ai.config.json') | ConvertFrom-Json
$workflow = Get-Content -Raw (Join-Path $PSScriptRoot '..\workflows\content-chain.json') | ConvertFrom-Json
$index = Get-Content -Raw (Join-Path $PSScriptRoot '..\index.html')

$expectedAgents = @('maryam', 'aisha', 'ahmad')
$actualAgents = @($config.agents.id)
if (Compare-Object $expectedAgents $actualAgents) {
  throw 'Agent configuration must contain exactly Maryam, Aisha, and Ahmad.'
}

$expectedSequence = @('maryam', 'aisha', 'ahmad', 'maryam')
$actualSequence = @($workflow.sequence.agent)
if (Compare-Object $expectedSequence $actualSequence -SyncWindow 0) {
  throw 'Workflow sequence must be Maryam -> Aisha -> Ahmad -> Maryam.'
}

foreach ($agent in @('Maryam', 'Aisha', 'Ahmad')) {
  if ($index -notmatch [regex]::Escape($agent)) {
    throw "index.html does not contain $agent."
  }
}

if ($index -match '\{\{\s*(agent|step)\.') {
  throw 'Unresolved public template placeholder found.'
}

Write-Output 'Sync validation passed: JSON parses, agent chain is correct, and public agent content is present.'
