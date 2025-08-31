# Clinic System Installer Script
# This script creates a Windows installer for the Clinic Management System

param(
    [string]$OutputPath = ".\installer",
    [string]$AppName = "ClinicSystem",
    [string]$Version = "1.0.0",
    [switch]$NoCleanup
)

# Configuration
$AppDisplayName = "Clinic Management System"
$AppDescription = "Complete clinic management solution with patient records, appointments, and billing"
$Publisher = "Clinic Software Inc."
$InstallDir = "$env:ProgramFiles\$AppName"
$StartMenuFolder = "$AppName"

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

function Create-InstallerStructure {
    Write-ColorOutput "Creating installer structure..." $Cyan

    # Create output directory
    if (!(Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath | Out-Null
    }

    # Create installer directories
    $installerDirs = @(
        "$OutputPath\bin",
        "$OutputPath\data",
        "$OutputPath\backups",
        "$OutputPath\config",
        "$OutputPath\scripts"
    )

    foreach ($dir in $installerDirs) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
        }
    }

    Write-ColorOutput "Installer structure created successfully" $Green
}

function Copy-ApplicationFiles {
    Write-ColorOutput "Copying application files..." $Cyan

    # Copy executable
    if (Test-Path ".\dist\clinic-system.exe") {
        Copy-Item ".\dist\clinic-system.exe" "$OutputPath\bin\" -Force
        Write-ColorOutput "Executable copied" $Green
    } else {
        Write-ColorOutput "Warning: Executable not found in .\dist\clinic-system.exe" $Yellow
    }

    # Copy static files
    if (Test-Path ".\dist") {
        Copy-Item ".\dist\*" "$OutputPath\bin\" -Recurse -Force -Exclude "*.exe"
        Write-ColorOutput "Static files copied" $Green
    }

    # Copy icon
    if (Test-Path ".\public\clinic.ico") {
        Copy-Item ".\public\clinic.ico" "$OutputPath\" -Force
        Write-ColorOutput "Application icon copied" $Green
    }

    # Create default config files
    $configContent = @"
{
    "version": "$Version",
    "installDate": "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "dataDirectory": "%PROGRAMDATA%\$AppName\Data",
    "backupDirectory": "%PROGRAMDATA%\$AppName\Backups",
    "autoStart": true,
    "backupIntervalHours": 24
}
"@

    $configContent | Out-File -FilePath "$OutputPath\config\app-config.json" -Encoding UTF8
    Write-ColorOutput "Configuration file created" $Green
}

function Create-UninstallScript {
    Write-ColorOutput "Creating uninstall script..." $Cyan

    $uninstallScript = @"
@echo off
echo Uninstalling $AppDisplayName...
echo.

REM Stop the application if running
taskkill /f /im clinic-system.exe >nul 2>&1

REM Remove installation directory
if exist "$InstallDir" (
    rmdir /s /q "$InstallDir"
    echo Installation directory removed.
)

REM Remove start menu entries
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\$StartMenuFolder" (
    rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\$StartMenuFolder"
    echo Start menu entries removed.
)

REM Remove desktop shortcut
if exist "%PUBLIC%\Desktop\$AppDisplayName.lnk" (
    del "%PUBLIC%\Desktop\$AppDisplayName.lnk"
    echo Desktop shortcut removed.
)

REM Remove registry entries
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName" /f >nul 2>&1
reg delete "HKCU\SOFTWARE\$Publisher\$AppName" /f >nul 2>&1

echo.
echo $AppDisplayName has been successfully uninstalled.
echo.
pause
"@

    $uninstallScript | Out-File -FilePath "$OutputPath\uninstall.bat" -Encoding ASCII
    Write-ColorOutput "Uninstall script created" $Green
}

function Create-InstallScript {
    Write-ColorOutput "Creating install script..." $Cyan

    $installScript = @"
@echo off
echo Installing $AppDisplayName $Version
echo ========================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrator privileges detected.
) else (
    echo This installer requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

echo Installing to: $InstallDir
echo.

REM Create installation directory
if not exist "$InstallDir" mkdir "$InstallDir"

REM cd into current script directory
cd /d %~dp0

REM Copy files
echo Copying files...
xcopy /e /i /y ".\bin" "$InstallDir\bin\" >nul
xcopy /e /i /y ".\data" "$InstallDir\data\" >nul 2>&1
xcopy /e /i /y ".\config" "$InstallDir\config\" >nul
copy "$AppName.ico" "$InstallDir\" >nul 2>&1

REM Create data directories
if not exist "%PROGRAMDATA%\$AppName\Data" mkdir "%PROGRAMDATA%\$AppName\Data"
if not exist "%PROGRAMDATA%\$AppName\Backups" mkdir "%PROGRAMDATA%\$AppName\Backups"
REM Create start menu shortcut
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\$StartMenuFolder" (
    mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\$StartMenuFolder"
)

echo Creating shortcuts...
powershell -Command "`$WshShell = New-Object -comObject WScript.Shell; `$Shortcut = `$WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\$StartMenuFolder\$AppDisplayName.lnk'); `$Shortcut.TargetPath = '$InstallDir\bin\clinic-system.exe'; `$Shortcut.WorkingDirectory = '$InstallDir\bin'; `$Shortcut.IconLocation = '$InstallDir\$AppName.ico'; `$Shortcut.Save()"

REM Create desktop shortcut
powershell -Command "`$WshShell = New-Object -comObject WScript.Shell; `$Shortcut = `$WshShell.CreateShortcut('%PUBLIC%\Desktop\$AppDisplayName.lnk'); `$Shortcut.TargetPath = '$InstallDir\bin\clinic-system.exe'; `$Shortcut.WorkingDirectory = '$InstallDir\bin'; `$Shortcut.IconLocation = '$InstallDir\$AppName.ico'; `$Shortcut.Save()"

REM Add to registry for Add/Remove Programs
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName" /v DisplayName /t REG_SZ /d "$AppDisplayName" /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName" /v DisplayVersion /t REG_SZ /d "$Version" /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName" /v Publisher /t REG_SZ /d "$Publisher" /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName" /v InstallLocation /t REG_SZ /d "$InstallDir" /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName" /v UninstallString /t REG_SZ /d "$InstallDir\uninstall.bat" /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName" /v NoModify /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$AppName" /v NoRepair /t REG_DWORD /d 1 /f

REM Copy uninstall script
copy "uninstall.bat" "$InstallDir\" >nul

echo.
echo Installation completed successfully!
echo.
echo You can now:
echo - Launch $AppDisplayName from the Start Menu
echo - Find the desktop shortcut
echo - Access the application at http://localhost:3030 (when running)
echo.
echo To uninstall, use Windows Add/Remove Programs or run:
echo $InstallDir\uninstall.bat
echo.
pause
"@

    $installScript | Out-File -FilePath "$OutputPath\install.bat" -Encoding ASCII
    Write-ColorOutput "Install script created" $Green
}

function Create-Readme {
    Write-ColorOutput "Creating README and documentation..." $Cyan

    $readmeContent = @"
# $AppDisplayName Installer

## Installation

1. Extract this installer package to a temporary location
2. Right-click on `install.bat` and select "Run as administrator"
3. Follow the installation prompts
4. The application will be installed to: $InstallDir

## First Run

After installation:
1. Launch $AppDisplayName from the Start Menu or desktop shortcut
2. The application will open in your default web browser
3. Default login credentials:
   - Username: admin
   - Password: admin123

## Features

- Complete clinic management system
- Patient records and appointment scheduling
- Medical records and prescription management
- Automated database backups
- Invoice and billing system

## Backup and Data

- Application data is stored in: %PROGRAMDATA%\$AppName\Data
- Automatic backups are created in: %PROGRAMDATA%\$AppName\Backups
- Backups are created every 24 hours automatically

## Uninstallation

To uninstall:
1. Use Windows Add/Remove Programs
2. Or run the uninstall script: $InstallDir\uninstall.bat

## Support

For support or questions, please contact your system administrator.

## Version Information

- Version: $Version
- Installed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

    $readmeContent | Out-File -FilePath "$OutputPath\README.md" -Encoding UTF8
    Write-ColorOutput "README created" $Green
}

function Create-ZipArchive {
    Write-ColorOutput "Creating installer archive..." $Cyan

    $zipPath = "$OutputPath\$AppName-Installer-$Version.zip"

    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    # Create zip archive
    Compress-Archive -Path "$OutputPath\*" -DestinationPath $zipPath -Force

    Write-ColorOutput "Installer archive created: $zipPath" $Green
}

# Main execution
Write-ColorOutput "=== $AppDisplayName Installer Creator ===" $Cyan
Write-ColorOutput "Version: $Version" $Yellow
Write-ColorOutput "" $White

# Check admin rights for installer creation
if (!(Test-AdminRights)) {
    Write-ColorOutput "Warning: Not running as administrator. Some features may not work correctly." $Yellow
}

try {
    Create-InstallerStructure
    Copy-ApplicationFiles
    Create-InstallScript
    Create-UninstallScript
    Create-Readme
    Create-ZipArchive

    Write-ColorOutput "    " $White
    Write-ColorOutput "=== Installer Creation Complete ===" $Green
    Write-ColorOutput "Installer package created in: $OutputPath" $Cyan
    Write-ColorOutput "Archive created: $AppName-Installer-$Version.zip" $Cyan
    Write-ColorOutput "    " $White
    Write-ColorOutput "To install on target machines:" $Yellow
    Write-ColorOutput "1. Extract the zip archive" $White
    Write-ColorOutput "2. Run install.bat as administrator" $White
    Write-ColorOutput "3. Follow the installation prompts" $White

} catch {
    Write-ColorOutput "Error creating installer: $($_.Exception.Message)" $Red
    exit 1
}

if (!$NoCleanup) {
    Write-ColorOutput "    " $White
    Write-ColorOutput "Cleaning up temporary files..." $Cyan
    # Note: In a real scenario, you might want to keep the installer directory
    # Remove-Item $OutputPath -Recurse -Force
    Write-ColorOutput "Cleanup completed" $Green
}

Write-ColorOutput "    " $White
Write-ColorOutput "Installation instructions have been saved to README.md" $Green