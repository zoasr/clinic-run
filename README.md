# Clinic System App

A comprehensive offline clinic management system built with React, Bun, and SQLite(libsql).

## Features

- 👥 **Patient Management** - Complete patient records and profiles
- 📅 **Appointment Scheduling** - Calendar view and appointment management
- 📋 **Medical Records** - Detailed medical history and vital signs
- 💊 **Inventory Management** - Medication tracking with low stock alerts
- 🔐 **User Authentication** - Role-based access control
- 📊 **Dashboard Analytics** - Real-time clinic statistics
- 💾 **Offline First** - Works completely offline with SQLite database

## Quick Start

### Option 1: Run Executable (Recommended)

1. Build the executable:

```bash
chmod +x scripts/build-executable.sh
./scripts/build-executable.sh
```

2. Run the clinic system:

```bash
./clinic-system
```

### Option 2: Development Mode

1. Install dependencies:

```bash
bun install
```

2. Start the server:

```bash
bun run dev
```

### Option 3: Docker

```bash
docker-compose up -d
```

## Default Login

- **Username:** admin@clinic.local
- **Password:** admin123

## System Requirements

- **Deno** (recommended) or **Bun** for building executables
- **Node.js 18+** for development
- **SQLite(libsql)** (included)

## Build Targets

The system can be compiled for multiple platforms:

- **Windows:** `clinic-system.exe`
- **Linux:** `clinic-system`
- **macOS:** `clinic-system`

## Database

- **Type:** SQLite (local file)
- **Location:** `./data/clinic.db`
- **ORM:** Drizzle ORM
- **Migrations:** Automatic on startup

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/patients` - List patients
- `GET /api/appointments` - List appointments
- `GET /api/medical-records` - List medical records
- `GET /api/medications` - List medications
- `GET /api/dashboard/stats` - Dashboard statistics

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization

## License

MIT License - See LICENSE file for details
