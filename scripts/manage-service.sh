#!/bin/bash

# Clinic Run Service Management Script for Linux
# This script manages Clinic Run as a systemd service

# Configuration
SERVICE_NAME="clinic-run"
DISPLAY_NAME="Clinic Run"
DESCRIPTION="Clinic Run Service"
INSTALL_DIR="/opt/clinic-run"
EXE_PATH="$INSTALL_DIR/bin/clinic-run"
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
        print_color "This script requires root privileges." "$RED"
        print_color "Please run with sudo or as root." "$YELLOW"
        exit 1
    fi
}

# Function to check if executable exists
check_executable() {
    if [[ ! -f "$EXE_PATH" ]]; then
        print_color "Clinic Run executable not found at: $EXE_PATH" "$RED"
        print_color "Please ensure the application is installed first." "$YELLOW"
        exit 1
    fi
}

# Function to create system user
create_user() {
    print_color "Creating system user: $USER" "$CYAN"

    if ! id "$USER" &>/dev/null; then
        useradd --system --no-create-home --shell /bin/false "$USER"
        print_color "System user created successfully" "$GREEN"
    else
        print_color "System user already exists" "$YELLOW"
    fi
}

# Function to register service
register_service() {
    print_color "Registering $DISPLAY_NAME as a systemd service..." "$CYAN"

    # Check if service already exists
    if systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
        print_color "Service '$SERVICE_NAME' already exists. Removing existing service..." "$YELLOW"
        unregister_service
    fi

    # Create the service file
    cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=$DESCRIPTION
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER
Group=$GROUP
ExecStart=$EXE_PATH
WorkingDirectory=$INSTALL_DIR/bin
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR/data $INSTALL_DIR/backups

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"

    print_color "Service created and enabled successfully" "$GREEN"
    print_color "Service configured with automatic restart and security settings" "$GREEN"
}

# Function to unregister service
unregister_service() {
    print_color "Unregistering $DISPLAY_NAME service..." "$CYAN"

    # Check if service exists
    if ! systemctl list-unit-files | grep -q "^$SERVICE_NAME.service"; then
        print_color "Service '$SERVICE_NAME' does not exist" "$YELLOW"
        return
    fi

    # Stop and disable the service
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true

    # Remove the service file
    rm -f "/etc/systemd/system/$SERVICE_NAME.service"
    systemctl daemon-reload

    print_color "Service unregistered successfully" "$GREEN"
}

# Function to start service
start_service() {
    print_color "Starting $DISPLAY_NAME service..." "$CYAN"

    if systemctl start "$SERVICE_NAME"; then
        print_color "Service started successfully" "$GREEN"
    else
        print_color "Failed to start service" "$RED"
        exit 1
    fi
}

# Function to stop service
stop_service() {
    print_color "Stopping $DISPLAY_NAME service..." "$CYAN"

    if systemctl stop "$SERVICE_NAME"; then
        print_color "Service stopped successfully" "$GREEN"
    else
        print_color "Failed to stop service" "$RED"
        exit 1
    fi
}

# Function to show service status
show_status() {
    print_color "Service Status:" "$CYAN"
    systemctl status "$SERVICE_NAME" --no-pager -l
}

# Function to show service logs
show_logs() {
    print_color "Service Logs (last 50 lines):" "$CYAN"
    journalctl -u "$SERVICE_NAME" -n 50 --no-pager
}

# Main execution
print_color "=== Clinic Run Service Manager ===" "$CYAN"
print_color "" "$WHITE"

# Check root privileges
check_root

# Parse command line arguments
case "${1:-register}" in
    "register")
        check_executable
        create_user
        register_service
        show_status
        ;;
    "unregister")
        unregister_service
        ;;
    "start")
        start_service
        ;;
    "stop")
        stop_service
        ;;
    "restart")
        stop_service
        start_service
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        print_color "Usage: $0 [command]" "$WHITE"
        print_color "" "$WHITE"
        print_color "Commands:" "$WHITE"
        print_color "  register   - Register the service (default)" "$WHITE"
        print_color "  unregister - Unregister the service" "$WHITE"
        print_color "  start      - Start the service" "$WHITE"
        print_color "  stop       - Stop the service" "$WHITE"
        print_color "  restart    - Restart the service" "$WHITE"
        print_color "  status     - Show service status" "$WHITE"
        print_color "  logs       - Show service logs" "$WHITE"
        print_color "  help       - Show this help message" "$WHITE"
        exit 0
        ;;
    *)
        print_color "Unknown command: $1" "$RED"
        print_color "Use '$0 help' for usage information" "$YELLOW"
        exit 1
        ;;
esac

print_color "" "$WHITE"
print_color "Service management completed successfully!" "$GREEN"

if [[ "${1:-register}" == "register" ]]; then
    print_color "" "$WHITE"
    print_color "Next steps:" "$CYAN"
    print_color "1. The service is configured to start automatically on boot" "$WHITE"
    print_color "2. Access the application at http://localhost:3030" "$WHITE"
    print_color "3. Use 'systemctl start/stop/restart $SERVICE_NAME' to control the service" "$WHITE"
    print_color "4. Use 'journalctl -u $SERVICE_NAME -f' to follow logs" "$WHITE"
    print_color "5. Use '$0 unregister' to remove the service" "$WHITE"
fi
