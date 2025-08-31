# Clinic System Service Registration Script
# This script registers the Clinic System as a Windows service

param(
    [switch]$Unregister,
    [switch]$Start,
    [switch]$Stop,
    [string]$ServiceName = "ClinicSystemService",
    [string]$DisplayName = "Clinic Management System",
    [string]$Description = "Clinic Management System Service"
)

# Configuration
$InstallDir = "$env:ProgramFiles\ClinicSystem"
$ExePath = "$InstallDir\bin\clinic-system.exe"

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

function Test-AdminRights {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Register-Service {
    Write-ColorOutput "Registering $DisplayName as a Windows service..." $Cyan

    # Check if service already exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-ColorOutput "Service '$ServiceName' already exists. Removing existing service..." $Yellow
        Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
        sc.exe delete $ServiceName
        Start-Sleep -Seconds 2
    }

    # Create the service
    $createResult = sc.exe create $ServiceName binPath= "`"$ExePath`"" start= auto DisplayName= "$DisplayName" obj= "LocalSystem"

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Service created successfully" $Green

        # Set service description
        sc.exe description $ServiceName "$Description"

        # Configure service recovery options
        sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000

        Write-ColorOutput "Service configured with automatic recovery" $Green
    } else {
        Write-ColorOutput "Failed to create service. Error code: $LASTEXITCODE" $Red
        exit 1
    }
}

function Unregister-Service {
    Write-ColorOutput "Unregistering $DisplayName service..." $Cyan

    # Check if service exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (!$existingService) {
        Write-ColorOutput "Service '$ServiceName' does not exist" $Yellow
        return
    }

    # Stop the service if running
    if ($existingService.Status -eq "Running") {
        Write-ColorOutput "Stopping service..." $Yellow
        Stop-Service -Name $ServiceName
    }

    # Delete the service
    $deleteResult = sc.exe delete $ServiceName

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Service unregistered successfully" $Green
    } else {
        Write-ColorOutput "Failed to unregister service. Error code: $LASTEXITCODE" $Red
        exit 1
    }
}

function Start-Service-Manual {
    Write-ColorOutput "Starting $DisplayName service..." $Cyan

    try {
        Start-Service -Name $ServiceName
        Write-ColorOutput "Service started successfully" $Green
    } catch {
        Write-ColorOutput "Failed to start service: $($_.Exception.Message)" $Red
        exit 1
    }
}

function Stop-Service-Manual {
    Write-ColorOutput "Stopping $DisplayName service..." $Cyan

    try {
        Stop-Service -Name $ServiceName
        Write-ColorOutput "Service stopped successfully" $Green
    } catch {
        Write-ColorOutput "Failed to stop service: $($_.Exception.Message)" $Red
        exit 1
    }
}

function Show-Service-Status {
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        Write-ColorOutput "Service Status:" $Cyan
        Write-ColorOutput "  Name: $($service.Name)" $White
        Write-ColorOutput "  Display Name: $($service.DisplayName)" $White
        Write-ColorOutput "  Status: $($service.Status)" $White
        Write-ColorOutput "  Start Type: $($service.StartType)" $White
    } else {
        Write-ColorOutput "Service '$ServiceName' is not registered" $Yellow
    }
}

# Main execution
Write-ColorOutput "=== Clinic System Service Manager ===" $Cyan
Write-ColorOutput ""

# Check admin rights
if (!(Test-AdminRights)) {
    Write-ColorOutput "This script requires administrator privileges." $Red
    Write-ColorOutput "Please run PowerShell as administrator and try again." $Yellow
    exit 1
}

# Check if executable exists
if (!(Test-Path $ExePath) -and !$Unregister) {
    Write-ColorOutput "Clinic System executable not found at: $ExePath" $Red
    Write-ColorOutput "Please ensure the application is installed first." $Yellow
    exit 1
}

try {
    if ($Unregister) {
        Unregister-Service
    } elseif ($Start) {
        Start-Service-Manual
    } elseif ($Stop) {
        Stop-Service-Manual
    } else {
        # Default action: register service
        Register-Service
        Show-Service-Status
    }

} catch {
    Write-ColorOutput "An error occurred: $($_.Exception.Message)" $Red
    exit 1
}

Write-ColorOutput "" $White
Write-ColorOutput "Service management completed successfully!" $Green

if (!$Unregister -and !$Start -and !$Stop) {
    Write-ColorOutput "" $White
    Write-ColorOutput "Next steps:" $Cyan
    Write-ColorOutput "1. The service is configured to start automatically" $White
    Write-ColorOutput "2. Access the application at http://localhost:3030" $White
    Write-ColorOutput "3. Use -Start/-Stop parameters to control the service manually" $White
    Write-ColorOutput "4. Use -Unregister to remove the service" $White
}