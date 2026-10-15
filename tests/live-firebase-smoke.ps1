param([string]$EnvironmentFile = '.env.local')

$ErrorActionPreference = 'Stop'
$values = @{}
Get-Content -LiteralPath $EnvironmentFile | ForEach-Object {
  if ($_ -match '^(NEXT_PUBLIC_FIREBASE_[A-Z_]+)=(.*)$') { $values[$Matches[1]] = $Matches[2] }
}
$apiKey = $values['NEXT_PUBLIC_FIREBASE_API_KEY']
$databaseUrl = $values['NEXT_PUBLIC_FIREBASE_DATABASE_URL']
if (-not $apiKey -or -not $databaseUrl) { throw 'Firebase public configuration is missing.' }

$users = [System.Collections.Generic.List[object]]::new()
$projectId = 'lumi-smoke-' + [Guid]::NewGuid().ToString('N').Substring(0, 12)
$projectPath = "$databaseUrl/hackathon/projects/$projectId.json"
$projectCreated = $false

function New-TestUser {
  $address = 'lumi-smoke-' + [Guid]::NewGuid().ToString('N') + '@example.com'
  $password = [Guid]::NewGuid().ToString('N') + 'Aa1!'
  $body = @{ email = $address; password = $password; returnSecureToken = $true } | ConvertTo-Json
  $user = Invoke-RestMethod -Method Post -ContentType 'application/json' -Body $body -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey"
  $users.Add($user)
  return $user
}

try {
  $owner = New-TestUser
  $other = New-TestUser
  $project = @{
    authorId = $owner.localId; authorName = 'Lumi smoke test'; title = 'Temporary link-only test';
    tagline = 'Verifying student publishing'; description = 'Temporary test record removed after verification.';
    category = 'Web Development'; technologies = @('React', 'Firebase');
    websiteUrl = 'https://lumi-maxmax.vercel.app/'; githubUrl = 'https://github.com/Raj-max-pixal/Lumi';
    imageUrls = @('https://api.dicebear.com/9.x/notionists/svg?seed=lumi-smoke');
    hackathonName = 'Lumi verification'; teamMembers = @('Lumi smoke test');
    createdAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  }
  Invoke-RestMethod -Method Put -ContentType 'application/json' -Body ($project | ConvertTo-Json -Depth 6 -Compress) -Uri "${projectPath}?auth=$($owner.idToken)" | Out-Null
  $projectCreated = $true
  $publicRecord = Invoke-RestMethod -Method Get -Uri $projectPath
  if ($publicRecord.title -ne $project.title -or $publicRecord.websiteUrl -ne $project.websiteUrl -or $publicRecord.githubUrl -ne $project.githubUrl -or $publicRecord.imageUrls[0] -ne $project.imageUrls[0]) { throw 'Public project data did not match the published record.' }
  try {
    Invoke-RestMethod -Method Patch -ContentType 'application/json' -Body '{"title":"Unauthorized edit"}' -Uri "${projectPath}?auth=$($other.idToken)" | Out-Null
    throw 'Security failure: another user edited the project.'
  } catch {
    if ($_.Exception.Message -like 'Security failure:*') { throw }
    if ([int]$_.Exception.Response.StatusCode -ne 401 -and [int]$_.Exception.Response.StatusCode -ne 403) { throw 'Unexpected response from the cross-user write check.' }
  }
  Write-Output 'PASS: Email/Password sign-up, link-only project write, public read, and cross-user write denial.'
} catch {
  Write-Output ('FAIL: ' + $_.Exception.Message.Split('?')[0])
  exit 1
} finally {
  if ($projectCreated) {
    try { Invoke-RestMethod -Method Delete -Uri "${projectPath}?auth=$($owner.idToken)" | Out-Null; Write-Output 'Removed temporary project.' }
    catch { Write-Output "WARNING: Could not remove temporary project $projectId." }
  }
  foreach ($user in $users) {
    try { Invoke-RestMethod -Method Post -ContentType 'application/json' -Body (@{ idToken = $user.idToken } | ConvertTo-Json) -Uri "https://identitytoolkit.googleapis.com/v1/accounts:delete?key=$apiKey" | Out-Null }
    catch { Write-Output 'WARNING: Could not remove one temporary Auth user.' }
  }
}
