# Linux Equivalents for Clinic Run Scripts

This document provides Linux equivalents for the Windows-specific scripts in the Clinic Run project.

## Overview

The original Windows scripts have been adapted for Linux systems with the following key changes:

- **Build Script**: Targets `bun-linux-x64` instead of `bun-windows-x64`
- **Service Management**: Uses systemd instead of Windows Services
- **Installer**: Creates Debian/RPM packages instead of Windows installer
- **Development**: Enhanced signal handling for Linux environment

## Scripts Created

### 1. `build.ts` (Cross-Platform)

**Auto-detects platform and builds accordingly**

**Key Features**:

- Auto-detects current platform (Windows/Linux/macOS)
- Compiles for appropriate target (`bun-windows-x64`, `bun-linux-x64`, `bun-darwin-x64`)
- Sets executable permissions on Unix-like systems
- Uses platform-specific metadata in build configuration

**Usage**:

```bash
bun run scripts/build.ts
```

### 2. `manage-service.sh`

**Windows Equivalent**: `register-service.ps1`

**Features**:

- Creates systemd service files
- Manages system user creation
- Provides comprehensive service management commands
- Includes security hardening settings

**Usage**:

```bash
# Register service (requires root)
sudo ./scripts/manage-service.sh register

# Other commands
sudo ./scripts/manage-service.sh start
sudo ./scripts/manage-service.sh stop
sudo ./scripts/manage-service.sh restart
sudo ./scripts/manage-service.sh status
sudo ./scripts/manage-service.sh logs
sudo ./scripts/manage-service.sh unregister
```

**Service Configuration**:

- Service name: `clinic-run`
- User: `clinic-run` (system user)
- Auto-start: Enabled
- Security: Hardened with systemd security features

### 3. `create-installer-linux.sh`

**Windows Equivalent**: `create-installer.ps1`

**Features**:

- Creates Debian (.deb) packages
- Creates RPM (.rpm) packages
- Generates manual install/uninstall scripts
- Includes systemd service integration
- Creates desktop entries

**Usage**:

```bash
# Create installer (requires root)
sudo ./scripts/create-installer-linux.sh [output-path] [version]

# Example
sudo ./scripts/create-installer-linux.sh ./installer-linux 1.0.0
```

**Package Installation**:

```bash
# Debian/Ubuntu
sudo dpkg -i clinic-run_1.0.0_amd64.deb
sudo apt-get install -f  # Fix dependencies

# RHEL/CentOS/Fedora
sudo rpm -i clinic-run-1.0.0-1.x86_64.rpm
```

### 4. `dev.ts` (Cross-Platform)

**Works on both Windows and Linux**

**Features**:

- Cross-platform development orchestrator
- Runs Vite frontend and Bun backend together
- Handles graceful shutdown on SIGINT/SIGTERM
- Works on both Windows and Linux without modification

**Usage**:

```bash
bun run scripts/dev.ts
```

## Directory Structure

### Linux Installation Paths

```
/opt/clinic-run/           # Application installation
├── bin/
│   └── clinic-run         # Executable
├── data/                    # Application data
├── backups/                 # Backup files
└── config/                  # Configuration files

/var/lib/clinic-run/      # Data directory
/var/backups/clinic-run/  # Backup directory
/etc/clinic-run/          # Configuration directory
/etc/systemd/system/         # Systemd service files
```

### Windows vs Linux Comparison

| Component              | Windows          | Linux              |
| ---------------------- | ---------------- | ------------------ |
| **Service Management** | Windows Services | systemd            |
| **User Management**    | Local System     | System user        |
| **Package Format**     | .exe installer   | .deb/.rpm packages |
| **Data Location**      | %PROGRAMDATA%    | /var/lib/          |
| **Configuration**      | Registry         | /etc/              |
| **Logs**               | Event Log        | journalctl         |

## Security Features

### Linux Security Enhancements

- **System User**: Runs as dedicated `clinic-run` user
- **File Permissions**: Proper ownership and permissions
- **systemd Security**:
    - `NoNewPrivileges=true`
    - `PrivateTmp=true`
    - `ProtectSystem=strict`
    - `ProtectHome=true`
- **Resource Limits**: NOFILE and NPROC limits

## Development Workflow

### Building for Linux

```bash
# Build for current platform (auto-detects Linux)
bun run scripts/build.ts

# Test locally
./dist/clinic-run
```

### Service Management During Development

```bash
# Install as service for testing
sudo ./scripts/manage-service.sh register

# Check status
sudo systemctl status clinic-run

# View logs
sudo journalctl -u clinic-run -f

# Uninstall when done
sudo ./scripts/manage-service.sh unregister
```

## Package Management Integration

### Debian Package Features

- Proper dependency management
- Pre/post installation scripts
- Desktop integration
- System user creation
- Service auto-start

### RPM Package Features

- Red Hat family compatibility
- Proper file ownership
- Service management
- Clean uninstallation

## Troubleshooting

### Common Issues

1. **Permission Denied**

    ```bash
    chmod +x scripts/*.sh
    ```

2. **Service Won't Start**

    ```bash
    sudo journalctl -u clinic-run -f
    ```

3. **Port Already in Use**

    ```bash
    sudo netstat -tlnp | grep :3030
    sudo kill -9 <PID>
    ```

4. **User Creation Issues**
    ```bash
    sudo userdel clinic-run
    sudo ./scripts/manage-service.sh register
    ```

## Migration from Windows

### Steps to Migrate

1. Build for current platform: `bun run scripts/build.ts`
2. Create installer: `sudo ./scripts/create-installer-linux.sh`
3. Install on target system
4. Configure service: `sudo ./scripts/manage-service.sh register`
5. Start service: `sudo systemctl start clinic-run`

### Data Migration

- Export data from Windows version
- Import to Linux version
- Verify database integrity
- Test all functionality

## Notes

- All Linux scripts require root privileges for installation/service management
- The scripts are designed to work on Ubuntu/Debian and RHEL/CentOS/Fedora
- Desktop integration is included for GUI environments
- All scripts include comprehensive error handling and colored output
- The systemd service includes automatic restart and security hardening
