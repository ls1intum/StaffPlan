# StaffPlan

Strategic Staff and Budget Planning - A web application for managing staff positions, research groups, and budget planning at research institutions.

## Overview

StaffPlan helps universities and research institutions:
- Track and visualize staff positions over time
- Find optimal position matches for new employees
- Manage research groups and their professors
- Plan budgets with salary grade calculations

**Tech Stack:**
- **Backend**: Spring Boot 4.0 (Java 25)
- **Frontend**: Angular 21 (standalone components, signals)
- **Database**: PostgreSQL 18
- **Authentication**: Keycloak 26 (OAuth2/OIDC)

## Quick Start

### Prerequisites

Before you begin, ensure you have installed:

| Tool | Version | Installation |
|------|---------|--------------|
| **Java** | 25+ | [Download](https://adoptium.net/) or use SDKMAN |
| **Node.js** | 24.x | [Download](https://nodejs.org/) or use nvm |
| **npm** | 11.x | Comes with Node.js |
| **Docker** | 24+ | [Download](https://www.docker.com/products/docker-desktop/) |
| **Docker Compose** | 2.x | Included with Docker Desktop |

Verify installations:
```bash
java --version    # Should show 25+
node --version    # Should show v24.x
npm --version     # Should show 11.x
docker --version  # Should show 24+
```

### Option 1: Full Docker Setup (Easiest)

Start all services with Docker Compose:

```bash
cd docker
docker compose up -d
```

Wait for all services to be healthy (about 60 seconds):
```bash
docker compose ps
```

Access the application:
| Service | URL |
|---------|-----|
| **Web App** | http://localhost:5173 |
| **API** | http://localhost:8080 |
| **Keycloak Admin** | http://localhost:8081/admin |

### Option 2: Development Setup (Recommended for Developers)

For active development with hot-reloading, run only infrastructure in Docker:

#### Step 1: Start PostgreSQL and Keycloak

```bash
cd docker
docker compose up -d postgres keycloak
```

Wait for Keycloak to be healthy:
```bash
# Check status (wait for "healthy")
docker compose ps

# If needed, view logs
docker compose logs -f keycloak
```

#### Step 2: Start the Backend Server

```bash
# From project root
./gradlew bootRun
```

The server starts at http://localhost:8080

#### Step 3: Start the Frontend

```bash
# From project root
cd src/main/webapp
npm install    # First time only
npm start
```

The Angular dev server starts at http://localhost:4200

### First Login

After the application is running:

1. Open http://localhost:4200 (dev) or http://localhost:5173 (Docker)
2. Click **Login**
3. Use one of the test accounts (see below)

## Test Users

Pre-configured accounts for testing different roles:

### Administrative Users

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `admin` | `admin` | Admin | Full access to all features |
| `jobmanager` | `jobmanager` | Job Manager | Position management and search |

### Professor Users (for testing professor workflows)

| Username | Password | Name | Research Group |
|----------|----------|------|----------------|
| `ml52sch` | `schneider` | Prof. Maria Schneider | Machine Learning |
| `cv38web` | `weber` | Prof. Thomas Weber | Computer Vision |
| `db45mue` | `mueller` | Prof. Anna Mueller | Database Systems |
| `se29fis` | `fischer` | Prof. Michael Fischer | Software Engineering |
| `ai61hof` | `hoffmann` | Prof. Laura Hoffmann | Artificial Intelligence |

### Other Test Users

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `employee` | `employee` | Employee | Read-only position access |
| `user` | `user` | None | Access denied (for testing) |

## Project Structure

```
StaffPlan/
├── docker/                          # Docker configuration
│   ├── docker-compose.yml           # Development compose file
│   ├── docker-compose-prod.yml      # Production compose file
│   ├── keycloak/
│   │   └── staffplan-realm.json     # Keycloak realm with users/clients
│   ├── postgres/
│   │   └── init-keycloak-db.sql     # Creates Keycloak database
│   ├── test-data/                   # Sample CSV files for testing
│   │   ├── research-groups-test.csv
│   │   └── positions-test.csv
│   ├── server.Dockerfile
│   └── client.Dockerfile
├── src/
│   ├── main/
│   │   ├── java/de/tum/cit/aet/    # Spring Boot application
│   │   │   ├── core/               # Core infrastructure
│   │   │   │   ├── config/         # Database, CORS, security config
│   │   │   │   └── security/       # JWT, authorization
│   │   │   ├── staffplan/          # Position management
│   │   │   │   ├── domain/         # JPA entities
│   │   │   │   ├── dto/            # Data transfer objects
│   │   │   │   ├── repository/     # Spring Data JPA repos
│   │   │   │   ├── service/        # Business logic
│   │   │   │   └── web/            # REST controllers
│   │   │   ├── usermanagement/     # Users & research groups
│   │   │   └── util/               # Shared utilities
│   │   ├── resources/
│   │   │   ├── config/             # Spring configuration
│   │   │   │   ├── application.yml
│   │   │   │   └── application-local.yml
│   │   │   └── db/changelog/       # Liquibase migrations
│   │   └── webapp/                 # Angular application
│   │       └── src/app/
│   │           ├── core/           # Security, guards, interceptors
│   │           ├── features/       # Feature modules
│   │           │   ├── admin/      # Admin pages
│   │           │   ├── landing/    # Public landing page
│   │           │   └── positions/  # Position views
│   │           └── shared/         # Shared components
│   └── test/                       # Tests
├── docs/
│   └── USER_GUIDE.md               # End-user documentation
├── build.gradle                    # Gradle build configuration
├── CLAUDE.md                       # AI assistant instructions
└── README.md                       # This file
```

## Development Guide

### Backend Development (Spring Boot)

#### Running the Server

```bash
# Development mode with hot reload
./gradlew bootRun

# With specific profile
./gradlew bootRun --args='--spring.profiles.active=local'
```

#### Build Commands

```bash
# Compile
./gradlew compileJava

# Run tests
./gradlew test

# Build production JAR
./gradlew bootJar

# Check code formatting
./gradlew spotlessCheck

# Apply code formatting
./gradlew spotlessApply

# Check code style (JavaDoc, etc.)
./gradlew checkstyleMain
```

#### Code Style

- Follow standard Java conventions
- Use Lombok annotations (`@Getter`, `@Setter`, `@RequiredArgsConstructor`)
- DTOs are Java records with `fromEntity()` factory methods
- Use `@Slf4j` for logging

#### Adding a New Entity

1. Create entity class in `domain/`
2. Create DTO record in `dto/`
3. Create repository interface in `repository/`
4. Create service class in `service/`
5. Create REST controller in `web/`
6. Add Liquibase migration in `resources/db/changelog/`

### Frontend Development (Angular)

#### Running the Client

```bash
cd src/main/webapp

# Install dependencies (first time)
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run compile:ts

# Lint
npm run lint

# Format code
npm run prettier:fix
```

#### Angular Conventions

This project uses Angular 21+ with modern patterns:

```typescript
// Component example
@Component({
  selector: 'app-example',
  template: `
    @if (loading()) {
      <p>Loading...</p>
    } @else {
      <p>Data: {{ data() }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  // Use signals for state
  data = signal<string>('');
  loading = signal(false);

  // Use computed for derived state
  displayText = computed(() => `Value: ${this.data()}`);

  // Use input/output functions
  id = input.required<string>();
  selected = output<string>();

  // Use inject() for dependencies
  private readonly service = inject(ExampleService);
}
```

**Key conventions:**
- Standalone components only (no NgModules)
- Do NOT set `standalone: true` (it's the default in Angular 21+)
- Use `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- Use `input()` and `output()` functions (not decorators)
- Always use `ChangeDetectionStrategy.OnPush`
- Use `host` object in decorator (not `@HostBinding`)
- Prefer reactive forms over template-driven forms

### Database

#### Liquibase Migrations

Migrations are in `src/main/resources/db/changelog/`:

```
001-changelog.xml          # Initial schema
002-grade-values.xml       # Salary grades
003-research-group-extensions.xml
004-professor-keycloak-mapping.xml
005-user-last-login.xml    # Login tracking
db.changelog-master.xml    # Master changelog
```

To add a new migration:
1. Create `00X-description.xml`
2. Add include to `db.changelog-master.xml`

#### Direct Database Access

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d staffplan
```

### Testing with Sample Data

Import test data after starting the application:

1. Login as `admin`
2. Go to **Research Groups** → **CSV Import**
3. Select `docker/test-data/research-groups-test.csv`
4. Go to **Positions** → **Import**
5. Select `docker/test-data/positions-test.csv`

## Configuration

### Application Properties

| File | Purpose |
|------|---------|
| `application.yml` | Base configuration (all environments) |
| `application-local.yml` | Local development overrides |
| `application-prod.yml` | Production settings |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/staffplan` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `staffplan` |
| `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI` | Keycloak issuer URI | `http://localhost:8081/realms/staffplan` |
| `KEYCLOAK_SERVICE_CLIENT_ID` | Service client ID | `staffplan-service-client` |
| `KEYCLOAK_SERVICE_CLIENT_SECRET` | Service client secret | (see application-local.yml) |

### Keycloak Configuration

The realm is auto-imported from `docker/keycloak/staffplan-realm.json` containing:
- Client configurations (`staffplan-client`, `staffplan-service-client`)
- Test users with roles
- Role definitions

To modify Keycloak:
1. Make changes in `staffplan-realm.json`
2. Reset Docker volumes: `docker compose down -v`
3. Restart: `docker compose up -d`

Or use the Keycloak Admin Console at http://localhost:8081/admin (admin/admin).

## API Documentation

When running locally, access the API documentation:

| Resource | URL |
|----------|-----|
| **Swagger UI** | http://localhost:8080/swagger-ui.html |
| **OpenAPI JSON** | http://localhost:8080/api-docs |

### Key API Endpoints

```
# Positions
GET    /v2/positions                    # List positions
POST   /v2/positions/import             # Import from CSV
DELETE /v2/positions                    # Delete positions

# Position Finder
POST   /v2/position-finder/search       # Search matching positions
GET    /v2/position-finder/relevance-types  # Get filter options

# Research Groups
GET    /v2/research-groups              # List groups
POST   /v2/research-groups              # Create group
PUT    /v2/research-groups/{id}         # Update group
POST   /v2/research-groups/import       # Import from CSV
POST   /v2/research-groups/batch-assign-positions  # Auto-assign

# Users
GET    /v2/users/me                     # Current user
GET    /v2/users                        # List all users (admin)
PUT    /v2/users/{id}/roles             # Update roles (admin)

# Grade Values
GET    /v2/grade-values                 # List grades
POST   /v2/grade-values                 # Create grade (admin)
PUT    /v2/grade-values/{id}            # Update grade (admin)
DELETE /v2/grade-values/{id}            # Delete grade (admin)
```

## Deployment

### CI/CD

Changes pushed to `main` are automatically deployed:

| Environment | URL | Branch |
|-------------|-----|--------|
| Staging | https://staffplan-dev.aet.cit.tum.de | `main` |
| Production | https://staffplan.aet.cit.tum.de | `main` |

### Manual Deployment

```bash
# Build production images
cd docker
docker compose -f docker-compose-prod.yml build

# Push to registry
docker compose -f docker-compose-prod.yml push
```

## Troubleshooting

### Common Issues

#### Keycloak won't start

```bash
# Check PostgreSQL is healthy first
docker compose ps
docker compose logs postgres

# Restart Keycloak
docker compose restart keycloak
```

#### "Invalid JWT" errors

The JWT issuer URI must match exactly:
- Docker internal: `http://keycloak:8081/realms/staffplan`
- Local development: `http://localhost:8081/realms/staffplan`

Check your `application.yml` or environment variables.

#### CORS errors

Add your origin to `staffplan.cors.allowed-origins` in `application.yml`:
```yaml
staffplan:
  cors:
    allowed-origins:
      - "http://localhost:4200"
      - "http://your-new-origin"
```

#### Database connection refused

```bash
# Ensure PostgreSQL is running
docker compose ps

# Check connection
docker compose exec postgres pg_isready
```

#### Port already in use

```bash
# Find and kill the process using the port
lsof -i :8080  # or :4200, :8081, :5432
kill -9 <PID>

# Or change the port in configuration
```

### Reset Everything

To completely reset the development environment:

```bash
cd docker

# Stop and remove all containers and volumes
docker compose down -v

# Remove any orphaned volumes
docker volume prune -f

# Start fresh
docker compose up -d
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f keycloak
docker compose logs -f postgres

# Spring Boot (when running locally)
# Logs appear in terminal

# Check application logs
tail -f build/logs/spring.log
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style guides
3. Run tests: `./gradlew test` and `npm test`
4. Run formatters: `./gradlew spotlessApply` and `npm run prettier:fix`
5. Submit a pull request

## Documentation

- **User Guide**: [docs/USER_GUIDE.md](docs/USER_GUIDE.md) - End-user documentation
- **API Docs**: http://localhost:8080/swagger-ui.html (when running)
- **AI Instructions**: [CLAUDE.md](CLAUDE.md) - For AI assistants

## License

This project is proprietary software for TUM (Technical University of Munich).

---

*For questions or issues, contact the development team.*
