$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectDirectory '.env'
if (Test-Path -LiteralPath $environmentFile) {
    throw '.env already exists. Edit it locally instead of overwriting existing credentials.'
}

Write-Host 'Configure ReportFlow local development credentials.'
Write-Host 'First create reportflow_user and reportflow_dev in PostgreSQL.'
Write-Host 'Enter the password you assigned to reportflow_user, not the administrator password.'
$securePassword = Read-Host 'reportflow_user password (hidden)' -AsSecureString
if ($securePassword.Length -eq 0) { throw 'A password is required.' }
$passwordPointer = [IntPtr]::Zero
try {
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $encodedPassword = [Uri]::EscapeDataString([Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer))
    $connectionLine = 'DATABASE_URL="postgresql://reportflow_user:' + $encodedPassword + '@localhost:5432/reportflow_dev?schema=public"'
    [IO.File]::WriteAllText($environmentFile, 'REPORTFLOW_MODE=local' + [Environment]::NewLine + $connectionLine + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
    Write-Host 'Saved .env locally. The password and connection URL have not been printed.'
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
    $encodedPassword = $null
    $connectionLine = $null
    $securePassword.Dispose()
}
