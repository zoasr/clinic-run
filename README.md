# Clinic Run

An homage to the now discontinued [hospitalrun](https://github.com/hospitalrun) project, built with React, Bun, and SQLite, and works entirely offline.

## Tech Stack

- **Frontend**: React 19 with TanStack Router
- **Backend**: Hono (web framework) with tRPC (Remote Procedure Calls)
- **Database**: SQLite with Drizzle ORM
- **Build Tool**: Bun
- **UI Framework**: Shadcn/ui with Tailwind CSS
- **Authentication**: Better Auth
- **State Management**: TanStack Query
- **Forms**: TanStack Form with Zod validation

## Prerequisites

- Bun (This project uses features that are available in Bun only)
- SQLite (included with Bun)

## Environment Variables

environment-specific configuration files. Copy the appropriate example file and customize it:

### Development Setup

1. Copy the development environment file:
```bash
cp .env.development.example .env.development
```

2. Generate a secure secret for authentication:
```bash
# Generate a random secret (Linux/Mac)
openssl rand -base64 32
```
Or use an online generator for BETTER_AUTH_SECRET: [here](https://www.better-auth.com/docs/installation#set-environment-variables)

3. Update the `.env.development` file with your values:
```bash
cp .env.production.example .env.production
```

### Production Setup

For production builds, use the build environment file:
```bash
cp .env.production.example .env.production
```

### Test Environment

For testing, use the test environment file:
```bash
cp .env.test.example .env.test
```

### Environment Variables Description

- `DB_FILE_NAME`: SQLite database file path
  - Development: `file:clinic.db`
  - Test: `clinic-test.db`
  - Production: `file:dist/clinic.db`
- `PORT`: Frontend development server port (default: `3030`)
- `BACKEND_PORT`: Backend server port (default: `3031`)
- `FRONTEND_URL`: Frontend application URL (default: `http://localhost:3030`)
- `VITE_SERVER_URL`: Server URL for frontend API calls (default: `http://localhost:3031`)
- `BETTER_AUTH_SECRET`: Secure secret for authentication (required)

> [!IMPORTANT]
> Before building you need to make sure that there is a `.env.build` file in the root directory. just run:
> ```bash
> cp .env.test.example .env.test
> ```

## Project Structure

```
clinic-run/
├── lib/                    # Backend/server code
│   ├── db/                # Database schemas and migrations
│   ├── routers/           # tRPC API routes
│   ├── auth.ts            # Authentication configuration
│   ├── server.ts          # Main server entry point
│   └── trpc.ts            # tRPC configuration
├── src/                   # Frontend React application
│   ├── components/        # Reusable UI components (Shadcn/ui)
│   ├── hooks/            # Custom React hooks
│   ├── routes/           # Application routes (TanStack Router)
│   ├── lib/              # Frontend utilities
│   └── main.tsx          # React application entry point
├── scripts/              # Build and development scripts
├── public/               # Static assets
├── dist/                 # Build output directory
├── drizzle.config.ts     # Database configuration
├── vite.config.ts        # Frontend build configuration
└── package.json          # Dependencies and scripts
```

### Key Files Description

- `lib/server.ts`: Main Hono server with tRPC integration
- `lib/auth.ts`: Better Auth configuration for user authentication
- `lib/db/`: Database schemas, migrations, and seed data
- `src/main.tsx`: React application entry point
- `src/routes/`: Application routes using TanStack Router
- `src/components/ui/`: Shadcn/ui components with Tailwind CSS
- `scripts/dev.ts`: Development orchestrator for frontend/backend
- `scripts/build.ts`: Production build script using Bun
- `drizzle.config.ts`: Database migration configuration

## Development Setup

1. Install dependencies:
```bash
bun install
```

2. Migrate database
```bash
bun run db:migrate
```
3. Seed database
```bash
bun run db:seed
```

4. Start development environment:
```bash
bun run dev:all
```

This starts both the frontend (vite on port 3030) and backend (port 3031).

## Available Scripts

| Script | Description | Environment |
|--------|-------------|-------------|
| `bun run build` | Production build using Bun - creates executable in `./dist/` | Production |
| `bun run dev` | Start Vite development server only (frontend) | Development |
| `bun run start` | Preview production build with Vite | Production |
| `bun run server` | Start backend server with hot reload | Development |
| `bun run dev:all` | Start both frontend and backend servers | Development |
| `bun run dev:test:all` | Start both frontend and backend in test mode | Test |
| `bun run db:generate` | Generate database migration files from schema | Development |
| `bun run db:migrate` | Run database migrations | Development |
| `bun run db:seed` | Seed database with initial data | Development |
| `bun run test:setup` | Setup complete test environment with database and seed data | Test |
| `bun run test:db:generate` | Generate test database migration files | Test |
| `bun run test:db:migrate` | Run test database migrations | Test |
| `bun run test:db:seed` | Seed test database with performance data | Test |
| `bun run test:db:reset` | Reset test database (remove, migrate, seed) | Test |
| `bun run test:perf` | Alias for test:db:reset (performance test setup) | Test |
| `bun run create-installer` | Create Windows installer package | Production |

### Script Categories

#### Development Scripts
- `dev:all` - Full development environment (frontend + backend)
- `dev` - Frontend only development
- `server` - Backend only development

#### Database Scripts
- `db:generate` - Create migration files from schema changes
- `db:migrate` - Apply migrations to database
- `db:seed` - Populate database with initial data

#### Test Scripts
- `test:setup` - Complete test environment setup
- `test:db:*` - Test database management
- `dev:test:all` - Run application in test mode

#### Build Scripts
- `build` - Create production executable
- `create-installer` - Generate Windows installer

## Testing Environment

1. Setup test environment:
```bash
bun run test:setup
```

This creates a test database with performance data.

2. Available test commands:
```bash
bun run test:db:reset    # Reset and reseed test database
bun run test:db:seed     # Reseed performance data only
bun run dev:test:all     # Run frontend and backend in test mode with the test environemnt variables
```

Test database location: `./clinic-test.db`

## Building and Packaging

> [!IMPORTANT]
> Before building you need to make sure that there is a `.env.build` file in the root directory.

### Build Executable

```bash
bun run build
```

This creates `./dist/clinic-system.exe` for Windows (for now).

### Create Windows Installer

```powershell
bun run create-installer
```

Creates a simple `.bat` installer and uninstaller scripts in the `./installer` .

## Running the Application

### Development
```bash
bun run dev:all
```

## Default Login

- Username: `admin@clinic.local` (only in dev mode, testing environment will give you login info in login screen)
- Password: `admin123`

## Database

- Type: SQLite (local file)
- Location: `./clinic.db` (development) or `./dist/clinic.db` (production) or `./clinic-test.db` (testing)
- ORM: Drizzle ORM

