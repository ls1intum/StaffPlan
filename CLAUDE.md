# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Position Manager is a Strategic Staff and Budget Planning web application built with Spring Boot 4.0 (Java 25), Angular 21, PostgreSQL, and Keycloak for authentication.

## Build & Development Commands

### Server application (from project root)
```bash
./gradlew bootRun              # Run development server (port 8080)
./gradlew test                 # Run tests
./gradlew spotlessCheck        # Check Java code format
./gradlew spotlessApply        # Apply Java code formatter
./gradlew checkstyleMain       # Check JavaDoc/style
./gradlew bootJar              # Build production JAR
```

### Client web application (from src/main/webapp)
```bash
npm start                      # Run dev server (port 4200)
npm test                       # Run Vitest tests
npm run lint                   # Run ESLint
npm run prettier:check         # Check code format
npm run prettier:fix           # Apply Prettier formatting
npm run compile:ts             # TypeScript type checking
```

### Docker (from docker/)
```bash
docker compose up -d postgres keycloak    # Start database and auth for local dev
docker compose up -d                       # Start all services
```

## Architecture

### Server Structure (`src/main/java/de/tum/cit/aet/`)
- **core/config/**: Database, CORS, security configuration
- **core/security/**: JWT authentication, Keycloak integration, authorization
- **staffplan/**: Position management feature (domain, dto, repository, service, web)
- **usermanagement/**: User and research group management
- **util/**: Shared utilities and pagination helpers

Follows standard layered architecture: Web (REST controllers) → Service → Repository → Domain (JPA entities).

### Client Structure (`src/main/webapp/src/app/`)
- **core/security/**: KeycloakService, SecurityStore (signals-based auth state), guards, interceptors
- **features/**: Feature modules (landing, positions, admin)
- **app.routes.ts**: Lazy-loaded routes with auth guards

### Key Patterns
- **No `@Transactional` in server code**: Do NOT use `@Transactional` in service classes or controllers. Spring Boot's default auto-commit behavior is sufficient. The only exception is `@Transactional` on `@Modifying` repository query methods, which is required by Spring Data JPA.
- **DTOs**: Java records with `fromEntity()` factory methods
- **State Management**: Angular Signals (no NgRx) via `SecurityStore`
- **Change Detection**: OnPush everywhere with `signal()`, `computed()`, `input()`, `output()`
- **Security**: OAuth2 Resource Server with JWT validation from Keycloak; roles extracted from `resource_access` claim
- **Database**: Liquibase migrations in `src/main/resources/db/changelog/`

## Angular Conventions

- Standalone components only (no NgModules) - do NOT set `standalone: true` (it's the default in Angular 21+)
- Use new control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Always set `changeDetection: ChangeDetectionStrategy.OnPush`
- Use `host` object in decorator instead of `@HostBinding`/`@HostListener`
- Prefer Reactive forms over Template-driven forms
- Use `class` bindings instead of `ngClass`

## Test Users (Keycloak)

| Username   | Password   | Role        | Description |
|------------|------------|-------------|-------------|
| admin      | admin      | admin       | Full access |
| jobmanager | jobmanager | job_manager | Can manage positions |
| ml52sch    | schneider  | professor   | Prof. Maria Schneider (Machine Learning) |
| cv38web    | weber      | professor   | Prof. Thomas Weber (Computer Vision) |
| db45mue    | mueller    | professor   | Prof. Anna Mueller (Database Systems) |
| se29fis    | fischer    | professor   | Prof. Michael Fischer (Software Engineering) |
| ai61hof    | hoffmann   | professor   | Prof. Laura Hoffmann (Artificial Intelligence) |
| employee   | employee   | employee    | Can view positions |
| user       | user       | *(none)*    | No access (test) |

## Test Data

Test CSV files for development are in `docker/test-data/`:
- `research-groups-test.csv` - Research groups with professor assignments
- `positions-test.csv` - Staff positions linked to research groups

Import via admin UI at `/admin/research-groups` using "CSV Import" button.

## Configuration

- **Server**: `src/main/resources/config/application.yml` (base), `application-local.yml` (dev overrides)
- **Client**: `src/main/webapp/src/environments/environment.ts`
- **Keycloak realm**: `docker/keycloak/staffplan-realm.json`

## API Documentation

When the server is running: http://localhost:8080/swagger-ui.html
