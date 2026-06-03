# Clinic Run Installer Script
# This script checks for Inno Setup and creates a Windows installer

$ErrorActionPreference = "Stop"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Check if Inno Setup is installed
Write-ColorOutput "Checking for Inno Setup installation..." $Cyan

# Check common installation paths
$innosetupPaths = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles(x86)}\Inno Setup 5\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 5\ISCC.exe"
)

$isccPath = $null
foreach ($path in $innosetupPaths) {
    if (Test-Path $path) {
        $isccPath = $path
        break
    }
}

# Also check if iscc is in PATH
if (-not $isccPath) {
    try {
        $isccPath = (Get-Command iscc -ErrorAction SilentlyContinue).Source
    } catch {
        # iscc not in PATH
    }
}

if (-not $isccPath) {
    Write-ColorOutput "Inno Setup is not installed or not found in PATH." $Red
    Write-ColorOutput "" $White
    Write-ColorOutput "Please install Inno Setup to create the installer:" $Yellow
    Write-ColorOutput "https://jrsoftware.org/isdl.php" $Cyan
    Write-ColorOutput "" $White
    Write-ColorOutput "After installation, run this script again." $Yellow
    exit 1
}

Write-ColorOutput "Inno Setup found at: $isccPath" $Green

# Check if build exists
Write-ColorOutput "Checking for build output..." $Cyan
if (-not (Test-Path ".\dist\clinic-run.exe")) {
    Write-ColorOutput "Build output not found. Please run 'bun run build' first." $Red
    exit 1
}

Write-ColorOutput "Build output found." $Green

# Run Inno Setup compiler
Write-ColorOutput "Creating Windows installer..." $Cyan
$issScript = ".\scripts\clinic-run.iss"

if (-not (Test-Path $issScript)) {
    Write-ColorOutput "Installer script not found: $issScript" $Red
    exit 1
}

try {
    & $isccPath $issScript
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "" $White
        Write-ColorOutput "=== Installer Created Successfully ===" $Green
        Write-ColorOutput "Installer location: .\scripts\Output\ClinicRun-Setup.exe" $Cyan
    } else {
        Write-ColorOutput "Installer creation failed with exit code: $LASTEXITCODE" $Red
        exit $LASTEXITCODE
    }
} catch {
    Write-ColorOutput "Error creating installer: $($_.Exception.Message)" $Red
    exit 1
}
