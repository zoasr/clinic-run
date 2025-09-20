# Agent Guidelines for Clinic Run

## ⚠️ IMPORTANT: Agent Behavior

- **NEVER run commands on your own** - Always wait for explicit developer approval
- **Suggest commands only** - Provide command suggestions for developer to execute
- **Explain commands clearly** - When suggesting commands, explain what they do and why they're needed
- **Safety first** - Never execute potentially destructive operations without confirmation

## Build/Lint/Test Commands

- `bun run build` - Production build
- `bun run dev` - Development server
- `bun run dev:all` - Full stack dev server
- `bun run server` - Backend server only
- `bun run db:migrate` - Database migrations
- `bun run db:seed` - Seed database
- `bun run test:setup` - Setup test environment
- `bun run test:db:reset` - Reset test database

## Runtime

- use the `bun` runtime and package manager to install/run scripts and test
- **DO NOT USE**: Node.js, npm, pnpm, deno, yarn, (only use bun)

## Code Style Guidelines

- **TypeScript**: Strict mode enabled, ES2020 target, JSX transform
- **Imports**: Group by type (React, libraries, local), use `@/` path aliases
- **Naming**: PascalCase components/types, camelCase functions/variables, kebab-case files
- **Components**: Props interfaces, hooks at top, event handlers, effects, then render
- **Forms**: TanStack React Form with field validation
- **Styling**: Tailwind CSS with class-variance-authority for variants
- **State**: TanStack Query for server state, Context for global state
- **Error Handling**: tRPC error handling with toast notifications
- **Routing**: TanStack Router with file-based routing
- **Database**: Drizzle ORM with auto-generated types
- **Auth**: Better Auth with tRPC integration
- **Comments**: Avoid writing unnecessary comments. Only write essential and absolutely important comments when absolutely necessary, and only when they provide context or explanation for obscure or hard to understand code, or a workaround for a known problem

## File Organization

```
src/
  components/ui/    # shadcn/ui components
  routes/          # TanStack Router pages
  lib/             # Utilities, tRPC, database
  hooks/           # Custom React hooks
  contexts/        # React contexts
```

## Commit Messages

Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
