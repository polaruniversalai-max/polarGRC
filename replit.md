# PolarUniversal AI Agent Dashboard

## Overview

PolarUniversal is an AI-powered GRC (Governance, Risk, and Compliance) agent dashboard designed for institutional and financial environments. The application provides real-time blockchain audit verification with an autonomous compliance auditing system connected to the Movement Network (M1). It features a terminal-style interface with data-heavy visualizations optimized for hedge fund and banking professionals.

The application follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom ultra-dark institutional theme (charcoal, slate, electric blue color palette)
- **Design System**: Fluent Design (Microsoft) adapted for financial/enterprise dashboards with terminal authenticity and institutional trust aesthetics

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Build**: esbuild for production bundling with selective dependency bundling for cold start optimization

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Managed via `drizzle-kit push` command
- **Development Storage**: MemStorage class provides in-memory fallback for development

### Project Structure
```
├── client/           # React frontend application
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Data access layer
│   └── vite.ts       # Vite dev server integration
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle database schema
└── migrations/       # Database migrations
```

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets`

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### UI Framework
- **Radix UI**: Full suite of accessible, unstyled UI primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled component library using Radix primitives with "new-york" style variant
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration

### Frontend Libraries
- **TanStack React Query**: Data fetching and caching
- **React Hook Form + Zod**: Form handling with schema validation via `@hookform/resolvers`
- **date-fns**: Date manipulation
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **Recharts**: Charting library for data visualization
- **cmdk**: Command palette component
- **Vaul**: Drawer component

### Build Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server-side bundling
- **tsx**: TypeScript execution for development

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **express-session**: Session middleware