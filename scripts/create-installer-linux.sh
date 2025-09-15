#!/bin/bash

# Clinic Run Linux Installer Script
# This script creates a Linux installer package for Clinic Run

# Configuration
OUTPUT_PATH="${1:-./installer-linux}"
APP_NAME="clinic-run"
VERSION="${2:-1.0.0}"
APP_DISPLAY_NAME="Clinic Run"
APP_DESCRIPTION="Complete clinic management solution with patient records, appointments, and billing"
PUBLISHER="Clinic Software Inc."
INSTALL_DIR="/opt/$APP_NAME"
DATA_DIR="/var/lib/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
CONFIG_DIR="/etc/$APP_NAME"
USER="clinic-run"
GROUP="clinic-run"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local message="$1"
    local color="$2"
    echo -e "${color}${message}${NC}"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_color "This script requires root privileges for installer creation." "$RED"
        print_color "Please run with sudo or as root." "$YELLOW"
        exit 1
    fi
}

# Function to create installer structure
create_installer_structure() {
    print_color "Creating installer structure..." "$CYAN"

    # Create output directory
    mkdir -p "$OUTPUT_PATH"

    # Create installer directories
    local installer_dirs=(
        "$OUTPUT_PATH/bin"
        "$OUTPUT_PATH/data"
        "$OUTPUT_PATH/backups"
        "$OUTPUT_PATH/config"
        "$OUTPUT_PATH/scripts"
        "$OUTPUT_PATH/debian"
        "$OUTPUT_PATH/rpm"
    )

    for dir in "${installer_dirs[@]}"; do
        mkdir -p "$dir"
    done

    print_color "Installer structure created successfully" "$GREEN"
}

# Function to copy application files
copy_application_files() {
    print_color "Copying application files..." "$CYAN"

    # Copy executable
    if [[ -f "./dist/clinic-run" ]]; then
        cp "./dist/clinic-run" "$OUTPUT_PATH/bin/"
        chmod +x "$OUTPUT_PATH/bin/clinic-run"
        print_color "Executable copied" "$GREEN"
    else
        print_color "Warning: Executable not found in ./dist/clinic-run" "$YELLOW"
    fi

    # Copy static files
    if [[ -d "./dist" ]]; then
        cp -r ./dist/* "$OUTPUT_PATH/bin/" 2>/dev/null || true
        # Remove the executable from the copied files to avoid duplication
        rm -f "$OUTPUT_PATH/bin/clinic-run"
        cp "./dist/clinic-run" "$OUTPUT_PATH/bin/"
        chmod +x "$OUTPUT_PATH/bin/clinic-run"
        print_color "Static files copied" "$GREEN"
    fi

    # Copy icon (convert to PNG for Linux)
    if [[ -f "./public/clinic.ico" ]]; then
        cp "./public/clinic.ico" "$OUTPUT_PATH/"
        print_color "Application icon copied" "$GREEN"
    fi

    # Create default config files
    cat > "$OUTPUT_PATH/config/app-config.json" << EOF
{
    "version": "$VERSION",
    "installDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "dataDirectory": "$DATA_DIR",
    "backupDirectory": "$BACKUP_DIR",
    "autoStart": true,
    "backupIntervalHours": 24
}
EOF

    print_color "Configuration file created" "$GREEN"
}

# Function to create systemd service file
create_systemd_service() {
    print_color "Creating systemd service file..." "$CYAN"

    cat > "$OUTPUT_PATH/config/$APP_NAME.service" << EOF
[Unit]
Description=$APP_DESCRIPTION
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER
Group=$GROUP
ExecStart=$INSTALL_DIR/bin/clinic-run
WorkingDirectory=$INSTALL_DIR/bin
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$APP_NAME

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR $BACKUP_DIR

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

    print_color "Systemd service file created" "$GREEN"
}

# Function to create Debian package
create_debian_package() {
    print_color "Creating Debian package..." "$CYAN"

    local debian_dir="$OUTPUT_PATH/debian"
    local package_name="${APP_NAME}_${VERSION}_amd64"
    local package_dir="$OUTPUT_PATH/$package_name"

    # Create package directory structure
    mkdir -p "$package_dir/DEBIAN"
    mkdir -p "$package_dir$INSTALL_DIR/bin"
    mkdir -p "$package_dir$DATA_DIR"
    mkdir -p "$package_dir$BACKUP_DIR"
    mkdir -p "$package_dir$CONFIG_DIR"
    mkdir -p "$package_dir/etc/systemd/system"
    mkdir -p "$package_dir/usr/share/applications"
    mkdir -p "$package_dir/usr/share/pixmaps"

    # Copy files
    cp "$OUTPUT_PATH/bin/clinic-run" "$package_dir$INSTALL_DIR/bin/"
    cp "$OUTPUT_PATH/config/app-config.json" "$package_dir$CONFIG_DIR/"
    cp "$OUTPUT_PATH/config/$APP_NAME.service" "$package_dir/etc/systemd/system/"

    # Create control file
    cat > "$package_dir/DEBIAN/control" << EOF
Package: $APP_NAME
Version: $VERSION
Section: misc
Priority: optional
Architecture: amd64
Depends: libc6 (>= 2.28)
Maintainer: $PUBLISHER <support@clinic-software.com>
Description: $APP_DESCRIPTION
 Complete clinic management solution with patient records,
 appointments, medical records, prescription management,
 automated database backups, and invoice/billing system.
 .
 Features:
  - Patient management and records
  - Appointment scheduling
  - Medical records and prescriptions
  - Automated backups
  - Invoice and billing system
  - Web-based interface
EOF

    # Create postinst script
    cat > "$package_dir/DEBIAN/postinst" << EOF
#!/bin/bash
set -e

# Create system user
if ! id "$USER" &>/dev/null; then
    useradd --system --no-create-home --shell /bin/false "$USER"
fi

# Create directories
mkdir -p "$DATA_DIR" "$BACKUP_DIR"
chown "$USER:$GROUP" "$DATA_DIR" "$BACKUP_DIR"
chmod 755 "$DATA_DIR" "$BACKUP_DIR"

# Enable and start service
systemctl daemon-reload
systemctl enable "$APP_NAME"
systemctl start "$APP_NAME"

echo "$APP_DISPLAY_NAME has been installed successfully!"
echo "Access the application at http://localhost:3030"
echo "Default login: admin / admin123"

exit 0
EOF

    # Create prerm script
    cat > "$package_dir/DEBIAN/prerm" << EOF
#!/bin/bash
set -e

# Stop service
systemctl stop "$APP_NAME" 2>/dev/null || true
systemctl disable "$APP_NAME" 2>/dev/null || true

exit 0
EOF

    # Create postrm script
    cat > "$package_dir/DEBIAN/postrm" << EOF
#!/bin/bash
set -e

if [ "\$1" = "purge" ]; then
    # Remove user
    userdel "$USER" 2>/dev/null || true

    # Remove directories
    rm -rf "$DATA_DIR" "$BACKUP_DIR" "$CONFIG_DIR"
fi

exit 0
EOF

    # Make scripts executable
    chmod +x "$package_dir/DEBIAN/postinst"
    chmod +x "$package_dir/DEBIAN/prerm"
    chmod +x "$package_dir/DEBIAN/postrm"

    # Create desktop entry
    cat > "$package_dir/usr/share/applications/$APP_NAME.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$APP_DISPLAY_NAME
Comment=$APP_DESCRIPTION
Exec=$INSTALL_DIR/bin/clinic-run
Icon=$APP_NAME
Terminal=false
Categories=Office;Medical;
StartupNotify=true
EOF

    # Build the package
    dpkg-deb --build "$package_dir"

    print_color "Debian package created: $package_name.deb" "$GREEN"
}

# Function to create RPM package
create_rpm_package() {
    print_color "Creating RPM package..." "$CYAN"

    local rpm_dir="$OUTPUT_PATH/rpm"
    local spec_file="$rpm_dir/$APP_NAME.spec"

    # Create spec file
    cat > "$spec_file" << EOF
Name:           $APP_NAME
Version:        $VERSION
Release:        1%{?dist}
Summary:        $APP_DESCRIPTION

License:        Proprietary
URL:            https://clinic-software.com
Source0:        %{name}-%{version}.tar.gz

BuildArch:      x86_64
Requires:       glibc >= 2.28

%description
$APP_DESCRIPTION

Complete clinic management solution with patient records,
appointments, medical records, prescription management,
automated database backups, and invoice/billing system.

Features:
- Patient management and records
- Appointment scheduling
- Medical records and prescriptions
- Automated backups
- Invoice and billing system
- Web-based interface

%prep
%setup -q

%build
# No build step needed - binary included

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}$INSTALL_DIR/bin
mkdir -p %{buildroot}$DATA_DIR
mkdir -p %{buildroot}$BACKUP_DIR
mkdir -p %{buildroot}$CONFIG_DIR
mkdir -p %{buildroot}/etc/systemd/system
mkdir -p %{buildroot}/usr/share/applications

install -m 755 bin/clinic-run %{buildroot}$INSTALL_DIR/bin/
install -m 644 config/app-config.json %{buildroot}$CONFIG_DIR/
install -m 644 config/$APP_NAME.service %{buildroot}/etc/systemd/system/

%post
# Create system user
if ! id "$USER" &>/dev/null; then
    useradd --system --no-create-home --shell /bin/false "$USER"
fi

# Create directories
mkdir -p "$DATA_DIR" "$BACKUP_DIR"
chown "$USER:$GROUP" "$DATA_DIR" "$BACKUP_DIR"
chmod 755 "$DATA_DIR" "$BACKUP_DIR"

# Enable and start service
systemctl daemon-reload
systemctl enable "$APP_NAME"
systemctl start "$APP_NAME"

echo "$APP_DISPLAY_NAME has been installed successfully!"
echo "Access the application at http://localhost:3030"
echo "Default login: admin / admin123

%preun
# Stop service
systemctl stop "$APP_NAME" 2>/dev/null || true
systemctl disable "$APP_NAME" 2>/dev/null || true

%postun
if [ \$1 -eq 0 ]; then
    # Remove user
    userdel "$USER" 2>/dev/null || true

    # Remove directories
    rm -rf "$DATA_DIR" "$BACKUP_DIR" "$CONFIG_DIR"
fi

%files
$INSTALL_DIR/bin/clinic-run
$CONFIG_DIR/app-config.json
/etc/systemd/system/$APP_NAME.service
%defattr(-,root,root,-)

%changelog
* $(date +'%a %b %d %Y') $PUBLISHER <support@clinic-software.com> - $VERSION-1
- Initial package release
EOF

    print_color "RPM spec file created" "$GREEN"
}

# Function to create install script
create_install_script() {
    print_color "Creating install script..." "$CYAN"

    cat > "$OUTPUT_PATH/install.sh" << EOF
#!/bin/bash

# Clinic System Linux Installer
# This script installs the Clinic Management System on Linux

set -e

# Configuration
APP_NAME="$APP_NAME"
APP_DISPLAY_NAME="$APP_DISPLAY_NAME"
VERSION="$VERSION"
INSTALL_DIR="$INSTALL_DIR"
DATA_DIR="$DATA_DIR"
BACKUP_DIR="$BACKUP_DIR"
CONFIG_DIR="$CONFIG_DIR"
USER="$USER"
GROUP="$GROUP"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

print_color() {
    local message="\$1"
    local color="\$2"
    echo -e "\${color}\${message}\${NC}"
}

# Check if running as root
if [[ \$EUID -ne 0 ]]; then
    print_color "This installer requires root privileges." "\$RED"
    print_color "Please run with sudo or as root." "\$YELLOW"
    exit 1
fi

print_color "Installing \$APP_DISPLAY_NAME \$VERSION" "\$CYAN"
print_color "========================================" "\$CYAN"
print_color "" "\$WHITE"

# Create system user
print_color "Creating system user..." "\$CYAN"
if ! id "\$USER" &>/dev/null; then
    useradd --system --no-create-home --shell /bin/false "\$USER"
    print_color "System user created" "\$GREEN"
else
    print_color "System user already exists" "\$YELLOW"
fi

# Create directories
print_color "Creating directories..." "\$CYAN"
mkdir -p "\$INSTALL_DIR/bin"
mkdir -p "\$DATA_DIR"
mkdir -p "\$BACKUP_DIR"
mkdir -p "\$CONFIG_DIR"

# Copy files
print_color "Copying application files..." "\$CYAN"
cp bin/clinic-run "\$INSTALL_DIR/bin/"
cp config/app-config.json "\$CONFIG_DIR/"
cp config/\$APP_NAME.service /etc/systemd/system/

# Set permissions
chmod +x "\$INSTALL_DIR/bin/clinic-run"
chown -R "\$USER:\$GROUP" "\$DATA_DIR" "\$BACKUP_DIR" "\$CONFIG_DIR"
chmod 755 "\$DATA_DIR" "\$BACKUP_DIR"

# Enable and start service
print_color "Configuring systemd service..." "\$CYAN"
systemctl daemon-reload
systemctl enable "\$APP_NAME"
systemctl start "\$APP_NAME"

print_color "" "\$WHITE"
print_color "Installation completed successfully!" "\$GREEN"
print_color "" "\$WHITE"
print_color "Next steps:" "\$CYAN"
print_color "1. Access the application at http://localhost:3030" "\$WHITE"
print_color "2. Default login credentials:" "\$WHITE"
print_color "   Username: admin" "\$WHITE"
print_color "   Password: admin123" "\$WHITE"
print_color "3. The service will start automatically on boot" "\$WHITE"
print_color "4. Use 'systemctl start/stop/restart \$APP_NAME' to control the service" "\$WHITE"
print_color "5. Use 'journalctl -u \$APP_NAME -f' to follow logs" "\$WHITE"
EOF

    chmod +x "$OUTPUT_PATH/install.sh"
    print_color "Install script created" "$GREEN"
}

# Function to create uninstall script
create_uninstall_script() {
    print_color "Creating uninstall script..." "$CYAN"

    cat > "$OUTPUT_PATH/uninstall.sh" << EOF
#!/bin/bash

# Clinic System Linux Uninstaller
# This script removes the Clinic Management System from Linux

set -e

# Configuration
APP_NAME="$APP_NAME"
APP_DISPLAY_NAME="$APP_DISPLAY_NAME"
INSTALL_DIR="$INSTALL_DIR"
DATA_DIR="$DATA_DIR"
BACKUP_DIR="$BACKUP_DIR"
CONFIG_DIR="$CONFIG_DIR"
USER="$USER"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

print_color() {
    local message="\$1"
    local color="\$2"
    echo -e "\${color}\${message}\${NC}"
}

# Check if running as root
if [[ \$EUID -ne 0 ]]; then
    print_color "This uninstaller requires root privileges." "\$RED"
    print_color "Please run with sudo or as root." "\$YELLOW"
    exit 1
fi

print_color "Uninstalling \$APP_DISPLAY_NAME..." "\$CYAN"
print_color "" "\$WHITE"

# Stop and disable service
print_color "Stopping service..." "\$CYAN"
systemctl stop "\$APP_NAME" 2>/dev/null || true
systemctl disable "\$APP_NAME" 2>/dev/null || true

# Remove service file
rm -f "/etc/systemd/system/\$APP_NAME.service"
systemctl daemon-reload

# Remove installation directory
if [[ -d "\$INSTALL_DIR" ]]; then
    print_color "Removing installation directory..." "\$CYAN"
    rm -rf "\$INSTALL_DIR"
fi

# Remove data directories (with confirmation)
if [[ -d "\$DATA_DIR" || -d "\$BACKUP_DIR" || -d "\$CONFIG_DIR" ]]; then
    print_color "Data directories found:" "\$YELLOW"
    [[ -d "\$DATA_DIR" ]] && print_color "  Data: \$DATA_DIR" "\$WHITE"
    [[ -d "\$BACKUP_DIR" ]] && print_color "  Backups: \$BACKUP_DIR" "\$WHITE"
    [[ -d "\$CONFIG_DIR" ]] && print_color "  Config: \$CONFIG_DIR" "\$WHITE"
    print_color "" "\$WHITE"
    read -p "Do you want to remove all data? (y/N): " -n 1 -r
    echo
    if [[ \$REPLY =~ ^[Yy]\$ ]]; then
        rm -rf "\$DATA_DIR" "\$BACKUP_DIR" "\$CONFIG_DIR"
        print_color "Data directories removed" "\$GREEN"
    else
        print_color "Data directories preserved" "\$YELLOW"
    fi
fi

# Remove system user
if id "\$USER" &>/dev/null; then
    print_color "Removing system user..." "\$CYAN"
    userdel "\$USER" 2>/dev/null || true
fi

print_color "" "\$WHITE"
print_color "\$APP_DISPLAY_NAME has been successfully uninstalled!" "\$GREEN"
EOF

    chmod +x "$OUTPUT_PATH/uninstall.sh"
    print_color "Uninstall script created" "$GREEN"
}

# Function to create README
create_readme() {
    print_color "Creating README and documentation..." "$CYAN"

    cat > "$OUTPUT_PATH/README.md" << EOF
# $APP_DISPLAY_NAME Linux Installer

## Installation

### Option 1: Package Installation (Recommended)

#### Debian/Ubuntu
\`\`\`bash
sudo dpkg -i $APP_NAME_${VERSION}_amd64.deb
sudo apt-get install -f  # Fix dependencies if needed
\`\`\`

#### RHEL/CentOS/Fedora
\`\`\`bash
sudo rpm -i $APP_NAME-$VERSION-1.x86_64.rpm
\`\`\`

### Option 2: Manual Installation

1. Extract this installer package to a temporary location
2. Run the install script as root:
   \`\`\`bash
   sudo ./install.sh
   \`\`\`

## First Run

After installation:
1. The service will start automatically
2. Access the application at http://localhost:3030
3. Default login credentials:
   - Username: admin
   - Password: admin123

## Features

- Complete clinic management system
- Patient records and appointment scheduling
- Medical records and prescription management
- Automated database backups
- Invoice and billing system
- Web-based interface

## Service Management

The application runs as a systemd service:

\`\`\`bash
# Check status
sudo systemctl status $APP_NAME

# Start/stop/restart
sudo systemctl start $APP_NAME
sudo systemctl stop $APP_NAME
sudo systemctl restart $APP_NAME

# View logs
sudo journalctl -u $APP_NAME -f
\`\`\`

## Backup and Data

- Application data: $DATA_DIR
- Automatic backups: $BACKUP_DIR
- Configuration: $CONFIG_DIR
- Backups are created every 24 hours automatically

## Uninstallation

### Package Uninstallation

#### Debian/Ubuntu
\`\`\`bash
sudo apt-get remove $APP_NAME
\`\`\`

#### RHEL/CentOS/Fedora
\`\`\`bash
sudo rpm -e $APP_NAME
\`\`\`

### Manual Uninstallation
\`\`\`bash
sudo ./uninstall.sh
\`\`\`

## Support

For support or questions, please contact your system administrator.

## Version Information

- Version: $VERSION
- Created: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

    print_color "README created" "$GREEN"
}

# Function to create archive
create_archive() {
    print_color "Creating installer archive..." "$CYAN"

    local archive_name="$APP_NAME-installer-linux-$VERSION.tar.gz"
    local archive_path="$OUTPUT_PATH/$archive_name"

    # Create archive excluding the archive itself
    tar -czf "$archive_path" -C "$OUTPUT_PATH" \
        --exclude="$archive_name" \
        bin config scripts install.sh uninstall.sh README.md *.deb *.rpm *.spec

    print_color "Installer archive created: $archive_name" "$GREEN"
}

# Main execution
print_color "=== $APP_DISPLAY_NAME Linux Installer Creator ===" "$CYAN"
print_color "Version: $VERSION" "$YELLOW"
print_color "" "$WHITE"

# Check root privileges
check_root

try {
    create_installer_structure
    copy_application_files
    create_systemd_service
    create_debian_package
    create_rpm_package
    create_install_script
    create_uninstall_script
    create_readme
    create_archive

    print_color "" "$WHITE"
    print_color "=== Installer Creation Complete ===" "$GREEN"
    print_color "Installer package created in: $OUTPUT_PATH" "$CYAN"
    print_color "Archive created: $APP_NAME-installer-linux-$VERSION.tar.gz" "$CYAN"
    print_color "" "$WHITE"
    print_color "To install on target machines:" "$YELLOW"
    print_color "1. Extract the tar.gz archive" "$WHITE"
    print_color "2. Use package manager (dpkg/rpm) or run install.sh as root" "$WHITE"
    print_color "3. Follow the installation prompts" "$WHITE"

} catch {
    print_color "Error creating installer: $?" "$RED"
    exit 1
}

print_color "" "$WHITE"
print_color "Installation instructions have been saved to README.md" "$GREEN"
